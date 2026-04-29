package com.surfchamp.controller;

import com.surfchamp.model.VideoResult;
import com.surfchamp.repository.VideoResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/process")
public class ProcessController {

    private final VideoResultRepository videoResultRepository;

    public ProcessController(VideoResultRepository videoResultRepository) {
        this.videoResultRepository = videoResultRepository;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startProcessing(@RequestBody Map<String, String> payload) {
        if (!payload.containsKey("filename") || !payload.containsKey("surfer")) {
            return ResponseEntity.badRequest().body(Map.of("error", "filename and surfer required"));
        }
        String filename = payload.get("filename");
        String surfer = payload.get("surfer");
        String jobId = "job-" + System.currentTimeMillis();

        VideoResult vr = new VideoResult();
        vr.setFilename(filename);
        vr.setSurfer(surfer);
        vr.setStatus("queued");
        vr.setScore(0.0);
        vr.setCreatedAt(Instant.now());
        vr.setUpdatedAt(Instant.now());
        vr.setJobId(jobId);

        VideoResult saved = videoResultRepository.save(vr);
        return ResponseEntity.accepted().body(Map.of("jobId", jobId, "status", "queued", "resultId", saved.getId()));
    }

    @GetMapping("/results/{surfer}")
    public ResponseEntity<List<VideoResult>> getResultsForSurfer(@PathVariable("surfer") String surfer) {
        List<VideoResult> list = videoResultRepository.findBySurferOrderByCreatedAtDesc(surfer);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<?> getResult(@PathVariable("id") Long id) {
        return videoResultRepository.findById(id)
                .map(r -> ResponseEntity.ok(r))
                .orElse(ResponseEntity.notFound().build());
    }
}
