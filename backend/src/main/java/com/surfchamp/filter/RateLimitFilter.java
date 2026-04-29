package com.surfchamp.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Filter that applies rate limiting to protected endpoints.
 * Uses Bucket4j for rate limiting with a token bucket algorithm.
 */
@Component
@Profile("local")
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String[] PROTECTED_PATHS = {"/api/videos/upload"};
    private static final String RATE_LIMIT_HEADER = "X-RateLimit-Limit";
    private static final String RATE_LIMIT_REMAINING = "X-RateLimit-Remaining";
    private static final String RATE_LIMIT_RESET = "X-RateLimit-Reset";

    private final ProxyManager<String> proxyManager;
    private final int rateLimit;
    private final int windowMinutes;
    private final Supplier<BucketConfiguration> bucketConfigurationSupplier;

    public RateLimitFilter(ProxyManager<String> proxyManager,
                         @Value("${rate.limit.video.upload:3}") int rateLimit,
                         @Value("${rate.limit.video.window.minutes:1}") int windowMinutes) {
        this.proxyManager = proxyManager;
        this.rateLimit = rateLimit;
        this.windowMinutes = windowMinutes;
        this.bucketConfigurationSupplier = createBucketConfigurationSupplier();
    }
    
    private Supplier<BucketConfiguration> createBucketConfigurationSupplier() {
        return () -> BucketConfiguration.builder()
            .addLimit(Bandwidth.simple(rateLimit, Duration.ofMinutes(windowMinutes)))
            .build();
    }
    
    private Bucket resolveBucket(String key) {
        return proxyManager.builder()
            .build(key, bucketConfigurationSupplier);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        
        try {
            // Only apply rate limiting to protected paths
            if (isProtectedPath(path)) {
                // Get client IP or session ID for rate limiting
                String clientId = getClientIp(request);
                
                try {
                    // Get or create a bucket for this client
                    Bucket bucket = resolveBucket(clientId);
                    
                    // Try to consume a token from the bucket
                    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
                    
                    if (probe.isConsumed()) {
                        // Add rate limit headers to successful responses
                        response.addHeader(RATE_LIMIT_HEADER, 
                            String.valueOf(probe.getRemainingTokens() + 1)); // +1 because we just consumed a token
                        response.addHeader(RATE_LIMIT_REMAINING, String.valueOf(probe.getRemainingTokens()));
                        response.addHeader(RATE_LIMIT_RESET, 
                            String.valueOf(TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill())));
                        
                        filterChain.doFilter(request, response);
                    } else {
                        // Rate limit exceeded - return 429 Too Many Requests
                        handleRateLimitExceeded(response, probe);
                    }
                } catch (Exception e) {
                    logger.error("Error processing rate limit for client: " + clientId, e);
                    handleRateLimitError(response, "Error processing rate limit. Please try again.");
                }
            } else {
                // Not a protected path, continue with the filter chain
                filterChain.doFilter(request, response);
            }
        } catch (Exception e) {
            logger.error("Unexpected error in RateLimitFilter", e);
            handleRateLimitError(response, "An unexpected error occurred. Please try again later.");
        }
    }
    
    /**
     * Handles the rate limit exceeded scenario
     */
    private void handleRateLimitExceeded(HttpServletResponse response, ConsumptionProbe probe) throws IOException {
        long waitTime = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
        
        response.addHeader(RATE_LIMIT_HEADER, 
            String.valueOf(probe.getRemainingTokens() + 1)); // +1 because we just tried to consume a token
        response.addHeader(RATE_LIMIT_RESET, String.valueOf(waitTime));
        response.setContentType("application/json");
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.getWriter().write(
            String.format("""
                {
                    "status": 429,
                    "error": "Too Many Requests",
                    "message": "Rate limit exceeded. Please try again in %d seconds.",
                    "retryAfterSeconds": %d
                }""", waitTime, waitTime)
        );
    }
    
    /**
     * Handles rate limiting errors
     */
    private void handleRateLimitError(HttpServletResponse response, String errorMessage) throws IOException {
        response.setContentType("application/json");
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.getWriter().write(
            String.format("""
                {
                    "status": 500,
                    "error": "Internal Server Error",
                    "message": "%s"
                }""", errorMessage)
        );
    }
    
    /**
     * Checks if the requested path is in the list of protected paths
     * @param path The request path to check
     * @return true if the path is protected, false otherwise
     */
    private boolean isProtectedPath(String path) {
        for (String protectedPath : PROTECTED_PATHS) {
            if (path.startsWith(protectedPath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets the client's IP address from the request
     * @param request The HTTP request
     * @return The client's IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
