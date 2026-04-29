package com.surfchamp.repository;

import com.surfchamp.model.VideoResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
@Transactional(readOnly = true)
public class VideoResultRepositoryCustomImpl implements VideoResultRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<VideoResult> findBySurferOrderByCreatedAtDesc(String surfer) {
        return entityManager.createQuery(
                "SELECT v FROM VideoResult v WHERE v.surfer = :surfer ORDER BY v.createdAt DESC",
                VideoResult.class)
            .setParameter("surfer", surfer)
            .getResultList();
    }

    @Override
    public Optional<VideoResult> findByIdAndSurfer(Long id, String surfer) {
        List<VideoResult> results = entityManager.createQuery(
                "SELECT v FROM VideoResult v WHERE v.id = :id AND v.surfer = :surfer",
                VideoResult.class)
            .setParameter("id", id)
            .setParameter("surfer", surfer)
            .getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<VideoResult> findAllByOrderByCreatedAtDesc() {
        return entityManager.createQuery(
                "SELECT v FROM VideoResult v ORDER BY v.createdAt DESC",
                VideoResult.class)
            .getResultList();
    }

    @Override
    public List<VideoResult> findTop5BySurferOrderByCreatedAtDesc(String surfer) {
        return entityManager.createQuery(
                "SELECT v FROM VideoResult v WHERE v.surfer = :surfer ORDER BY v.createdAt DESC",
                VideoResult.class)
            .setParameter("surfer", surfer)
            .setMaxResults(5)
            .getResultList();
    }
    
    @Override
    public Optional<VideoResult> findVideoById(Long id) {
        try {
            VideoResult result = entityManager.find(VideoResult.class, id);
            return Optional.ofNullable(result);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
