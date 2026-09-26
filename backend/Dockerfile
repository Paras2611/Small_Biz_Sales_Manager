# ==============================================================================
# Multi-stage Dockerfile for Spring Boot 3 / Java 21 Backend
# ==============================================================================

# Stage 1: Build JAR with Maven & Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven wrapper and POM for dependency layer caching
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Normalize line endings and ensure execution rights
RUN sed -i 's/\r$//' ./mvnw && chmod +x ./mvnw

# Pre-fetch dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production fat JAR (skipping test suite during container image build)
COPY src src
RUN ./mvnw clean package -DskipTests && \
    find target/ -maxdepth 1 -name "*.jar" ! -name "*.original" -exec cp {} app.jar \;

# Stage 2: Minimal, secure JRE 21 Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring && \
    mkdir -p /app/data && chown -R spring:spring /app
USER spring:spring

# Copy compiled JAR from build stage
COPY --from=build --chown=spring:spring /app/app.jar app.jar

# Render injects PORT env variable
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
