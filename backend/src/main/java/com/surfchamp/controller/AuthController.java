package com.surfchamp.controller;

import com.surfchamp.dto.LoginRequest;
import com.surfchamp.dto.RegisterRequest;
import com.surfchamp.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    public static final String OAUTH2_REDIRECT_SESSION_KEY = "oauth2_redirect_uri";

    private final UserService userService;
    
    @Value("${app.auth.allowed-frontend-origins:http://localhost:3000,http://localhost:3001}")
    private String[] allowedFrontendOrigins;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        userService.register(req);
        return ResponseEntity.ok().body("User registered");
    }

    @GetMapping("/google/start")
    public void startGoogleLogin(
        @RequestParam(name = "redirect_uri", required = false) String redirectUri,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws java.io.IOException {
        HttpSession session = request.getSession(true);
        String safeRedirect = resolveSafeRedirectUri(redirectUri);
        session.setAttribute(OAUTH2_REDIRECT_SESSION_KEY, safeRedirect);
        response.sendRedirect("/oauth2/authorization/google");
    }

    private String resolveSafeRedirectUri(String requestedRedirect) {
        if (requestedRedirect == null || requestedRedirect.isBlank()) {
            return null;
        }

        try {
            java.net.URI uri = java.net.URI.create(requestedRedirect);
            String origin = uri.getScheme() + "://" + uri.getAuthority();
            Set<String> allowed = java.util.Arrays.stream(allowedFrontendOrigins)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toSet());
            if (allowed.contains(origin)) {
                return requestedRedirect;
            }
        } catch (Exception ignored) {
        }

        return null;
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
