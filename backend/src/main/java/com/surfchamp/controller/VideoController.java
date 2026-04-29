package com.surfchamp.controller;

import com.surfchamp.dto.VideoHistoryResponse;
import com.surfchamp.exception.FileValidationException;
import com.surfchamp.model.VideoResult;
import com.surfchamp.model.enums.SupportedMediaType;
import com.surfchamp.service.FileValidationService;
import com.surfchamp.service.S3StorageService;
import com.surfchamp.service.StorageService;
import com.surfchamp.service.VideoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/videos")
public class VideoController {
    private static final Logger logger = LoggerFactory.getLogger(VideoController.class);

    private final VideoService videoService;
    private final StorageService storageService;
    private final FileValidationService fileValidationService;

    @Autowired
    public VideoController(VideoService videoService,
                          StorageService storageService,
                          FileValidationService fileValidationService) {
        this.videoService = videoService;
        this.storageService = storageService;
        this.fileValidationService = fileValidationService;
        logger.info("Initializing VideoController with StorageService implementation: {}", storageService.getClass().getName());
    }
    
    /**
     * Endpoint para streaming de vídeo
     * @param id ID do vídeo
     * @return Resposta HTTP com o conteúdo do vídeo
     */
    @GetMapping(value = "/stream/{id}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> streamVideo(@PathVariable Long id, @RequestHeader(value = "Range", required = false) String rangeHeader) {
        logger.info("Recebida requisição para streaming do vídeo ID: {}", id);
        
        try {
            // Busca o vídeo pelo ID
            Optional<VideoResult> videoOpt = videoService.getVideoById(id);
            if (videoOpt.isEmpty()) {
                logger.warn("Vídeo não encontrado para o ID: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            VideoResult video = videoOpt.get();
            
            // Verifica se o vídeo tem uma chave S3 configurada
            if (video.getS3Key() == null || video.getS3Key().isEmpty()) {
                logger.warn("Vídeo ID: {} não possui uma chave S3 configurada", id);
                return ResponseEntity.badRequest().body("Vídeo não possui uma chave S3 configurada".getBytes());
            }
            
            // Obtém os bytes do arquivo do S3
            byte[] videoBytes = storageService.downloadFile(video.getS3Key());
            
            // Configura os cabeçalhos da resposta
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentLength(videoBytes.length);
            headers.set("Content-Disposition", "inline; filename=\"" + video.getFilename() + "\"");
            
            // Se o cliente suportar range requests, adiciona os cabeçalhos apropriados
            if (rangeHeader != null) {
                headers.set("Accept-Ranges", "bytes");
                // Implementação básica de suporte a range requests
                // Em uma implementação real, você pode querer implementar suporte a byte ranges
            }
            
            logger.info("Streaming do vídeo ID: {} iniciado com sucesso", id);
            return new ResponseEntity<>(videoBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            logger.error("Erro ao fazer streaming do vídeo ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(("Erro ao processar o vídeo: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentVideos() {
        String authenticatedUsername = getAuthenticatedUsername();
        String role = getAuthenticatedRole();
        logger.info("🔍 Recebida requisição para /recent para usuário autenticado: {} role: {}", authenticatedUsername, role);
        
        try {
            logger.info("🔄 Buscando vídeos recentes para o usuário autenticado: {}", authenticatedUsername);
            List<VideoResult> videos = videoService.getRecentVideos(authenticatedUsername, role);
            logger.info("✅ Encontrados {} vídeos recentes", videos.size());
            
            // Adiciona URL para cada vídeo (S3: URL assinada, Local: caminho relativo)
            videos.forEach(video -> {
                if (video.getS3Key() != null) {
                    // Para arquivos no S3, gera URL assinada
                    String videoUrl = storageService.generatePresignedUrl(video.getS3Key());
                    video.setVideoUrl(videoUrl);
                } else {
                    // Para arquivos locais, constrói a URL baseada no ID do vídeo
                    String videoUrl = "/api/videos/stream/" + video.getId();
                    video.setVideoUrl(videoUrl);
                    logger.debug("URL gerada para vídeo local ID {}: {}", video.getId(), videoUrl);
                }
            });
            return ResponseEntity.ok(VideoHistoryResponse.fromVideoList(videos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao buscar histórico de vídeos: " + e.getMessage());
        }
    }

    @PostMapping(value = "/debug-upload", consumes = {"multipart/form-data"})
    public ResponseEntity<?> debugUpload(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(required = false) String surferName,
            @RequestParam(required = false) String username) {
        
        logger.info("=== DEBUG UPLOAD REQUEST ===");
        logger.info("SurferName: {}", surferName);
        logger.info("File present: {}", file != null);
        
        if (file != null) {
            logger.info("File details: name={}, size={}, contentType={}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "Debug endpoint reached",
            "username", username,
            "surferName", surferName,
            "filePresent", file != null,
            "fileName", file != null ? file.getOriginalFilename() : null,
            "fileSize", file != null ? file.getSize() : null,
            "fileType", file != null ? file.getContentType() : null
        ));
    }

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<?> uploadVideo(
            @RequestPart("file") MultipartFile file,
            @RequestParam String surferName,
            @RequestParam String username) {
        try {
            logger.info("=== UPLOAD REQUEST RECEIVED ===");
            logger.info("Username: {}", username);
            logger.info("SurferName: {}", surferName);
            logger.info("File: name={}, size={}, contentType={}",
            file.getOriginalFilename(), file.getSize(), file.getContentType());
            
            // Validação básica
            if (username == null || username.trim().isEmpty()) {
                throw new FileValidationException("Nome do usuário é obrigatório");
            }
            
            if (surferName == null || surferName.trim().isEmpty()) {
                throw new FileValidationException("Nome do surfista é obrigatório");
            }
            
            // Valida o arquivo e obtém o tipo de mídia
            SupportedMediaType mediaType = fileValidationService.validateFile(file);
            String originalFilename = file.getOriginalFilename();
            long fileSize = file.getSize();
            
            logger.debug("Iniciando upload do arquivo: {} ({} bytes, {})", 
                originalFilename, fileSize, mediaType.getMimeType());
                
            // Faz o upload do arquivo (S3 ou armazenamento local)
            String fileKey;
            try {
                fileKey = storageService.uploadFile(file);
            } catch (Exception e) {
                logger.error("Erro ao fazer upload do arquivo: " + e.getMessage(), e);
                throw new FileValidationException("Falha ao fazer upload do arquivo: " + e.getMessage());
            }
            
            // Salva a referência do vídeo no banco de dados
            VideoResult videoResult = videoService.saveVideo(
                file.getOriginalFilename(), 
                fileKey, 
                username,
                surferName,
                mediaType.getMimeType(),
                fileSize
            );
            
            // Gera URL para o vídeo (S3: URL assinada, Local: caminho relativo)
            String videoUrl = storageService.generatePresignedUrl(fileKey);
            videoResult.setVideoUrl(videoUrl);
            
            logger.info("Vídeo salvo com sucesso. ID: {}", videoResult.getId());
            
            // Inicia a análise do vídeo em segundo plano, se necessário
            logger.debug("Análise do vídeo {} iniciada em segundo plano", videoResult.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "message", "Vídeo enviado com sucesso",
                    "videoId", videoResult.getId(),
                    "filename", originalFilename,
                    "contentType", mediaType.getMimeType(),
                    "size", fileSize,
                    "status", "UPLOADED"
                ));
            
        } catch (FileValidationException e) {
            logger.warn("Falha na validação do arquivo: {}", e.getMessage());
            throw e; // Será tratado pelo GlobalExceptionHandler
        } catch (Exception e) {
            logger.error("Erro ao processar upload do vídeo", e);
            throw new RuntimeException("Erro ao processar o upload do vídeo", e);
        }
    }
    
    @PostMapping("/test-video")
    public ResponseEntity<?> createTestVideo() {
        logger.info("🔄 Iniciando criação de vídeo de teste...");
        
        try {
            // Criar objeto de teste
            VideoResult testVideo = new VideoResult();
            String filename = "test_video_" + System.currentTimeMillis() + ".mp4";
            String surfer = "test_user";
            
            logger.debug("Definindo propriedades do vídeo de teste...");
            logger.debug("Filename: {}", filename);
            logger.debug("Surfer: {}", surfer);
            
            testVideo.setFilename(filename);
            testVideo.setSurfer(surfer);
            testVideo.setStatus("UPLOADED"); // Alterado para UPLOADED para seguir o fluxo normal
            testVideo.setScore(0.0); // Iniciar com 0, será atualizado após análise
            testVideo.setS3Key("videos/" + filename);
            testVideo.setVideoUrl("https://your-bucket.s3.amazonaws.com/videos/" + filename);
            testVideo.setContentType("video/mp4");
            testVideo.setFileSize(10485760L); // 10MB
            
            // Definir timestamps manualmente
            Instant now = Instant.now();
            testVideo.setCreatedAt(now);
            testVideo.setUpdatedAt(now);
            
            logger.debug("Objeto VideoResult criado: {}", testVideo);
            logger.debug("Chamando videoService.uploadVideo...");
            
            // Salva o vídeo usando o serviço com transação explícita
            logger.debug("Chamando videoService.uploadVideo...");
            VideoResult savedVideo = videoService.uploadVideo(testVideo);
            
            if (savedVideo == null || savedVideo.getId() == null) {
                logger.error("❌ Erro: videoService.uploadVideo retornou null ou ID nulo");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao salvar o vídeo: serviço retornou null ou ID nulo"));
            }
            
            logger.info("✅ Vídeo de teste criado com sucesso. ID: {}", savedVideo.getId());
            
            // Verificar se o vídeo foi realmente salvo no banco de dados
            logger.debug("Verificando se o vídeo foi salvo no banco de dados...");
            Optional<VideoResult> dbVideo = videoService.findById(savedVideo.getId());
            if (dbVideo.isEmpty()) {
                logger.error("❌ ERRO CRÍTICO: O vídeo com ID {} não foi encontrado no banco de dados após o save", savedVideo.getId());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Falha ao verificar o vídeo no banco de dados",
                        "videoId", savedVideo.getId()
                    ));
            } else {
                logger.info("✅ Confirmação: Vídeo encontrado no banco de dados. ID: {}", savedVideo.getId());
            }
            
            // Forçar o flush e clear da sessão para garantir que tudo esteja sincronizado
            try {
                logger.debug("Forçando flush e clear da sessão do Hibernate...");
                videoService.flush();
                logger.debug("Sessão do Hibernate sincronizada com o banco de dados");
                
                // Buscar o vídeo novamente após o flush para garantir que está tudo ok
                Optional<VideoResult> verifiedVideo = videoService.findById(savedVideo.getId());
                if (verifiedVideo.isEmpty()) {
                    logger.error("❌ ERRO CRÍTICO: Vídeo não encontrado após o flush. ID: {}", savedVideo.getId());
                } else {
                    logger.info("✅ Confirmação pós-flush: Vídeo encontrado. ID: {}", verifiedVideo.get().getId());
                }
            } catch (Exception e) {
                logger.error("⚠️ Erro ao sincronizar a sessão do Hibernate: {}", e.getMessage(), e);
                // Não interrompemos o fluxo, apenas registramos o erro
            }
            
            // Retornar os dados do vídeo recém-criado diretamente
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "Vídeo de teste criado com sucesso",
                    "videoId", savedVideo.getId(),
                    "filename", savedVideo.getFilename(),
                    "status", savedVideo.getStatus(),
                    "surfer", savedVideo.getSurfer(),
                    "createdAt", savedVideo.getCreatedAt(),
                    "videoUrl", savedVideo.getVideoUrl(),
                    "score", savedVideo.getScore()
                ));
                
        } catch (Exception e) {
            logger.error("❌ Erro ao criar vídeo de teste", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Erro ao criar vídeo de teste: " + e.getMessage(),
                    "exceptionType", e.getClass().getName(),
                    "stackTrace", Arrays.stream(e.getStackTrace())
                                     .map(StackTraceElement::toString)
                                     .collect(Collectors.toList())
                ));
        }
    }
    
    @GetMapping("")
    public ResponseEntity<?> getAllVideos() {
        try {
            logger.info("🔄 Listando todos os vídeos...");
            List<VideoResult> videos = videoService.getAllVideos();
            logger.info("✅ Encontrados {} vídeos", videos.size());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            logger.error("❌ Erro ao listar vídeos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Erro ao listar vídeos: " + e.getMessage(),
                    "exceptionType", e.getClass().getName()
                ));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getVideo(@PathVariable Long id) {
        String authenticatedUsername = getAuthenticatedUsername();
        try {
            logger.info("Buscando vídeo com ID: {} (usuário: {})", id, authenticatedUsername != null ? authenticatedUsername : "desconhecido");
            
            Optional<VideoResult> videoOpt = videoService.getVideoById(id, authenticatedUsername);
            
            if (videoOpt.isEmpty()) {
                logger.warn("Vídeo não encontrado ou sem permissão: ID={}, User={}", id, authenticatedUsername);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Vídeo não encontrado ou você não tem permissão para acessá-lo");
            }
            
            VideoResult video = videoOpt.get();
            
            // Adiciona URL assinada se o vídeo estiver no S3
            if (video.getS3Key() != null) {
                try {
                    String presignedUrl = storageService.generatePresignedUrl(video.getS3Key());
                    video.setVideoUrl(presignedUrl);
                    logger.debug("URL assinada gerada com sucesso para o vídeo ID: {}", id);
                } catch (Exception e) {
                    logger.warn("Erro ao gerar URL assinada para o vídeo ID: {} - {}", id, e.getMessage());
                    // Continua mesmo sem a URL assinada
                }
            }
            
            return ResponseEntity.ok(video);
            
        } catch (Exception e) {
            logger.error("Erro ao buscar vídeo ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao buscar vídeo: " + e.getMessage());
        }
    }
    
    /**
     * Exclui um vídeo do usuário
     * @param id ID do vídeo a ser excluído
     * @param username Nome do usuário (para validação de permissão)
     * @return Resposta com o resultado da operação
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVideo(
            @PathVariable Long id) {
        String authenticatedUsername = getAuthenticatedUsername();
        logger.info("Recebida solicitação para excluir vídeo ID: {}, usuário: {}", id, authenticatedUsername);
        
        try {
            // Verifica se o vídeo existe e pertence ao usuário
            Optional<VideoResult> videoOpt = videoService.getVideoById(id, authenticatedUsername);
            if (videoOpt.isEmpty()) {
                logger.warn("Tentativa de excluir vídeo não encontrado ou sem permissão: ID={}, User={}", id, authenticatedUsername);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Vídeo não encontrado ou você não tem permissão para excluí-lo");
            }
            
            // Tenta excluir o vídeo
            boolean deleted = videoService.deleteVideo(id, authenticatedUsername);
            
            if (deleted) {
                logger.info("Vídeo excluído com sucesso: ID={}, User={}", id, authenticatedUsername);
                return ResponseEntity.ok().body("Vídeo excluído com sucesso");
            } else {
                logger.warn("Falha ao excluir vídeo: ID={}, User={}", id, authenticatedUsername);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Falha ao excluir o vídeo");
            }
            
        } catch (Exception e) {
            logger.error("Erro ao excluir vídeo: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao excluir o vídeo: " + e.getMessage());
        }
    }

    private String getAuthenticatedUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal != null ? principal.toString() : null;
    }

    private String getAuthenticatedRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse(null);
    }
}
