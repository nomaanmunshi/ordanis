#!/bin/sh

APP_HOME=$(cd "${0%/*}" && pwd -P)
WRAPPER_JAR="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ]; then
  echo "Downloading verified Gradle wrapper..." >&2
  java "$APP_HOME/gradle/wrapper/GradleWrapperDownloader.java" "$WRAPPER_JAR" || exit 1
fi

exec java ${JAVA_OPTS:-} ${GRADLE_OPTS:-} -Dorg.gradle.appname=gradlew \
  -classpath "$WRAPPER_JAR" org.gradle.wrapper.GradleWrapperMain "$@"
