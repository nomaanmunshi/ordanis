@echo off
setlocal
set "APP_HOME=%~dp0"
set "WRAPPER_JAR=%APP_HOME%gradle\wrapper\gradle-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
  echo Downloading verified Gradle wrapper... 1>&2
  java "%APP_HOME%gradle\wrapper\GradleWrapperDownloader.java" "%WRAPPER_JAR%" || exit /b 1
)

java %JAVA_OPTS% %GRADLE_OPTS% -Dorg.gradle.appname=gradlew -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
