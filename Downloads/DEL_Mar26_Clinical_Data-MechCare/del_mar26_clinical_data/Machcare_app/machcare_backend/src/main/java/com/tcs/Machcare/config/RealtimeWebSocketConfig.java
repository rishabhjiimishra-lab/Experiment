package com.tcs.Machcare.config;

import com.tcs.Machcare.service.RealtimeNotificationService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class RealtimeWebSocketConfig implements WebSocketConfigurer {

    private final RealtimeNotificationService realtimeNotificationService;

    public RealtimeWebSocketConfig(RealtimeNotificationService realtimeNotificationService) {
        this.realtimeNotificationService = realtimeNotificationService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(realtimeNotificationService, "/ws/realtime")
                .setAllowedOriginPatterns("*");
    }
}
