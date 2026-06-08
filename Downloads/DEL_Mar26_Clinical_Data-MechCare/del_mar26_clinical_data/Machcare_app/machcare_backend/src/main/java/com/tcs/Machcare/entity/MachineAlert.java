package com.tcs.Machcare.entity;

import java.time.Instant;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "machine_alert", schema = "dev")
public class MachineAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @Column(name = "machine_id")
    private String machineId;

    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "issue_name")
    private String issueName;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity;

    @Column(name = "priority")
    private Priority priority;

    @Column(name = "emp_id")
    private Long empId;

    @Column(name = "alert_priority")
    private String alertPriority;

    @Column(name = "alert_reason", length = 1000)
    private String alertReason;

    @Column(name = "generated_by_system")
    private Boolean generatedBySystem;

    @Column(name = "linked_fault_id")
    private String linkedFaultId;

    @Column(name = "linked_analysis_id")
    private Long linkedAnalysisId;

    // ✅ Actual alert generation timestamp in UTC
    @Column(name = "created_at_utc", updatable = false)
    private Instant createdAtUtc;

    public MachineAlert() {}

    @PrePersist
    public void onCreate() {
        if (createdAtUtc == null) {
            createdAtUtc = Instant.now();
        }
    }

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }

    public String getMachineId() {
        return machineId;
    }

    public void setMachineId(String machineId) {
        this.machineId = machineId;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public String getIssueName() {
        return issueName;
    }

    public void setIssueName(String issueName) {
        this.issueName = issueName;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Long getEmpId() {
        return empId;
    }

    public void setEmpId(Long empId) {
        this.empId = empId;
    }

    public String getAlertPriority() {
        return alertPriority;
    }

    public void setAlertPriority(String alertPriority) {
        this.alertPriority = alertPriority;
    }

    public String getAlertReason() {
        return alertReason;
    }

    public void setAlertReason(String alertReason) {
        this.alertReason = alertReason;
    }

    public Boolean getGeneratedBySystem() {
        return generatedBySystem;
    }

    public void setGeneratedBySystem(Boolean generatedBySystem) {
        this.generatedBySystem = generatedBySystem;
    }

    public String getLinkedFaultId() {
        return linkedFaultId;
    }

    public void setLinkedFaultId(String linkedFaultId) {
        this.linkedFaultId = linkedFaultId;
    }

    public Long getLinkedAnalysisId() {
        return linkedAnalysisId;
    }

    public void setLinkedAnalysisId(Long linkedAnalysisId) {
        this.linkedAnalysisId = linkedAnalysisId;
    }

    public Instant getCreatedAtUtc() {
        return createdAtUtc;
    }

    public void setCreatedAtUtc(Instant createdAtUtc) {
        this.createdAtUtc = createdAtUtc;
    }
}