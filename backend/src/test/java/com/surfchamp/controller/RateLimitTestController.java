package com.surfchamp.controller;

import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class RateLimitTestController {

    private final Bucket bucket;

    public RateLimitTestController(@Qualifier("distributedBucket") Bucket bucket) {
        this.bucket = bucket;
    }

    @GetMapping("/rate-limit")
    public ResponseEntity<Map<String, Object>> testRateLimit() {
        // Tenta consumir um token do bucket
        boolean consumed = bucket.tryConsume(1);
        
        Map<String, Object> response = new HashMap<>();
        
        if (consumed) {
            response.put("status", "success");
            response.put("message", "Request allowed");
            response.put("remainingTokens", bucket.getAvailableTokens());
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Too many requests");
            long retryAfterNanos = bucket.estimateAbilityToConsume(1).getNanosToWaitForRefill();
            long retryAfterSeconds = (long) Math.ceil(retryAfterNanos / 1_000_000_000.0);
            response.put("retryAfterSeconds", retryAfterSeconds);
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(retryAfterSeconds))
                    .body(response);
        }
    }
}
