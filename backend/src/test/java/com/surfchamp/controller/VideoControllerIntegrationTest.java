package com.surfchamp.controller;

import com.surfchamp.model.VideoResult;
import com.surfchamp.service.S3StorageService;
import com.surfchamp.service.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class VideoControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private VideoService videoService;

    @Mock
    private S3StorageService s3StorageService;

    @InjectMocks
    private VideoController videoController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(videoController)
                .setControllerAdvice(new com.surfchamp.exception.GlobalExceptionHandler())
                .build();
    }

    @Test
    void uploadVideo_ValidFile_ShouldReturnCreated() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.mp4",
                "video/mp4",
                "test video content".getBytes()
        );

        VideoResult video = new VideoResult();
        video.setId(1L);
        video.setFilename("test.mp4");
        video.setStatus("UPLOADED");

        when(videoService.save(any(VideoResult.class))).thenReturn(video);
        when(s3StorageService.uploadFile(any())).thenReturn("s3-key-123");
        when(s3StorageService.generatePresignedUrl(anyString())).thenReturn("http://presigned.url/test.mp4");

        // Act & Assert
        mockMvc.perform(multipart("/api/videos/upload")
                        .file(file)
                        .param("surferName", "testuser")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Vídeo enviado com sucesso")));

        verify(videoService, times(1)).save(any(VideoResult.class));
        verify(s3StorageService, times(1)).uploadFile(any());
    }

    @Test
    void uploadVideo_EmptyFile_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.mp4",
                "video/mp4",
                new byte[0]
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/videos/upload")
                        .file(file)
                        .param("surferName", "testuser")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O arquivo não pode estar vazio"));
    }

    @Test
    void getVideoHistory_ValidUser_ShouldReturnVideos() throws Exception {
        // Arrange
        VideoResult video = new VideoResult();
        video.setId(1L);
        video.setFilename("test.mp4");
        video.setSurfer("testuser");
        video.setStatus("PROCESSED");
        video.setScore(85.5);

        when(videoService.findBySurferOrderByCreatedAtDesc("testuser"))
                .thenReturn(Collections.singletonList(video));
        when(s3StorageService.generatePresignedUrl(anyString()))
                .thenReturn("http://presigned.url/test.mp4");

        // Act & Assert
        mockMvc.perform(get("/api/videos/history")
                        .param("username", "testuser")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].filename").value("test.mp4"))
                .andExpect(jsonPath("$[0].status").value("PROCESSED"))
                .andExpect(jsonPath("$[0].score").value(85.5));
    }

    @Test
    void getVideoHistory_NoUsername_ShouldReturnBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/videos/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
