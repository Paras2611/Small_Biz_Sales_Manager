package com.smallbusinesssales.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String jdbcUrl = rawUrl;
        String dbUser = username;
        String dbPass = password;
        String driver = driverClassName;

        if (jdbcUrl != null && !jdbcUrl.isBlank()) {
            String parseableUriStr = jdbcUrl.trim();
            if (parseableUriStr.startsWith("jdbc:")) {
                parseableUriStr = parseableUriStr.substring(5);
            }

            if (parseableUriStr.startsWith("postgres://") || parseableUriStr.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(parseableUriStr);
                    String host = uri.getHost();
                    if (host != null) {
                        int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                        String path = uri.getPath();
                        String query = uri.getQuery();

                        jdbcUrl = "jdbc:postgresql://" + host + ":" + port + (path != null ? path : "") + (query != null ? "?" + query : "");

                        if (uri.getUserInfo() != null) {
                            String[] userParts = uri.getUserInfo().split(":", 2);
                            if (dbUser == null || dbUser.isBlank() || "sa".equals(dbUser)) {
                                dbUser = userParts[0];
                            }
                            if (userParts.length > 1 && (dbPass == null || dbPass.isBlank())) {
                                dbPass = userParts[1];
                            }
                        }
                        driver = "org.postgresql.Driver";
                        log.info("Successfully configured PostgreSQL DataSource for host: {}:{}", host, port);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse PostgreSQL URI, using fallback: {}", e.getMessage());
                }
            }
        }

        if (jdbcUrl != null && jdbcUrl.startsWith("jdbc:postgresql:")) {
            driver = "org.postgresql.Driver";
        }

        if (driver == null || driver.isBlank()) {
            if (jdbcUrl != null && jdbcUrl.contains("postgresql")) {
                driver = "org.postgresql.Driver";
            } else {
                driver = "org.h2.Driver";
            }
        }

        return DataSourceBuilder.create()
                .url(jdbcUrl)
                .username(dbUser)
                .password(dbPass)
                .driverClassName(driver)
                .build();
    }
}

