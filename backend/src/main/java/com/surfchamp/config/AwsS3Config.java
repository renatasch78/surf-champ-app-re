package com.surfchamp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
<<<<<<< HEAD
=======
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
>>>>>>> render

@Configuration
@Profile("disabled") // Perfil que nunca será usado
public class AwsS3Config {
    // Configuração AWS desabilitada - usando apenas LocalAwsS3Config
}
