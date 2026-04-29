package com.surfchamp.controller;

import com.surfchamp.dto.SurferDTO;
import com.surfchamp.service.SurferService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/surfers")
public class SurferController {

    private final SurferService surferService;

    @Autowired
    public SurferController(SurferService surferService) {
        this.surferService = surferService;
    }

    @GetMapping
    public ResponseEntity<List<SurferDTO>> getAllSurfers() {
        return ResponseEntity.ok(surferService.findAll());
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<SurferDTO>> getAllSurfers(Pageable pageable) {
        return ResponseEntity.ok(surferService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurferDTO> getSurferById(@PathVariable Long id) {
        return ResponseEntity.ok(surferService.findById(id));
    }

    @PostMapping
    public ResponseEntity<SurferDTO> createSurfer(@Valid @RequestBody SurferDTO surferDTO) {
        System.out.println("=== INÍCIO DA REQUISIÇÃO CREATE SURFER ===");
        System.out.println("Dados recebidos: " + surferDTO);
        
        try {
            SurferDTO createdSurfer = surferService.create(surferDTO);
            System.out.println("Surfista criado com sucesso: " + createdSurfer);
            return ResponseEntity.ok(createdSurfer);
        } catch (Exception e) {
            System.err.println("Erro ao criar surfista: " + e.getMessage());
            e.printStackTrace();
            throw e;
        } finally {
            System.out.println("=== FIM DA REQUISIÇÃO CREATE SURFER ===\n");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SurferDTO> updateSurfer(
            @PathVariable Long id,
            @Valid @RequestBody SurferDTO surferDTO) {
        return ResponseEntity.ok(surferService.update(id, surferDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurfer(@PathVariable Long id) {
        surferService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<SurferDTO>> searchSurfers(@RequestParam String query) {
        return ResponseEntity.ok(surferService.search(query));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<SurferDTO>> getSurfersByLevel(@PathVariable String level) {
        return ResponseEntity.ok(surferService.findByLevel(level));
    }
}
