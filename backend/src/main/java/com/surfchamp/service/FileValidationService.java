package com.surfchamp.service;

import com.surfchamp.exception.FileValidationException;
import com.surfchamp.model.enums.SupportedMediaType;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FileValidationService {
    private static final Logger logger = LoggerFactory.getLogger(FileValidationService.class);
    private static final Tika TIKA = new Tika();
    
    private final long maxFileSize;
    private final Set<String> allowedContentTypes;
    private final Set<String> allowedExtensions;

    public FileValidationService(
            @Value("${file.upload.max-file-size:104857600}") long maxFileSize) {
        
        this.maxFileSize = maxFileSize;
        this.allowedContentTypes = Arrays.stream(SupportedMediaType.values())
            .map(SupportedMediaType::getMimeType)
            .collect(Collectors.toSet());
        this.allowedExtensions = Arrays.stream(SupportedMediaType.values())
            .flatMap(type -> type.getFileExtensions().stream())
            .collect(Collectors.toSet());
        
        logger.info("""
            FileValidationService inicializado com as seguintes configurações:
            - Tamanho máximo de arquivo: {} bytes ({} MB)
            - Tipos MIME suportados: {}
            - Extensões suportadas: {}""", 
            maxFileSize, 
            maxFileSize / (1024 * 1024),
            String.join(", ", allowedContentTypes),
            String.join(", ", allowedExtensions));
    }

    /**
     * Valida um arquivo de vídeo de acordo com as regras definidas
     * @param file Arquivo a ser validado
     * @return O tipo de mídia detectado
     * @throws FileValidationException Se a validação falhar
     */
    public SupportedMediaType validateFile(MultipartFile file) {
        logger.debug("Validando arquivo: {}", file.getOriginalFilename());
        
        // Validações iniciais
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("O arquivo não pode estar vazio");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new FileValidationException("Nome de arquivo inválido");
        }

        // Extrai a extensão do arquivo
        String fileExtension = getFileExtension(originalFilename);
        if (fileExtension == null) {
            throw new FileValidationException(
                String.format("Arquivo sem extensão. Extensões suportadas: %s", 
                    String.join(", ", allowedExtensions))
            );
        }

        // Verifica a extensão
        if (!isValidExtension(fileExtension)) {
            throw new FileValidationException(
                String.format("Extensão de arquivo não suportada: .%s. Extensões permitidas: %s", 
                    fileExtension, formatSupportedExtensions())
            );
        }

        // Verifica o tamanho do arquivo
        long fileSize = file.getSize();
        if (fileSize > maxFileSize) {
            throw new FileValidationException(
                String.format("Tamanho do arquivo (%,d bytes) excede o limite permitido de %,d bytes", 
                    fileSize, maxFileSize)
            );
        }

        // Detecta o tipo MIME real do arquivo
        String detectedContentType;
        try (InputStream is = file.getInputStream()) {
            detectedContentType = TIKA.detect(is, originalFilename);
            logger.debug("Tipo MIME detectado para {}: {}", originalFilename, detectedContentType);
            
            // Verifica se o tipo MIME detectado é compatível com a extensão
            SupportedMediaType mediaType = SupportedMediaType.fromMimeType(detectedContentType);
            if (mediaType == null || !mediaType.getFileExtensions().contains(fileExtension.toLowerCase())) {
                throw new FileValidationException(
                    String.format("Incompatibilidade detectada entre a extensão .%s e o tipo MIME %s", 
                        fileExtension, detectedContentType)
                );
            }
            
            logger.info("Arquivo validado com sucesso: {} ({} bytes, {})", 
                originalFilename, fileSize, mediaType.getDisplayName());
                
            return mediaType;
            
        } catch (IOException e) {
            throw new FileValidationException("Não foi possível ler o arquivo para validação", e);
        }
    }

    /**
     * Extrai a extensão de um nome de arquivo
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return null;
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        return null;
    }
    
    /**
     * Verifica se uma extensão é suportada
     */
    private boolean isValidExtension(String extension) {
        return extension != null && allowedExtensions.contains(extension.toLowerCase());
    }
    
    /**
     * Formata a lista de extensões suportadas para exibição
     */
    private String formatSupportedExtensions() {
        return "*." + String.join(", *.", allowedExtensions);
    }
}
