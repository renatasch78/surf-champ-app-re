package com.surfchamp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
public class LocalAwsAutoConfiguration {
    
    // Esta classe vazia serve para garantir que o perfil local
    // não ative a configuração automática do AWS
}
