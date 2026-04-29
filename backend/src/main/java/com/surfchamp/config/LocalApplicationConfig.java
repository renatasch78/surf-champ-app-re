package com.surfchamp.config;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import io.awspring.cloud.autoconfigure.s3.S3AutoConfiguration;
import io.awspring.cloud.autoconfigure.sqs.SqsAutoConfiguration;

@Configuration
@Profile("local")
@EnableAutoConfiguration(exclude = {
    S3AutoConfiguration.class,
    SqsAutoConfiguration.class
})
public class LocalApplicationConfig {
    
    // Esta configuração desabilita a autoconfiguração S3 e SQS no perfil local
    // para evitar conflitos com nossos mocks
}
