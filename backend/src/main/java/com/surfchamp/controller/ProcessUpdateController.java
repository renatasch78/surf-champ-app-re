package com.surfchamp.controller;

import com.surfchamp.repository.VideoResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/process")
public class ProcessUpdateController {
    private final VideoResultRepository videoResultRepository;
    public ProcessUpdateController(VideoResultRepository videoResultRepository) {
        this.videoResultRepository = videoResultRepository;
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateResult(@RequestBody Map<String, String> payload) {
        if (!payload.containsKey("resultId")) {
            return ResponseEntity.badRequest().body(Map.of("error", "resultId required"));
        }
        Long id = Long.valueOf(payload.get("resultId"));
        return videoResultRepository.findById(id).map(vr -> {
            if (payload.containsKey("status")) vr.setStatus(payload.get("status"));
            if (payload.containsKey("score")) {
                try { vr.setScore(Double.parseDouble(payload.get("score"))); } catch(Exception e){}
            }
            vr.setUpdatedAt(Instant.now());
            videoResultRepository.save(vr);
            return ResponseEntity.ok(Map.of("resultId", vr.getId(), "status", vr.getStatus(), "score", vr.getScore()));
        }).orElse(ResponseEntity.notFound().build());
    }
}
