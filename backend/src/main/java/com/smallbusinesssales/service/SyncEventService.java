package com.smallbusinesssales.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SyncEventService {

    private final SimpMessagingTemplate messagingTemplate;

    public SyncEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastUpdate(String entityType, String action, String entityId) {
        Map<String, String> payload = new HashMap<>();
        payload.put("entity", entityType);
        payload.put("action", action);
        payload.put("id", entityId);
        
        messagingTemplate.convertAndSend("/topic/updates", payload);
    }
}
