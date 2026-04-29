package com.surfchamp.service;

import com.surfchamp.dto.LoginRequest;
import com.surfchamp.dto.RegisterRequest;
import com.surfchamp.model.User;
import com.surfchamp.repository.UserRepository;
import com.surfchamp.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public void register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        String role = "SURFER";
        if (req.getRole() != null && req.getRole().equalsIgnoreCase("TRAINER")) {
            role = "TRAINER";
        }
        u.setRole(role);
        userRepository.save(u);
    }

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    public String login(LoginRequest req) {
        log.info("Attempting login for user: {}", req.getUsername());
        
        try {
            User u = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> {
                    log.warn("User not found: {}", req.getUsername());
                    return new RuntimeException("Invalid credentials");
                });
            
            log.debug("User found in database - ID: {}, Username: {}, Role: {}", 
                u.getId(), u.getUsername(), u.getRole());
                
            boolean passwordMatches = passwordEncoder.matches(req.getPassword(), u.getPassword());
            log.debug("Password matches: {}", passwordMatches);
            
            if (!passwordMatches) {
                log.warn("Invalid password for user: {}", req.getUsername());
                throw new RuntimeException("Invalid credentials");
            }
            
            String token = jwtUtil.generateToken(u);
            log.info("Login successful for user: {}", req.getUsername());
            return token;
            
        } catch (Exception e) {
            log.error("Error during login for user {}: {}", req.getUsername(), e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Updates an existing user in the database
     * @param user The user with updated information
     * @return The updated user
     * @throws RuntimeException if the user is not found
     */
    public User updateUser(User user) {
        log.info("Updating user with ID: {}", user.getId());
        if (user.getId() == null || !userRepository.existsById(user.getId())) {
            log.warn("User not found with ID: {}", user.getId());
            throw new RuntimeException("User not found");
        }
        return userRepository.save(user);
    }
}
