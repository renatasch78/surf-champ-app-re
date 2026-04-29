package com.surfchamp.service;

import com.surfchamp.model.VideoResult;
import com.surfchamp.repository.VideoResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class VideoService {
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);

    @Autowired
    private VideoResultRepository videoResultRepository;
    
    @Autowired
    private VideoAnalysisService videoAnalysisService;

    public List<VideoResult> getUserVideos(String username) {
        if (username != null && username.equalsIgnoreCase("admin")) {
            return videoResultRepository.findAllByOrderByCreatedAtDesc();
        }
        return videoResultRepository.findByUsernameOrderByCreatedAtDesc(username);
    }
    
    /**
     * Retorna todos os vídeos do usuário ordenados por data de criação (mais recentes primeiro)
     * @param username Nome do usuário
     * @return Lista de vídeos do usuário
     */
    public List<VideoResult> getRecentVideos(String username) {
        return getRecentVideos(username, null);
    }

    public List<VideoResult> getRecentVideos(String username, String role) {
        logger.info("Buscando vídeos recentes para username={} role={}", username, role);
        if ("ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role)) {
            List<VideoResult> videos = videoResultRepository.findAllByOrderByCreatedAtDesc();
            logger.info("Usuário admin detectado; retornando todos os vídeos. Total: {}", videos.size());
            return videos;
        }
        if ("TRAINER".equalsIgnoreCase(role) || "ROLE_TRAINER".equalsIgnoreCase(role)) {
            List<VideoResult> videos = videoResultRepository.findAllByOrderByCreatedAtDesc();
            logger.info("Usuário treinador detectado; retornando vídeos de atletas vinculados. Total: {}", videos.size());
            return videos;
        }
        List<VideoResult> videos = videoResultRepository.findByUsernameOrderByCreatedAtDesc(username);
        logger.info("Encontrados {} vídeos para o usuário: {}", videos.size(), username);
        return videos;
    }
    
    /**
     * Busca um vídeo pelo ID
     * @param id ID do vídeo
     * @return Optional contendo o vídeo se encontrado
     */
    public Optional<VideoResult> getVideoById(Long id) {
        logger.debug("Buscando vídeo por ID: {}", id);
        return videoResultRepository.findById(id);
    }
    
    /**
     * Busca um vídeo pelo ID e valida se pertence ao usuário
     * @param id ID do vídeo
     * @param username Nome do usuário para validação
     * @return Optional contendo o vídeo se encontrado e pertencer ao usuário
     */
    public Optional<VideoResult> getVideoById(Long id, String username) {
        logger.debug("Buscando vídeo por ID: {} para o usuário: {}", id, username);
        if (username != null && username.equalsIgnoreCase("admin")) {
            return videoResultRepository.findById(id);
        }
        return videoResultRepository.findByIdAndUsername(id, username);
    }
    
    @Transactional
    public VideoResult saveVideo(String filename, String fileKey, String username, String surferName, String contentType, long fileSize) {
        VideoResult video = new VideoResult();
        video.setFilename(filename);
        video.setS3Key(fileKey);
        video.setUsername(username);
        video.setSurfer(surferName);
        video.setContentType(contentType);
        video.setFileSize(fileSize);
        video.setStatus("UPLOADED");
        
        return uploadVideo(video);
    }

    @Transactional
    public VideoResult uploadVideo(VideoResult videoResult) {
        logger.info(" Iniciando upload do vídeo: {}", videoResult.getFilename());
        
        // Salvar o vídeo no banco de dados
        logger.debug("Salvando vídeo no banco de dados...");
        logger.debug("Dados do vídeo antes do save: {}", videoResult);
        
        // Salvar o vídeo primeiro
        VideoResult savedVideo = videoResultRepository.saveAndFlush(videoResult);
        logger.info(" Vídeo salvo com sucesso. ID: {}", savedVideo.getId());
        
        // Iniciar análise assíncrona do vídeo em uma nova transação
        startAsyncAnalysis(savedVideo);
        
        return savedVideo;
    }
    
    /**
     * Inicia a análise assíncrona do vídeo em uma nova transação
     * @param video O vídeo a ser analisado
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void startAsyncAnalysis(VideoResult video) {
        try {
            logger.debug("Iniciando análise assíncrona do vídeo ID: {}", video.getId());
            videoAnalysisService.analyzeVideo(video);
            logger.info("Análise do vídeo {} concluída com sucesso", video.getId());
        } catch (Exception e) {
            logger.error("Erro ao analisar o vídeo ID: {}", video.getId(), e);
            // Atualiza o status do vídeo para falha
            video.setStatus("ANALYSIS_FAILED");
            videoResultRepository.save(video);
        }
    }
    
    @Async
    public CompletableFuture<Void> startVideoAnalysis(VideoResult video) {
        return videoAnalysisService.analyzeVideo(video)
            .thenAccept(analyzedVideo -> {
                // Atualiza o vídeo com os resultados da análise
                videoResultRepository.save(analyzedVideo);
                
                // Aqui você pode adicionar notificações ou outras ações pós-análise
                System.out.println("Vídeo analisado: " + analyzedVideo.getFilename() + 
                                 " - Pontuação: " + analyzedVideo.getScore());
            })
            .exceptionally(ex -> {
                System.err.println("Erro ao analisar o vídeo: " + video.getFilename());
                ex.printStackTrace();
                return null;
            });
    }
    
    public Optional<VideoResult> getVideoByIdAndUser(Long id, String username) {
        return videoResultRepository.findByIdAndSurfer(id, username);
    }
    
    /**
     * Deletes a video if it belongs to the specified user
     * @param id The ID of the video to delete
     * @param username The username of the user requesting deletion
     * @return true if deletion was successful, false otherwise
     */
    @Autowired
    private StorageService storageService;
    
    @Transactional
    public boolean deleteVideo(Long id, String username) {
        try {
            // First verify the video exists and belongs to the user
            Optional<VideoResult> videoOpt = getVideoById(id, username);
            if (videoOpt.isEmpty()) {
                logger.warn("Attempt to delete non-existent or unauthorized video: ID={}, User={}", id, username);
                return false;
            }
            
            VideoResult video = videoOpt.get();
            String fileKey = video.getS3Key();
            
            // Delete the video file from storage if it exists
            if (fileKey != null && !fileKey.trim().isEmpty()) {
                try {
                    logger.info("Attempting to delete file with key: '{}' (length: {})", fileKey, fileKey.length());
                    logger.info("Current working directory: {}", System.getProperty("user.dir"));
                    
                    // Chama o serviço de armazenamento para excluir o arquivo
                    storageService.deleteFile(fileKey);
                    logger.info("Successfully deleted video file from storage: {}", fileKey);
                } catch (Exception e) {
                    logger.warn("Error deleting video file from storage: {} - continuing with database deletion", fileKey, e);
                    // Continue with database deletion even if file deletion fails
                }
            } else {
                logger.warn("No file key provided for video ID: {}. Skipping file deletion.", id);
            }
            
            // Delete the video from the database
            videoResultRepository.deleteById(id);
            logger.info("Successfully deleted video record: ID={}, User={}", id, username);
            return true;
            
        } catch (Exception e) {
            logger.error("Error deleting video ID={}, User={}: {}", id, username, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Busca todos os vídeos ordenados por data de criação (mais recentes primeiro)
     * @return Lista de todos os vídeos
     */
    public List<VideoResult> getAllVideos() {
        logger.info("Buscando todos os vídeos ordenados por data de criação...");
        return videoResultRepository.findAllByOrderByCreatedAtDesc();
    }
    
    /**
     * Verifica se um vídeo com o ID especificado existe no banco de dados
     * @param id O ID do vídeo a ser verificado
     * @return true se o vídeo existir, false caso contrário
     */
    public boolean existsById(Long id) {
        return videoResultRepository.existsById(id);
    }
    
    /**
     * Força a sincronização com o banco de dados
     */
    @Transactional
    public void flush() {
        videoResultRepository.flush();
    }
    
    /**
     * Busca um vídeo pelo seu ID
     * @param id O ID do vídeo a ser buscado
     * @return Um Optional contendo o vídeo, se encontrado
     */
    public Optional<VideoResult> findById(Long id) {
        logger.info("Buscando vídeo pelo ID: {}", id);
        return videoResultRepository.findById(id);
    }
}
