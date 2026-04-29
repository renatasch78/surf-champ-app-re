package com.surfchamp.controller;

import com.surfchamp.model.VideoResult;
import com.surfchamp.repository.VideoResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dev")
public class DevToolsController {

    @Autowired
    private VideoResultRepository videoResultRepository;

    @GetMapping("/videos")
    public ResponseEntity<List<VideoResult>> listAllVideos() {
        List<VideoResult> videos = videoResultRepository.findAll();
        return ResponseEntity.ok(videos);
    }
}
