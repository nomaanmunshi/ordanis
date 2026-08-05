import com.google.protobuf.gradle.id

plugins {
    `java-library`
    id("com.google.protobuf")
}

val grpcVersion = "1.80.0"

dependencies {
    api(platform("io.grpc:grpc-bom:$grpcVersion"))
    api("io.grpc:grpc-protobuf")
    api("io.grpc:grpc-stub")
    compileOnly("javax.annotation:javax.annotation-api:1.3.2")
}

protobuf {
    protoc { artifact = "com.google.protobuf:protoc:3.25.8" }
    plugins {
        id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:$grpcVersion" }
    }
    generateProtoTasks {
        all().configureEach { plugins { id("grpc") } }
    }
}
