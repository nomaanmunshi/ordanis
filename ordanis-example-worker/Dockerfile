FROM gradle:8.14.3-jdk21 AS build
WORKDIR /workspace
COPY . .
RUN gradle :ordanis-example-worker:installDist --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/ordanis-example-worker/build/install/ordanis-example-worker/ .
ENTRYPOINT ["bin/ordanis-example-worker"]
