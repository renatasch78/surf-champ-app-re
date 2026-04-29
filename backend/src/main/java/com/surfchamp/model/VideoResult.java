package com.surfchamp.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "video_results")
public class VideoResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @JsonProperty("filename")
    private String filename;
    
    @Column(nullable = false)
    @JsonProperty("surfer")
    private String surfer;
    
    @Column(name = "username", nullable = false)
    @JsonProperty("username")
    private String username;
    
    @Column(nullable = false)
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("score")
    private double score;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    @JsonProperty("updatedAt")
    private Instant updatedAt;
    
    @Column(name = "job_id")
    @JsonProperty("jobId")
    private String jobId;
    
    @Column(name = "s3_key", length = 500)
    @JsonProperty("s3Key")
    private String s3Key;
    
    @Column(name = "video_url", length = 1000)
    @JsonProperty("videoUrl")
    private String videoUrl;
    
    @Column(name = "content_type")
    @JsonProperty("contentType")
    private String contentType;
    
    @Column(name = "file_size")
    @JsonProperty("fileSize")
    private Long fileSize;
    
    @Column(name = "manobras", length = 1000)
    @JsonProperty("manobras")
    private String manobras;
    
    @Column(name = "pontuacoes_manobras", length = 2000)
    @JsonProperty("pontuacoesManobras")
    private String pontuacoesManobras;
    
    @Column(name = "dicas_melhoria", length = 4000)
    @JsonProperty("dicasMelhoria")
    private String dicasMelhoria;
    
    @Column(name = "feedback", length = 4000)
    @JsonProperty("feedback")
    private String feedback;
    
    @Column(name = "error_details", length = 2000)
    @JsonProperty("errorDetails")
    private String errorDetails;
    
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public VideoResult() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    
    public String getSurfer() { return surfer; }
    public void setSurfer(String surfer) { this.surfer = surfer; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    
    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    
    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public String getManobras() { return manobras; }
    public void setManobras(String manobras) { this.manobras = manobras; }
    
    public String getPontuacoesManobras() { return pontuacoesManobras; }
    public void setPontuacoesManobras(String pontuacoesManobras) { this.pontuacoesManobras = pontuacoesManobras; }
    
    public String getDicasMelhoria() { return dicasMelhoria; }
    public void setDicasMelhoria(String dicasMelhoria) { this.dicasMelhoria = dicasMelhoria; }
    
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    
    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }
    
    @Override
    public String toString() {
        return "VideoResult{" +
                "id=" + id +
                ", filename='" + filename + '\'' +
                ", surfer='" + surfer + '\'' +
                ", username='" + username + '\'' +
                ", status='" + status + '\'' +
                ", score=" + score +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", jobId='" + jobId + '\'' +
                ", s3Key='" + s3Key + '\'' +
                ", videoUrl='" + videoUrl + '\'' +
                ", contentType='" + contentType + '\'' +
                ", fileSize=" + fileSize +
                '}';
    }
}
