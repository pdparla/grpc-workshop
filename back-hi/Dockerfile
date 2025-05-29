# Runtime stage
FROM eclipse-temurin:24-jre-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -S app && adduser -G app -S app-user

USER app-user

# Set working directory
WORKDIR /app

COPY ./target/*.jar app.jar

EXPOSE 8080 9090

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["java", "-jar", "app.jar"]