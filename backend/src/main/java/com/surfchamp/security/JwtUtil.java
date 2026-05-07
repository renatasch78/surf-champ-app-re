package com.surfchamp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        try {
            // Verifica se a chave foi configurada
            if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
                throw new IllegalStateException("A chave JWT não foi configurada. Verifique o arquivo application.properties");
            }
            
            // Garante que a chave tenha pelo menos 256 bits (32 caracteres)
            if (jwtSecret.length() < 32) {
                // Se for menor que 32 caracteres, repete a chave até atingir o tamanho mínimo
                StringBuilder extendedKey = new StringBuilder(jwtSecret);
                while (extendedKey.length() < 32) {
                    extendedKey.append(jwtSecret);
                }
                jwtSecret = extendedKey.substring(0, 32);
            } else {
                // Se for maior que 32 caracteres, usa apenas os primeiros 32
                jwtSecret = jwtSecret.substring(0, 32);
            }
            
            // Log da chave que está sendo usada (não faça isso em produção)
            logger.debug("Usando chave JWT com " + (jwtSecret.length() * 8) + " bits");
            
            return Keys.hmacShaKeyFor(jwtSecret.getBytes());
        } catch (Exception e) {
            logger.error("Erro ao gerar chave JWT: " + e.getMessage(), e);
            throw new IllegalStateException("Falha ao configurar a chave JWT", e);
        }
    }

    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    public String generateToken(com.surfchamp.model.User user) {
        Map<String, Object> claims = new HashMap<>();
        if (user.getRole() != null) {
            claims.put("role", user.getRole());
        }
        return createToken(claims, user.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (SignatureException ex) {
            // Assinatura inválida
            return false;
        } catch (MalformedJwtException ex) {
            // Token JWT inválido
            return false;
        } catch (ExpiredJwtException ex) {
            // Token expirado
            return false;
        } catch (UnsupportedJwtException ex) {
            // Token não suportado
            return false;
        } catch (IllegalArgumentException ex) {
            // Token vazio ou nulo
            return false;
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public String getUsernameFromToken(String token) {
        return extractUsername(token);
    }
}
