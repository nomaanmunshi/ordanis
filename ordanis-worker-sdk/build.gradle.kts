plugins { `java-library` }

dependencies {
    api(project(":ordanis-protocol"))
    implementation("io.grpc:grpc-netty-shaded:1.80.0")
}
