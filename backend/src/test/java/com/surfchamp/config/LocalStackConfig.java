package com.surfchamp.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.services.s3.S3Client;

@TestConfiguration
@Profile("local")
public class LocalStackConfig {

    @Bean
    public S3Client s3Client() {
        // Retorna um cliente S3 em memória para testes locais
        return InMemoryS3Client.create();
    }
}

/**
 * Implementação simples de um cliente S3 em memória para testes locais
 */
class InMemoryS3Client {
    public static S3Client create() {
        return new software.amazon.awssdk.services.s3.S3Client() {
            @Override
            public String serviceName() {
                return "InMemoryS3";
            }

            @Override
            public void close() {
                // Não faz nada no modo de teste
            }
        };
    }
}
