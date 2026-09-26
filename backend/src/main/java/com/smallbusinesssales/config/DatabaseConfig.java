package com.smallbusinesssales.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${spring.datasource.url:jdbc:h2:file:./data/salescrm;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL}")
    private String springDatasourceUrl;

    @Value("${spring.datasource.username:sa}")
    private String databaseUsername;

    @Value("${spring.datasource.password:}")
    private String databasePassword;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            String jdbcUrl = databaseUrl;
            
            // Auto-convert postgres:// or postgresql:// to jdbc:postgresql://
            if (jdbcUrl.startsWith("postgres://")) {
                jdbcUrl = jdbcUrl.replace("postgres://", "jdbc:postgresql://");
            } else if (jdbcUrl.startsWith("postgresql://")) {
                jdbcUrl = jdbcUrl.replace("postgresql://", "jdbc:postgresql://");
            } else if (!jdbcUrl.startsWith("jdbc:")) {
                // Fallback for other generic URLs
                jdbcUrl = "jdbc:" + jdbcUrl;
            }

            config.setJdbcUrl(jdbcUrl);
            
            if (databaseUsername != null && !databaseUsername.isEmpty()) {
                config.setUsername(databaseUsername);
            }
            if (databasePassword != null && !databasePassword.isEmpty()) {
                config.setPassword(databasePassword);
            }
        } else {
            // Use Spring's datasource url (supports test overrides)
            config.setJdbcUrl(springDatasourceUrl);
            config.setUsername(databaseUsername);
            config.setPassword(databasePassword);
        }

        return new HikariDataSource(config);
    }
}
