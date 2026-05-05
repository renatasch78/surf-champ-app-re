package com.surfchamp.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.function.Supplier;

@Configuration
public class RateLimitConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitConfig.class);

    @Value("${spring.data.redis.url}")
    private String redisUrl;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate.limit.video.upload:3}")
    private int videoUploadLimit;

    @Value("${rate.limit.video.window.minutes:1}")
    private int videoUploadWindowMinutes;

    @Bean(destroyMethod = "shutdown")
    public RedisClient redisClient() {
        logger.info("Connecting to Redis using URL: {}", redisUrl);
        return RedisClient.create(redisUrl);
    }

    @Bean(destroyMethod = "close")
    public StatefulRedisConnection<String, byte[]> redisConnection(RedisClient redisClient) {
        return redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
    }

    @Bean
    public ProxyManager<String> proxyManager(StatefulRedisConnection<String, byte[]> connection) {
        try {
            logger.info("Initializing Redis-based ProxyManager for rate limiting...");
            
            // Create and return the ProxyManager
            return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofSeconds(10)))
                .build();
        } catch (Exception e) {
            String errorMsg = "Failed to initialize Redis-based ProxyManager for rate limiting";
            logger.error(errorMsg, e);
            throw new IllegalStateException(errorMsg + ". Please check Redis connection.", e);
        }
    }

    @Bean
    public Supplier<BucketConfiguration> bucketConfigurationSupplier() {
        Bandwidth limit = Bandwidth.simple(
            videoUploadLimit,
            Duration.ofMinutes(videoUploadWindowMinutes)
        );
        return () -> BucketConfiguration.builder()
            .addLimit(limit)
            .build();
    }
}
