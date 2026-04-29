package com.surfchamp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class SurfChampApplication {
    public static void main(String[] args) {
        SpringApplication.run(SurfChampApplication.class, args);
    }
}
