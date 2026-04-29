package com.surfchamp.dto;

import org.springframework.web.multipart.MultipartFile;

public class VideoUploadRequest {
    private MultipartFile file;
    private String surferName;

    // Getters e Setters
    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }

    public String getSurferName() {
        return surferName;
    }

    public void setSurferName(String surferName) {
        this.surferName = surferName;
    }
}
