package com.surfchamp.controller;

import com.surfchamp.dto.UserProfileDTO;
import com.surfchamp.model.User;
import com.surfchamp.repository.UserRepository;
import com.surfchamp.security.JwtUtil;
import com.surfchamp.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public UserController(UserService userService, UserRepository userRepository, JwtUtil jwtUtil) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não autenticado");
        }

        String username = authentication.getName();
        var userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado");
        }
        return ResponseEntity.ok(toDto(userOptional.get()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(Authentication authentication, @RequestBody UserProfileDTO request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não autenticado");
        }

        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.getRole() != null && !request.getRole().equalsIgnoreCase(currentUser.getRole())) {
            if (!"ADMIN".equalsIgnoreCase(currentUser.getRole()) && "ADMIN".equalsIgnoreCase(request.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Apenas administradores podem atribuir o perfil Administrador");
            }
            currentUser.setRole(request.getRole());
        }

        User updatedUser = userService.updateUser(currentUser);
        String token = jwtUtil.generateToken(updatedUser);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", toDto(updatedUser));
        return ResponseEntity.ok(response);
    }

    private UserProfileDTO toDto(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());
        return dto;
    }
}
