package com.smallbusinesssales.entity;

import com.smallbusinesssales.service.SyncEventService;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import java.lang.reflect.Method;

@Component
public class SyncEventListener implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        context = applicationContext;
    }

    @PostPersist
    public void onPostPersist(Object entity) {
        broadcast(entity, "CREATE");
    }

    @PostUpdate
    public void onPostUpdate(Object entity) {
        broadcast(entity, "UPDATE");
    }

    @PostRemove
    public void onPostRemove(Object entity) {
        broadcast(entity, "DELETE");
    }

    private void broadcast(Object entity, String action) {
        if (context == null) return;
        try {
            SyncEventService syncEventService = context.getBean(SyncEventService.class);
            String entityType = entity.getClass().getSimpleName();
            
            // Try to get ID
            Method getIdMethod = entity.getClass().getMethod("getId");
            Object idObj = getIdMethod.invoke(entity);
            String id = idObj != null ? idObj.toString() : "";
            
            syncEventService.broadcastUpdate(entityType, action, id);
        } catch (Exception e) {
            // Ignore if ID is not accessible or service not ready
        }
    }
}
