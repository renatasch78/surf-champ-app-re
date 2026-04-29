package com.surfchamp.repository;

import com.surfchamp.model.VideoResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
import java.util.Optional;

@NoRepositoryBean
public interface CustomVideoResultRepository extends JpaRepository<VideoResult, Long>, JpaSpecificationExecutor<VideoResult> {
    List<VideoResult> findBySurferOrderByCreatedAtDesc(String surfer);
    Optional<VideoResult> findByIdAndSurfer(Long id, String surfer);
    List<VideoResult> findAllByOrderByCreatedAtDesc();
    List<VideoResult> findTop5BySurferOrderByCreatedAtDesc(String surfer);
}
