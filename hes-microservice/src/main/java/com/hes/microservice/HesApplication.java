package com.hes.microservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HesApplication {
    public static void main(String[] args) {
        SpringApplication.run(HesApplication.class, args);
    }
} 