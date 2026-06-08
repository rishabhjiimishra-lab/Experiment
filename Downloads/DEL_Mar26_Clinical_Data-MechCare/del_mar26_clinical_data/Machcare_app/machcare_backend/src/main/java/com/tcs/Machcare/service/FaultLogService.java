package com.tcs.Machcare.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.tcs.Machcare.dto.CsvUploadResponse;
import com.tcs.Machcare.dto.FaultDTO;
import com.tcs.Machcare.entity.FaultLog;
import com.tcs.Machcare.entity.MachineAlert;
import com.tcs.Machcare.entity.Priority;
import com.tcs.Machcare.entity.Severity;
import com.tcs.Machcare.exception.CsvValidationException;
import com.tcs.Machcare.exception.ResourceNotFoundException;
import com.tcs.Machcare.repository.FaultLogRepository;
import com.tcs.Machcare.repository.MachineAlertRepository;
import com.tcs.Machcare.service.AuthenticatedUserService.AuthenticatedUser;

@Service
public class FaultLogService {

    private final FaultLogRepository repository;
    private final PriorityQueueService priorityQueueService;
    private final MachineAlertRepository alertRepository;
    private final RealtimeNotificationService realtimeNotificationService;

    public FaultLogService(
            FaultLogRepository repository,
            PriorityQueueService priorityQueueService,
            MachineAlertRepository alertRepository,
            RealtimeNotificationService realtimeNotificationService) {
        this.repository = repository;
        this.priorityQueueService = priorityQueueService;
        this.alertRepository = alertRepository;
        this.realtimeNotificationService = realtimeNotificationService;
    }

    private synchronized String generateFaultId() {
        List<FaultLog> faultLogs = repository.findAll();
        int max = 1000;

        for (FaultLog fault : faultLogs) {
            String id = fault.getFaultId();
            if (id != null && id.startsWith("F-")) {
                try {
                    int number = Integer.parseInt(id.substring(2));
                    if (number > max) {
                        max = number;
                    }
                } catch (Exception e) {
                    // ignore invalid old IDs
                }
            }
        }
        return "F-" + (max + 1);
    }

    public String getNextFaultId() {
        return generateFaultId();
    }

    public LocalDateTime getCurrentTimestamp() {
        return LocalDateTime.now();
    }

    private Severity parseSeverity(String value) {
        for (Severity severity : Severity.values()) {
            if (severity.name().equalsIgnoreCase(value)) {
                return severity;
            }
        }
        throw new IllegalArgumentException("Invalid severity");
    }

    public FaultLog createFault(FaultDTO dto, Long empId, String empName) {
        validateFaultRequest(dto);

        FaultLog faultLog = new FaultLog();

        faultLog.setFaultId(generateFaultId());
        faultLog.setMachineId(dto.getMachineId());
        faultLog.setDescription(dto.getDescription());
        faultLog.setSeverity(parseSeverity(dto.getSeverity()));
        faultLog.setReportedBy(empId);
        faultLog.setReportedByName(empName);
        faultLog.setFaultDate(LocalDate.now());
        faultLog.setFaultTime(LocalTime.now().withNano(0));

        FaultLog savedFault = repository.save(faultLog);
        FaultLog prioritizedFault = priorityQueueService.applyPriority(savedFault);
        publishCriticalFaultAlert(prioritizedFault);
        return prioritizedFault;
    }

    public List<FaultLog> getAllFaultLogs() {
        return repository.findAll();
    }

    public List<FaultLog> getEngineerPendingQueue() {
        return repository.findEngineerQueue(PriorityQueueService.STATUS_PENDING);
    }

    public FaultLog getFaultById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fault not found with ID: " + id));
    }

    public CsvUploadResponse uploadCsv(MultipartFile file, AuthenticatedUser uploadedBy) {
        if (file == null || file.isEmpty()) {
            throw new CsvValidationException(
                    "Invalid CSV format",
                    List.of(),
                    List.of("CSV file is empty.")
            );
        }

        try {
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
            );

            CSVParser csvParser = new CSVParser(
                    reader,
                    CSVFormat.DEFAULT.builder()
                            .setHeader()
                            .setSkipHeaderRecord(true)
                            .setIgnoreEmptyLines(true)
                            .setTrim(true)
                            .build()
            );

            CsvHeaderSchema schema = CsvHeaderSchema.from(csvParser.getHeaderMap());
            List<String> missingHeaders = schema.missingRequiredHeaders();
            if (!missingHeaders.isEmpty()) {
                throw new CsvValidationException(
                        "Invalid CSV format",
                        missingHeaders,
                        List.of("Missing required CSV headers: " + String.join(", ", missingHeaders))
                );
            }

            int imported = 0;
            int failed = 0;
            int skipped = 0;
            List<String> errors = new ArrayList<>();

            for (CSVRecord record : csvParser) {
                if (isBlankRecord(record)) {
                    skipped++;
                    continue;
                }

                String machineId = schema.get(record, "machineId");
                String description = schema.get(record, "description");
                String severityValue = schema.get(record, "severity");

                if (isBlank(machineId) || isBlank(description) || isBlank(severityValue)) {
                    failed++;
                    errors.add("Row " + record.getRecordNumber() + ": machineId, description and severity are required.");
                    continue;
                }

                FaultLog faultLog = new FaultLog();
                faultLog.setFaultId(generateFaultId());
                faultLog.setMachineId(machineId);
                faultLog.setDescription(description);

                try {
                    faultLog.setSeverity(parseSeverity(severityValue));
                } catch (IllegalArgumentException ex) {
                    failed++;
                    errors.add("Row " + record.getRecordNumber() + ": invalid severity '" + severityValue + "'.");
                    continue;
                }

                faultLog.setReportedBy(uploadedBy.getEmpId());
                faultLog.setReportedByName(uploadedBy.getName());

                try {
                    faultLog.setFaultDate(parseDateOrDefault(schema.get(record, "faultDate"), LocalDate.now()));
                    faultLog.setFaultTime(parseTimeOrDefault(schema.get(record, "faultTime"), LocalTime.now().withNano(0)));
                } catch (Exception ex) {
                    failed++;
                    errors.add("Row " + record.getRecordNumber() + ": invalid faultDate or faultTime format.");
                    continue;
                }

                FaultLog savedFault = repository.save(faultLog);
                FaultLog prioritizedFault = priorityQueueService.applyPriority(savedFault);
                publishCriticalFaultAlert(prioritizedFault);
                imported++;
            }

            if (imported == 0) {
                String message = errors.isEmpty()
                        ? "CSV does not contain any importable fault rows."
                        : "CSV rows failed validation.";
                throw new CsvValidationException(message, List.of(), errors);
            }

            CsvUploadResponse response = CsvUploadResponse.success(imported, skipped, "CSV uploaded successfully");
            response.setFailed(failed);
            response.setErrors(errors);
            return response;
        } catch (CsvValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new CsvValidationException(
                    "Invalid CSV format",
                    List.of(),
                    List.of(e.getMessage() == null ? "Could not process CSV file." : e.getMessage())
            );
        }
    }

    public CsvUploadResponse uploadCsv(MultipartFile file) {
        return uploadCsv(file, new AuthenticatedUser(0L, 0, "System Import"));
    }

    private void publishCriticalFaultAlert(FaultLog faultLog) {
        if (faultLog == null || faultLog.getSeverity() != Severity.Critical) {
            return;
        }

        MachineAlert alert = alertRepository.findByLinkedFaultId(faultLog.getFaultId()).orElse(null);
        if (alert == null) {
            alert = new MachineAlert();
            alert.setMachineId(faultLog.getMachineId());
            alert.setAnalysisId(null);
            alert.setIssueName("Critical breakdown reported for fault " + faultLog.getFaultId());
            alert.setSeverity(Severity.Critical);
            alert.setPriority(Priority._1);
            alert.setEmpId(null);
            alert.setAlertPriority("Critical Alert");
            alert.setAlertReason("Operator logged a Critical machine breakdown. Fault ID: " + faultLog.getFaultId());
            alert.setGeneratedBySystem(true);
            alert.setLinkedFaultId(faultLog.getFaultId());
            alert.setLinkedAnalysisId(null);
            alert = alertRepository.save(alert);
        }

        realtimeNotificationService.notifyAlertGenerated(alert);
    }

    private LocalDate parseDateOrDefault(String value, LocalDate fallback) {
        if (isBlank(value)) {
            return fallback;
        }
        return LocalDate.parse(value.trim());
    }

    private LocalTime parseTimeOrDefault(String value, LocalTime fallback) {
        if (isBlank(value)) {
            return fallback;
        }
        return LocalTime.parse(value.trim()).withNano(0);
    }

    private boolean isBlankRecord(CSVRecord record) {
        for (String value : record) {
            if (!isBlank(value)) {
                return false;
            }
        }
        return true;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void validateFaultRequest(FaultDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Fault details are required.");
        }
        if (isBlank(dto.getMachineId())) {
            throw new IllegalArgumentException("machineId is required.");
        }
        if (isBlank(dto.getDescription())) {
            throw new IllegalArgumentException("description is required.");
        }
        if (isBlank(dto.getSeverity())) {
            throw new IllegalArgumentException("severity is required.");
        }
    }

    private static class CsvHeaderSchema {
        private static final Map<String, List<String>> FIELD_ALIASES = Map.of(
                "machineId", Arrays.asList("machineId", "machine_id"),
                "description", List.of("description"),
                "severity", List.of("severity"),
                "faultDate", Arrays.asList("faultDate", "fault_date"),
                "faultTime", Arrays.asList("faultTime", "fault_time")
        );

        private final Map<String, String> canonicalToHeader;

        private CsvHeaderSchema(Map<String, String> canonicalToHeader) {
            this.canonicalToHeader = canonicalToHeader;
        }

        static CsvHeaderSchema from(Map<String, Integer> headerMap) {
            Map<String, String> normalizedHeaders = new LinkedHashMap<>();
            for (String header : headerMap.keySet()) {
                normalizedHeaders.put(normalize(header), header);
            }

            Map<String, String> canonicalToHeader = new LinkedHashMap<>();
            FIELD_ALIASES.forEach((canonical, aliases) -> {
                for (String alias : aliases) {
                    String actualHeader = normalizedHeaders.get(normalize(alias));
                    if (actualHeader != null) {
                        canonicalToHeader.put(canonical, actualHeader);
                        break;
                    }
                }
            });

            return new CsvHeaderSchema(canonicalToHeader);
        }

        List<String> missingRequiredHeaders() {
            List<String> missing = new ArrayList<>();
            for (String required : Arrays.asList("machineId", "description", "severity")) {
                if (!canonicalToHeader.containsKey(required)) {
                    missing.add(required);
                }
            }
            return missing;
        }

        String get(CSVRecord record, String canonicalName) {
            String header = canonicalToHeader.get(canonicalName);
            if (header == null || !record.isMapped(header)) {
                return "";
            }
            return record.get(header) == null ? "" : record.get(header).trim();
        }

        private static String normalize(String value) {
            return value == null
                    ? ""
                    : value.trim().toLowerCase(Locale.ROOT).replaceAll("[_\\s-]", "");
        }
    }
}
