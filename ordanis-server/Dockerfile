FROM gradle:8.14.3-jdk21 AS build
WORKDIR /workspace
COPY . .
RUN gradle :ordanis-server:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/ordanis-server/build/libs/ordanis-server-0.1.0.jar app.jar
EXPOSE 8080 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
