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
        if (dbUrl != null && !dbUrl.trim().isEmpty()) {
            String cleanUrl = dbUrl.trim();

            // Ignore placeholders or template strings
            if (cleanUrl.contains("dpg-xxxxxxxxxxxx-a") || 
                cleanUrl.contains("your_secure_password") || 
                cleanUrl.contains("your_database_url") ||
                cleanUrl.contains("<host>") ||
                cleanUrl.contains("YOUR_")) {
                return;
            }

            String parseableUriStr = cleanUrl;
            if (parseableUriStr.startsWith("jdbc:")) {
                parseableUriStr = parseableUriStr.substring(5); // strip "jdbc:"
            }

            if (parseableUriStr.startsWith("postgres://") || parseableUriStr.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(parseableUriStr);
                    String host = uri.getHost();
                    if (host != null) {
                        int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                        String path = uri.getPath(); // includes leading /
                        String query = uri.getQuery();

                        // External Render postgres hosts (.render.com) require SSL mode
                        if (host.contains(".render.com") && (query == null || !query.contains("sslmode="))) {
                            query = (query != null && !query.isBlank()) ? query + "&sslmode=require" : "sslmode=require";
                        }

                        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + (path != null ? path : "") + (query != null ? "?" + query : "");

                        Map<String, Object> map = new HashMap<>();
                        map.put("spring.datasource.url", jdbcUrl);
                        map.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
                        map.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

                        if (uri.getUserInfo() != null) {
                            String[] userParts = uri.getUserInfo().split(":", 2);
                            map.put("spring.datasource.username", userParts[0]);
                            if (userParts.length > 1) {
                                map.put("spring.datasource.password", userParts[1]);
                            }
                        }

                        environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseProperties", map));
                    }
                } catch (Exception e) {
                    String jdbcUrl = dbUrl.replace("postgres://", "jdbc:postgresql://")
                                          .replace("postgresql://", "jdbc:postgresql://");
                    Map<String, Object> map = new HashMap<>();
                    map.put("spring.datasource.url", jdbcUrl);
                    map.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
                    environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseProperties", map));
                }
            }
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}



