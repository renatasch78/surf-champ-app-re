package com.surfchamp.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(MultipartFile file) throws Exception;
    byte[] downloadFile(String filePath) throws Exception;
    String generatePresignedUrl(String fileKey);
    
    /**
     * Exclui um arquivo do armazenamento
     * @param fileKey Chave/identificador do arquivo
     * @throws Exception Se ocorrer um erro ao excluir o arquivo
     */
    void deleteFile(String fileKey) throws Exception;
}
