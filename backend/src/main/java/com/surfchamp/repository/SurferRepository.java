package com.surfchamp.repository;

import com.surfchamp.model.Surfer;
import com.surfchamp.model.enums.SurferLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurferRepository extends JpaRepository<Surfer, Long>, JpaSpecificationExecutor<Surfer> {
    
    Optional<Surfer> findByEmail(String email);
    
    Optional<Surfer> findByCpf(String cpf);
    
    List<Surfer> findByLevel(SurferLevel level);
    
    boolean existsByEmailAndIdNot(String email, Long id);
    
    List<Surfer> findByIsActiveTrue();
    
    boolean existsByEmail(String email);
    
    boolean existsByCpf(String cpf);
    
    boolean existsByCpfAndIdNot(String cpf, Long id);
    
    List<Surfer> findByNameContainingIgnoreCase(String name);
}
