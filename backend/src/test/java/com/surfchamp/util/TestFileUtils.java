package com.surfchamp.util;

import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.StreamUtils;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class TestFileUtils {
    
    public static final String TEST_VIDEO_MP4 = "src/test/resources/test-files/sample.mp4";
    public static final String TEST_VIDEO_AVI = "src/test/resources/test-files/sample.avi";
    public static final String TEST_VIDEO_MOV = "src/test/resources/test-files/sample.mov";
    public static final String TEST_INVALID_FILE = "src/test/resources/test-files/invalid.pdf";
    
    public static MockMultipartFile createMockVideoFile(String filename, String contentType) throws IOException {
        Path path = Paths.get(filename);
        String name = path.getFileName().toString();
        String originalFilename = name;
        byte[] content = Files.readAllBytes(path);
        
        return new MockMultipartFile(
            "file",
            originalFilename,
            contentType,
            content
        );
    }
    
    public static File createTempVideoFile(String prefix, String suffix, long sizeInBytes) throws IOException {
        File tempFile = File.createTempFile(prefix, suffix);
        tempFile.deleteOnExit();
        
        // Fill with dummy data
        byte[] data = new byte[(int) sizeInBytes];
        Files.write(tempFile.toPath(), data);
        
        return tempFile;
    }
    
    public static MockMultipartFile createMockMultipartFile(String name, String originalFilename, 
                                                          String contentType, byte[] content) {
        return new MockMultipartFile(name, originalFilename, contentType, content);
    }
    
    public static byte[] readFileToByteArray(String filePath) throws IOException {
        return Files.readAllBytes(Paths.get(filePath));
    }
}
