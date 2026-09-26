package com.smallbusinesssales.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl != null && !dbUrl.trim().isEmpty() && !dbUrl.startsWith("jdbc:")) {
            String jdbcUrl = dbUrl.replace("postgres://", "jdbc:postgresql://")
                                  .replace("postgresql://", "jdbc:postgresql://");
            
            Map<String, Object> map = new HashMap<>();
            map.put("spring.datasource.url", jdbcUrl);
            // Auto-override the datasource url to use the correct jdbc URL format
            environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseProperties", map));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
