package com.surfchamp.service;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ThumbnailService {
    private static final Logger logger = LoggerFactory.getLogger(ThumbnailService.class);
    
    @Value("${file.storage.location:./uploads}")
    private String uploadDir;
    
    @Value("${app.thumbnail.width:320}")
    private int thumbnailWidth;
    
    @Value("${app.thumbnail.height:180}")
    private int thumbnailHeight;
    
    /**
     * Gera uma miniatura a partir de um arquivo de vídeo
     * @param videoFile Arquivo de vídeo
     * @return Nome do arquivo da miniatura gerada
     */
    public String generateThumbnail(MultipartFile videoFile) throws IOException {
        // Cria o diretório de uploads se não existir
        File uploadDir = new File(this.uploadDir);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        
        // Gera um nome único para o arquivo de miniatura
        String thumbnailName = "thumb_" + UUID.randomUUID() + ".jpg";
        Path thumbnailPath = Paths.get(this.uploadDir, thumbnailName);
        
        try (FFmpegFrameGrabber frameGrabber = new FFmpegFrameGrabber(videoFile.getInputStream())) {
            frameGrabber.start();
            
            // Pega o primeiro frame do vídeo
            Frame frame = frameGrabber.grabImage();
            if (frame == null) {
                throw new IOException("Não foi possível capturar um frame do vídeo");
            }
            
            // Converte o frame para BufferedImage
            Java2DFrameConverter converter = new Java2DFrameConverter();
            BufferedImage image = converter.convert(frame);
            
            // Redimensiona a imagem para o tamanho da miniatura
            BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight, BufferedImage.TYPE_INT_RGB);
            thumbnail.createGraphics().drawImage(
                image.getScaledInstance(thumbnailWidth, thumbnailHeight, Image.SCALE_SMOOTH),
                0, 0, null
            );
            
            // Salva a miniatura em disco
            ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());
            
            logger.info("Miniatura gerada com sucesso: {}", thumbnailPath);
            return thumbnailName;
            
        } catch (Exception e) {
            logger.error("Erro ao gerar miniatura: {}", e.getMessage(), e);
            throw new IOException("Falha ao gerar miniatura: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera uma miniatura a partir de um arquivo de vídeo existente
     * @param videoPath Caminho para o arquivo de vídeo
     * @return Nome do arquivo da miniatura gerada
     */
    public String generateThumbnailFromFile(Path videoPath) throws IOException {
        // Cria o diretório de uploads se não existir
        File uploadDir = new File(this.uploadDir);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        
        // Gera um nome único para o arquivo de miniatura
        String thumbnailName = "thumb_" + UUID.randomUUID() + ".jpg";
        Path thumbnailPath = Paths.get(this.uploadDir, thumbnailName);
        
        try (FFmpegFrameGrabber frameGrabber = new FFmpegFrameGrabber(videoPath.toFile())) {
            frameGrabber.start();
            
            // Pega o primeiro frame do vídeo
            Frame frame = frameGrabber.grabImage();
            if (frame == null) {
                throw new IOException("Não foi possível capturar um frame do vídeo");
            }
            
            // Converte o frame para BufferedImage
            Java2DFrameConverter converter = new Java2DFrameConverter();
            BufferedImage image = converter.convert(frame);
            
            // Redimensiona a imagem para o tamanho da miniatura
            BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight, BufferedImage.TYPE_INT_RGB);
            thumbnail.createGraphics().drawImage(
                image.getScaledInstance(thumbnailWidth, thumbnailHeight, Image.SCALE_SMOOTH),
                0, 0, null
            );
            
            // Salva a miniatura em disco
            ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());
            
            logger.info("Miniatura gerada com sucesso: {}", thumbnailPath);
            return thumbnailName;
            
        } catch (Exception e) {
            logger.error("Erro ao gerar miniatura: {}", e.getMessage(), e);
            throw new IOException("Falha ao gerar miniatura: " + e.getMessage(), e);
        }
    }
}
