package com.surfchamp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.surfchamp.repository",
    repositoryBaseClass = com.surfchamp.repository.BaseRepositoryImpl.class,
    repositoryImplementationPostfix = "CustomImpl"
)
public class JpaConfig {
    // Configuration class for JPA repositories
}
