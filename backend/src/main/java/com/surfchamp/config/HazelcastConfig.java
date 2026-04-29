package com.surfchamp.config;

import com.hazelcast.config.Config;
import com.hazelcast.config.MapConfig;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

@Configuration
@EnableConfigurationProperties(HazelcastProperties.class)
public class HazelcastConfig {

    private final HazelcastProperties hazelcastProperties;

    public HazelcastConfig(HazelcastProperties hazelcastProperties) {
        this.hazelcastProperties = hazelcastProperties;
    }

    @Bean
    @ConditionalOnMissingBean
    public Config hazelcastConfiguration() {
        Config config = new Config();
        config.setInstanceName(hazelcastProperties.getInstanceName());
        
        // Configure the map for rate limiting
        MapConfig mapConfig = new MapConfig()
            .setName(hazelcastProperties.getMapName())
            .setTimeToLiveSeconds(hazelcastProperties.getTimeToLiveSeconds());
        
        config.addMapConfig(mapConfig);
        return config;
    }

    @Bean(destroyMethod = "shutdown")
    @Lazy
    public HazelcastInstance hazelcastInstance(Config config) {
        return Hazelcast.newHazelcastInstance(config);
    }
}
