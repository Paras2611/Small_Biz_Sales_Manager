package com.smallbusinesssales.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl != null && !dbUrl.trim().isEmpty() && !dbUrl.startsWith("jdbc:")) {
            try {
                String cleanUrl = dbUrl.trim();
                URI uri = new URI(cleanUrl);
                
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath(); // includes leading /
                String query = uri.getQuery();

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + (path != null ? path : "") + (query != null ? "?" + query : "");

                Map<String, Object> map = new HashMap<>();
                map.put("spring.datasource.url", jdbcUrl);
                map.put("spring.datasource.driver-class-name", "org.postgresql.Driver");

                if (uri.getUserInfo() != null) {
                    String[] userParts = uri.getUserInfo().split(":", 2);
                    map.put("spring.datasource.username", userParts[0]);
                    if (userParts.length > 1) {
                        map.put("spring.datasource.password", userParts[1]);
                    }
                }

                environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseProperties", map));
            } catch (Exception e) {
                // Fallback replace if URI parsing fails
                String jdbcUrl = dbUrl.replace("postgres://", "jdbc:postgresql://")
                                      .replace("postgresql://", "jdbc:postgresql://");
                Map<String, Object> map = new HashMap<>();
                map.put("spring.datasource.url", jdbcUrl);
                environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseProperties", map));
            }
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}

