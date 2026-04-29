package com.surfchamp.repository;

import com.surfchamp.model.VideoResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface VideoResultRepository extends JpaRepository<VideoResult, Long>, JpaSpecificationExecutor<VideoResult> {
    List<VideoResult> findBySurferOrderByCreatedAtDesc(String surfer);
    
    List<VideoResult> findByUsernameOrderByCreatedAtDesc(String username);
    
    Optional<VideoResult> findByIdAndSurfer(Long id, String surfer);
    
    Optional<VideoResult> findByIdAndUsername(Long id, String username);
    
    List<VideoResult> findTop5BySurferOrderByCreatedAtDesc(String surfer);
    
    List<VideoResult> findAllByOrderByCreatedAtDesc();
    
    /**
     * Força a sincronização com o banco de dados
     */
    @Override
    void flush();
}
