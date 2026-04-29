package com.surfchamp.service;

import com.surfchamp.exception.FileValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileValidationServiceTest {

    private FileValidationService fileValidationService;
    
    @Mock
    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService(
            Arrays.asList("video/mp4", "video/avi", "video/*"),
            10485760L, // 10MB
            Arrays.asList("mp4", "avi", "mov")
        );
    }

    @Test
    void validateFile_ValidVideo_ShouldNotThrowException() {
        when(mockFile.getOriginalFilename()).thenReturn("test.mp4");
        when(mockFile.getSize()).thenReturn(5 * 1024 * 1024L); // 5MB
        when(mockFile.getContentType()).thenReturn("video/mp4");
        
        assertDoesNotThrow(() -> fileValidationService.validateFile(mockFile));
    }

    @Test
    void validateFile_EmptyFile_ShouldThrowException() {
        when(mockFile.isEmpty()).thenReturn(true);
        
        FileValidationException exception = assertThrows(
            FileValidationException.class,
            () -> fileValidationService.validateFile(mockFile)
        );
        
        assertEquals("O arquivo não pode estar vazio", exception.getMessage());
    }

    @Test
    void validateFile_InvalidExtension_ShouldThrowException() {
        when(mockFile.getOriginalFilename()).thenReturn("test.pdf");
        when(mockFile.getSize()).thenReturn(1024L);
        
        FileValidationException exception = assertThrows(
            FileValidationException.class,
            () -> fileValidationService.validateFile(mockFile)
        );
        
        assertTrue(exception.getMessage().contains("Extensão de arquivo não suportada"));
    }

    @Test
    void validateFile_FileTooLarge_ShouldThrowException() {
        when(mockFile.getOriginalFilename()).thenReturn("test.mp4");
        when(mockFile.getSize()).thenReturn(20 * 1024 * 1024L); // 20MB
        
        FileValidationException exception = assertThrows(
            FileValidationException.class,
            () -> fileValidationService.validateFile(mockFile)
        );
        
        assertTrue(exception.getMessage().contains("Tamanho do arquivo"));
        assertTrue(exception.getMessage().contains("excede o limite"));
    }

    @Test
    void validateFile_InvalidMimeType_ShouldThrowException() {
        when(mockFile.getOriginalFilename()).thenReturn("test.mp4");
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getContentType()).thenReturn("application/pdf");
        
        FileValidationException exception = assertThrows(
            FileValidationException.class,
            () -> fileValidationService.validateFile(mockFile)
        );
        
        assertTrue(exception.getMessage().contains("Tipo de arquivo não suportado"));
    }
}
