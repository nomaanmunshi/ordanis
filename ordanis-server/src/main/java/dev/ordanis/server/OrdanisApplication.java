package dev.ordanis.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class OrdanisApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrdanisApplication.class, args);
    }
}
