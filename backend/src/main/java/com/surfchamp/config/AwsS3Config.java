package com.surfchamp.config;

// import statements...

@Configuration
// @Profile("!local") // Comentado para desabilitar completamente
public class AwsS3Config {

    // @Value("${aws.access.key.id}")
    // private String accessKeyId;

    // @Value("${aws.secret.access.key}")
    // private String secretAccessKey;

    // @Value("${aws.region}")
    // private String region;

    // @Value("${aws.s3.bucket.name}")
    // private String bucketName;

    // @Bean
    // public S3Client s3Client() {
    //     return S3Client.builder()
    //             .region(Region.of(region))
    //             .credentialsProvider(
    //                     StaticCredentialsProvider.create(
    //                             AwsBasicCredentials.create(accessKeyId, secretAccessKey)
    //                     )
    //             )
    //             .build();
    // }

    // @Bean
    // public S3Presigner s3Presigner() {
    //     return S3Presigner.builder()
    //             .region(Region.of(region))
    //             .credentialsProvider(
    //                     StaticCredentialsProvider.create(
    //                             AwsBasicCredentials.create(accessKeyId, secretAccessKey)
    //                     )
    //             )
    //             .build();
    // }

    // @Bean
    // public String bucketName() {
    //     return bucketName;
    // }
}
