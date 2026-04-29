package com.surfchamp.repository;

import com.surfchamp.model.VideoResult;

import java.util.List;
import java.util.Optional;

public interface VideoResultRepositoryCustom {
    List<VideoResult> findBySurferOrderByCreatedAtDesc(String surfer);
    Optional<VideoResult> findByIdAndSurfer(Long id, String surfer);
    List<VideoResult> findAllByOrderByCreatedAtDesc();
    List<VideoResult> findTop5BySurferOrderByCreatedAtDesc(String surfer);
    Optional<VideoResult> findVideoById(Long id);
}
