package com.surfchamp.service;

import com.surfchamp.dto.SurferDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SurferService {
    List<SurferDTO> findAll();
    Page<SurferDTO> findAll(Pageable pageable);
    SurferDTO findById(Long id);
    SurferDTO create(SurferDTO surferDTO);
    SurferDTO update(Long id, SurferDTO surferDTO);
    void delete(Long id);
    
    /**
     * Search surfers by name or other searchable fields
     * @param query The search query string
     * @return List of matching surfer DTOs
     */
    List<SurferDTO> search(String query);
    
    /**
     * Find all surfers by their skill level
     * @param level The skill level to search for (e.g., "PRO", "AMATEUR")
     * @return List of surfers with the specified skill level
     */
    List<SurferDTO> findByLevel(String level);
}
