package com.tcs.Machcare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcs.Machcare.util.Jwtutil;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RealtimeNotificationService extends TextWebSocketHandler {

    public static final String EVENT_MACHINE_ALERT_GENERATED = "MACHINE_ALERT_GENERATED";
    public static final String EVENT_ALERT_ASSIGNED = "ALERT_ASSIGNED";
    public static final String EVENT_ENGINEER_TASK_ASSIGNED = "ENGINEER_TASK_ASSIGNED";

    private final Jwtutil jwtUtil;
    private final ObjectMapper objectMapper;

    private final Map<Integer, Set<WebSocketSession>> sessionsByRole = new ConcurrentHashMap<>();
    private final Map<Long, Set<WebSocketSession>> sessionsByEmployee = new ConcurrentHashMap<>();
    private final Map<String, ClientMeta> sessionMeta = new ConcurrentHashMap<>();

    public RealtimeNotificationService(Jwtutil jwtUtil, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = readToken(session.getUri());

        if (token == null || token.trim().isEmpty()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing token"));
            return;
        }

        Long empId = jwtUtil.extractEmpId(token);
        Integer roleId = jwtUtil.extractRoleId(token);

        ClientMeta meta = new ClientMeta(empId, roleId);
        sessionMeta.put(session.getId(), meta);

        sessionsByEmployee
                .computeIfAbsent(empId, key -> ConcurrentHashMap.newKeySet())
                .add(session);

        sessionsByRole
                .computeIfAbsent(roleId, key -> ConcurrentHashMap.newKeySet())
                .add(session);

        send(session, "REALTIME_CONNECTED", Map.of(
                "empId", empId,
                "roleId", roleId,
                "message", "Realtime WebSocket connected"
        ));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        removeSession(session);

        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    public void notifyAdmins(String eventType, Object data) {
        sendToRole(1, eventType, data);
    }

    public void notifyEngineer(Long empId, String eventType, Object data) {
        if (empId == null) {
            return;
        }

        sendToEmployee(empId, eventType, data);
    }

    public void notifyAlertGenerated(Object alert) {
        notifyAdmins(EVENT_MACHINE_ALERT_GENERATED, alert);
    }

    public void notifyAlertAssigned(Object assignmentPayload, Long engineerEmpId) {
        notifyAdmins(EVENT_ALERT_ASSIGNED, assignmentPayload);
        notifyEngineer(engineerEmpId, EVENT_ENGINEER_TASK_ASSIGNED, assignmentPayload);
    }

    private void sendToRole(Integer roleId, String eventType, Object data) {
        Set<WebSocketSession> sessions = sessionsByRole.getOrDefault(roleId, Set.of());

        sessions.forEach(session -> send(session, eventType, data));
    }

    private void sendToEmployee(Long empId, String eventType, Object data) {
        Set<WebSocketSession> sessions = sessionsByEmployee.getOrDefault(empId, Set.of());

        sessions.forEach(session -> send(session, eventType, data));
    }

    private void send(WebSocketSession session, String eventType, Object data) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "type", eventType,
                    "timestamp", Instant.now().toString(),
                    "data", data == null ? Map.of() : data
            ));

            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(payload));
                }
            }
        } catch (IOException ex) {
            removeSession(session);
        }
    }

    private void removeSession(WebSocketSession session) {
        if (session == null) {
            return;
        }

        ClientMeta meta = sessionMeta.remove(session.getId());

        if (meta == null) {
            return;
        }

        Set<WebSocketSession> employeeSessions = sessionsByEmployee.get(meta.empId());

        if (employeeSessions != null) {
            employeeSessions.remove(session);

            if (employeeSessions.isEmpty()) {
                sessionsByEmployee.remove(meta.empId());
            }
        }

        Set<WebSocketSession> roleSessions = sessionsByRole.get(meta.roleId());

        if (roleSessions != null) {
            roleSessions.remove(session);

            if (roleSessions.isEmpty()) {
                sessionsByRole.remove(meta.roleId());
            }
        }
    }

    private String readToken(URI uri) {
        if (uri == null) {
            return null;
        }

        return UriComponentsBuilder.fromUri(uri)
                .build()
                .getQueryParams()
                .getFirst("token");
    }

    private record ClientMeta(Long empId, Integer roleId) {
    }
}