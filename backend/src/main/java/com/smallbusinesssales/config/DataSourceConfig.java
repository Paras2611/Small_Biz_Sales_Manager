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
import java.sql.Connection;
import java.sql.DriverManager;

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

        boolean isPostgres = false;

        if (jdbcUrl != null && !jdbcUrl.isBlank()) {
            String parseableUriStr = jdbcUrl.trim();
            if (parseableUriStr.startsWith("jdbc:")) {
                parseableUriStr = parseableUriStr.substring(5);
            }

            if (parseableUriStr.startsWith("postgres://") || parseableUriStr.startsWith("postgresql://")) {
                isPostgres = true;
                try {
                    URI uri = new URI(parseableUriStr);
                    String host = uri.getHost();
                    if (host != null) {
                        int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                        String path = uri.getPath();
                        String query = uri.getQuery();

                        // External Render postgres hosts (.render.com) require SSL mode
                        if (host.contains(".render.com") && (query == null || !query.contains("sslmode="))) {
                            query = (query != null && !query.isBlank()) ? query + "&sslmode=require" : "sslmode=require";
                        }

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
                        log.info("Configured PostgreSQL DataSource for host: {}:{}", host, port);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse PostgreSQL URI, using fallback: {}", e.getMessage());
                }
            } else if (jdbcUrl.startsWith("jdbc:postgresql:")) {
                isPostgres = true;
                driver = "org.postgresql.Driver";
            }
        }

        // Resilient connection check for PostgreSQL to prevent application crash on startup if DB is down/misconfigured
        if (isPostgres && jdbcUrl != null && jdbcUrl.startsWith("jdbc:postgresql:")) {
            log.info("Testing PostgreSQL connection to: {}", sanitizeUrl(jdbcUrl));
            boolean connectionOk = false;
            try {
                Class.forName("org.postgresql.Driver");
                DriverManager.setLoginTimeout(4);
                try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPass)) {
                    if (conn.isValid(3)) {
                        connectionOk = true;
                        log.info("PostgreSQL database connection verified successfully.");
                    }
                }
            } catch (Exception e) {
                log.warn("PostgreSQL connection failed ({}: {}).", e.getClass().getSimpleName(), e.getMessage());
            }

            if (!connectionOk) {
                log.warn("Falling back to embedded H2 database to ensure smooth web server startup.");
                jdbcUrl = "jdbc:h2:file:./data/salescrm;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL";
                dbUser = "sa";
                dbPass = "";
                driver = "org.h2.Driver";
            }
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

    private String sanitizeUrl(String url) {
        if (url == null) return "";
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}

