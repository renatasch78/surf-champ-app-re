package com.surfchamp.controller;

import com.surfchamp.dto.LoginRequest;
import com.surfchamp.dto.RegisterRequest;
import com.surfchamp.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        userService.register(req);
        return ResponseEntity.ok().body("User registered");
    }

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        log.info("Tentativa de login para o usuário: {}", req.getUsername());
        try {
            if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
                log.warn("Nome de usuário não fornecido");
                return ResponseEntity.badRequest().body("Nome de usuário é obrigatório");
            }
            
            if (req.getPassword() == null || req.getPassword().trim().isEmpty()) {
                log.warn("Senha não fornecida para o usuário: {}", req.getUsername());
                return ResponseEntity.badRequest().body("Senha é obrigatória");
            }
            
            log.debug("Validando credenciais para o usuário: {}", req.getUsername());
            String token = userService.login(req);
            
            if (token == null || token.trim().isEmpty()) {
                log.error("Token vazio retornado para o usuário: {}", req.getUsername());
                return ResponseEntity.status(500).body("Erro ao gerar token de autenticação");
            }
            
            log.info("Login bem-sucedido para o usuário: {}", req.getUsername());
            
            // Criar objeto de resposta
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("username", req.getUsername());
            response.put("message", "Login realizado com sucesso");
            
            return ResponseEntity.ok()
                .header("Authorization", "Bearer " + token)
                .body(response);
                
        } catch (Exception e) {
            log.error("Falha no login para o usuário {}: {}", req.getUsername(), e.getMessage());
            return ResponseEntity.status(401)
                .header("Content-Type", "application/json")
                .body("{\"message\": \"Usuário ou senha inválidos\"}");
        }
    }
}
