package com.surfchamp.service;

import com.surfchamp.model.VideoResult;
import com.surfchamp.repository.VideoResultRepositoryCustom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class VideoQueryService {

    private final VideoResultRepositoryCustom videoResultRepository;

    public VideoQueryService(VideoResultRepositoryCustom videoResultRepository) {
        this.videoResultRepository = videoResultRepository;
    }

    public List<VideoResult> findBySurferOrderByCreatedAtDesc(String surfer) {
        return videoResultRepository.findBySurferOrderByCreatedAtDesc(surfer);
    }

    public Optional<VideoResult> findByIdAndSurfer(Long id, String surfer) {
        return videoResultRepository.findByIdAndSurfer(id, surfer);
    }

    public List<VideoResult> findAllByOrderByCreatedAtDesc() {
        return videoResultRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<VideoResult> findTop5BySurferOrderByCreatedAtDesc(String surfer) {
        return videoResultRepository.findTop5BySurferOrderByCreatedAtDesc(surfer);
    }

    public Optional<VideoResult> findById(Long id) {
        return videoResultRepository.findVideoById(id);
    }
}
