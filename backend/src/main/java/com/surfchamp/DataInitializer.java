package com.surfchamp;

import com.surfchamp.model.User;
import com.surfchamp.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                User u = new User();
                u.setUsername("admin");
                u.setPassword(passwordEncoder.encode("admin123"));
                u.setRole("ROLE_ADMIN");
                userRepository.save(u);
            }
            if (!userRepository.existsByUsername("test")) {
                User u = new User();
                u.setUsername("test");
                u.setPassword(passwordEncoder.encode("test123"));
                u.setRole("ROLE_USER");
                userRepository.save(u);
            }
        };
    }
}
