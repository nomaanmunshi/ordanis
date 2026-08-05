plugins { application }

dependencies {
    implementation(project(":ordanis-worker-sdk"))
    implementation("com.fasterxml.jackson.core:jackson-databind:2.19.2")
}

application {
    mainClass.set("dev.ordanis.example.ExampleWorkerApplication")
}
