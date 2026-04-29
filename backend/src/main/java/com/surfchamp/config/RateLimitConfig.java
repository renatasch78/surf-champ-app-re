package com.surfchamp.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.CommandType;
import java.util.concurrent.TimeUnit;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.function.Function;
import java.util.function.Supplier;

@Configuration
@Profile("local")
public class RateLimitConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitConfig.class);

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${rate.limit.video.upload:3}")
    private int videoUploadLimit;

    @Value("${rate.limit.video.window.minutes:1}")
    private int videoUploadWindowMinutes;

    @Bean(destroyMethod = "shutdown")
    public RedisClient redisClient() {
        try {
            logger.info("Creating Redis client for host: {} and port: {}", redisHost, redisPort);
            RedisURI redisURI = RedisURI.builder()
                    .withHost(redisHost)
                    .withPort(redisPort)
                    .withTimeout(Duration.ofSeconds(10))
                    .build();
            return RedisClient.create(redisURI);
        } catch (Exception e) {
            logger.error("Failed to create Redis client", e);
            throw new IllegalStateException("Failed to create Redis client", e);
        }
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
