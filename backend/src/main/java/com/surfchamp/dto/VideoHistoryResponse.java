package com.surfchamp.dto;

import com.surfchamp.model.VideoResult;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public class VideoHistoryResponse {
    private Long id;
    private String filename;
    private String surfer;
    private String status;
    private double score;
    private String createdAt;
    private String updatedAt;
    private Long fileSize;

    public VideoHistoryResponse(VideoResult video) {
        this.id = video.getId();
        this.filename = video.getFilename();
        this.surfer = video.getSurfer();
        this.status = video.getStatus();
        this.score = video.getScore();
        this.createdAt = video.getCreatedAt() != null ? video.getCreatedAt().toString() : null;
        this.updatedAt = video.getUpdatedAt() != null ? video.getUpdatedAt().toString() : null;
        this.fileSize = video.getFileSize();
    }

    // Getters
    public Long getId() { return id; }
    public String getFilename() { return filename; }
    public String getSurfer() { return surfer; }
    public String getStatus() { return status; }
    public double getScore() { return score; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public Long getFileSize() { return fileSize; }

    // Método estático para converter lista de VideoResult para lista de VideoHistoryResponse
    public static List<VideoHistoryResponse> fromVideoList(List<VideoResult> videos) {
        return videos.stream()
                .map(VideoHistoryResponse::new)
                .collect(Collectors.toList());
    }
}
