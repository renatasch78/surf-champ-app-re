package com.surfchamp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("disabled") // Perfil que nunca será usado
public class AwsS3Config {
    // Configuração AWS desabilitada - usando apenas LocalAwsS3Config
}
