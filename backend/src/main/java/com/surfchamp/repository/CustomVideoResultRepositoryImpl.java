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
public abstract class CustomVideoResultRepositoryImpl implements CustomVideoResultRepository {

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

    // Implement required JpaRepository methods with default implementations
    @Override
    public List<VideoResult> findAll() {
        return entityManager.createQuery("SELECT v FROM VideoResult v", VideoResult.class).getResultList();
    }

    @Override
    public <S extends VideoResult> S save(S entity) {
        if (entity.getId() == null) {
            entityManager.persist(entity);
            return entity;
        } else {
            return entityManager.merge(entity);
        }
    }

    @Override
    public Optional<VideoResult> findById(Long id) {
        return Optional.ofNullable(entityManager.find(VideoResult.class, id));
    }

    // Other required methods with default implementations
    @Override
    public void delete(VideoResult entity) {
        entityManager.remove(entityManager.contains(entity) ? entity : entityManager.merge(entity));
    }

    @Override
    public void deleteById(Long id) {
        findById(id).ifPresent(this::delete);
    }

    @Override
    public boolean existsById(Long id) {
        return findById(id).isPresent();
    }

    // Add other required methods with appropriate implementations
    @Override
    public long count() {
        return entityManager.createQuery("SELECT COUNT(v) FROM VideoResult v", Long.class).getSingleResult();
    }
}
