package com.surfchamp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.core.exception.SdkClientException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@Profile("!local")
public class S3StorageService implements StorageService {
    private static final Logger logger = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;

    @Autowired
    public S3StorageService(S3Client s3Client, S3Presigner s3Presigner, 
                           @Qualifier("bucketName") String bucketName) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
    }

    @Async
    @Override
    public String uploadFile(MultipartFile file) throws Exception {
        try {
            // Verifica se o bucket existe, se não existir, cria
            if (!s3Client.listBuckets().buckets().stream()
                    .anyMatch(b -> b.name().equals(bucketName))) {
                createBucket();
            }

            // Faz o upload do arquivo
            String key = generateUniqueKey(file.getOriginalFilename());
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );

            return key;
        } catch (S3Exception e) {
            throw new IOException("Erro ao fazer upload do arquivo para o S3: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] downloadFile(String fileKey) throws Exception {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();
            
            return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
        } catch (S3Exception e) {
            throw new Exception("Error downloading file from S3: " + e.getMessage(), e);
        } catch (SdkClientException e) {
            throw new Exception("Error communicating with S3: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new Exception("Error downloading file: " + e.getMessage(), e);
        }
    }

    @Override
    public String generatePresignedUrl(String fileKey) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60)) // URL válida por 60 minutos
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (S3Exception e) {
            throw new RuntimeException("Erro ao gerar URL assinada: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileKey) throws Exception {
        try {
            logger.info("Excluindo arquivo do S3: {}/{}", bucketName, fileKey);
            
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();
            
            s3Client.deleteObject(deleteObjectRequest);
            logger.info("Arquivo excluído com sucesso: {}", fileKey);
            
        } catch (S3Exception e) {
            logger.error("Erro ao excluir arquivo do S3: {}", e.getMessage(), e);
            throw new Exception("Erro ao excluir arquivo do armazenamento: " + e.getMessage(), e);
        }
    }

    private void createBucket() {
        try {
            s3Client.createBucket(CreateBucketRequest.builder()
                    .bucket(bucketName)
                    .createBucketConfiguration(builder -> builder
                            .locationConstraint(Region.US_EAST_1.id())
                            .build())
                    .build());
        } catch (BucketAlreadyExistsException e) {
            // Bucket já existe, podemos continuar
        } catch (S3Exception e) {
            throw new RuntimeException("Erro ao criar o bucket S3: " + e.getMessage(), e);
        }
    }

    public String generateUniqueKey(String originalFilename) {
        String fileExtension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            fileExtension = originalFilename.substring(lastDotIndex);
        }
        return "videos/" + UUID.randomUUID() + fileExtension;
    }
}
