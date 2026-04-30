package com.surfchamp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("disabled") // Perfil que nunca será usado
// Configuração AWS desabilitada - usando apenas LocalAwsS3Config
