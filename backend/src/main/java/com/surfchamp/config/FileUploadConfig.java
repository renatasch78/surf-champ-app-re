package com.surfchamp.config;

import com.surfchamp.service.FileValidationService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FileUploadProperties.class)
public class FileUploadConfig {
    
    @Bean
    public FileValidationService fileValidationService(FileUploadProperties properties) {
        return new FileValidationService(properties.getMaxFileSize());
    }
}
