package com.surfchamp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Profile("local")
public class LocalStorageService implements StorageService {
    private static final Logger logger = LoggerFactory.getLogger(LocalStorageService.class);

    @Value("${file.storage.location:./uploads}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file) throws Exception {
        // Cria o diretório se não existir
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // Gera um nome de arquivo único
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String newFilename = UUID.randomUUID().toString() + fileExtension;

        // Salva o arquivo localmente
        Path filePath = Paths.get(uploadDir, newFilename);
        Files.copy(file.getInputStream(), filePath);

        // Retorna o caminho relativo do arquivo
        return "/uploads/" + newFilename;
    }

    @Override
    public byte[] downloadFile(String filePath) throws Exception {
        // Remove a barra inicial se existir
        if (filePath.startsWith("/")) {
            filePath = filePath.substring(1);
        }
        
        Path path = Paths.get(filePath);
        return Files.readAllBytes(path);
    }
    
    @Override
    public String generatePresignedUrl(String fileKey) {
        // Em ambiente local, retornamos um caminho relativo
        if (fileKey.startsWith("/")) {
            return fileKey;
        }
        return "/uploads/" + fileKey;
    }

    @Override
    public void deleteFile(String fileKey) throws Exception {
        logger.info("Iniciando exclusão do arquivo com fileKey: '{}' (tamanho: {})", fileKey, fileKey.length());
        
        try {
            // Remove a barra inicial do caminho do arquivo, se existir
            if (fileKey.startsWith("/")) {
                fileKey = fileKey.substring(1);
                logger.debug("Removida barra inicial. Novo fileKey: '{}'", fileKey);
            }
            
            // Remove o prefixo /uploads/ se existir (para compatibilidade)
            if (fileKey.startsWith("uploads/")) {
                fileKey = fileKey.substring("uploads/".length());
                logger.debug("Removido prefixo 'uploads/'. Novo fileKey: '{}'", fileKey);
            } else if (fileKey.startsWith("uploads\\")) {
                fileKey = fileKey.substring("uploads\\".length());
                logger.debug("Removido prefixo 'uploads\\'. Novo fileKey: '{}'", fileKey);
            }
            
            // Constrói o caminho completo para o arquivo
            Path filePath = Paths.get(uploadDir, fileKey);
            logger.info("Tentando excluir arquivo no caminho: {}", filePath.toAbsolutePath());
            logger.info("Diretório de upload configurado: '{}'", uploadDir);
            
            // Verifica se o diretório de upload existe
            Path uploadDirPath = Paths.get(uploadDir);
            if (!Files.exists(uploadDirPath)) {
                logger.error("Diretório de upload não encontrado: {}", uploadDirPath.toAbsolutePath());
                throw new IOException("Diretório de upload não encontrado: " + uploadDirPath.toAbsolutePath());
            }
            
            // Verifica se o arquivo existe antes de tentar excluir
            if (Files.exists(filePath)) {
                logger.info("Arquivo encontrado. Tamanho: {} bytes", Files.size(filePath));
                logger.info("Permissões do arquivo: legível={}, gravável={}, executável={}", 
                    Files.isReadable(filePath), 
                    Files.isWritable(filePath), 
                    Files.isExecutable(filePath));
                
                // Tenta excluir o arquivo
                Files.delete(filePath);
                logger.info("Arquivo excluído com sucesso: {}", filePath);
                
                // Verifica se o arquivo foi realmente excluído
                if (Files.exists(filePath)) {
                    logger.error("AVISO: O arquivo ainda existe após a exclusão: {}", filePath);
                } else {
                    logger.info("Confirmação: O arquivo foi removido com sucesso: {}", filePath);
                }
            } else {
                // Tenta encontrar o arquivo em outros locais possíveis
                logger.warn("Arquivo não encontrado no caminho: {}", filePath);
                
                // Tenta encontrar o arquivo no diretório de trabalho atual
                Path currentDirPath = Paths.get(".");
                logger.info("Procurando arquivo no diretório atual: {}", currentDirPath.toAbsolutePath());
                
                // Lista todos os arquivos no diretório atual para depuração
                try (Stream<Path> walk = Files.walk(currentDirPath, 3)) {
                    logger.info("Arquivos no diretório atual (primeiros 20): {}", 
                        walk.filter(Files::isRegularFile)
                            .limit(20)
                            .map(p -> p.getFileName().toString())
                            .collect(Collectors.joining(", ")));
                } catch (IOException e) {
                    logger.error("Erro ao listar arquivos no diretório atual", e);
                }
                
                throw new FileNotFoundException("Arquivo não encontrado: " + filePath.toAbsolutePath());
            }
        } catch (Exception e) {
            logger.error("Erro ao excluir o arquivo '{}': {}", fileKey, e.getMessage(), e);
            throw new Exception("Falha ao excluir o arquivo: " + e.getMessage(), e);
        }
    }
}
