package com.surfchamp.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

/**
 * Filtro responsável por autenticar requisições usando JWT.
 * Extrai o token do cabeçalho Authorization, valida e configura a autenticação no contexto de segurança.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        if (jwtUtil == null || userDetailsService == null) {
            throw new IllegalArgumentException("JwtUtil e UserDetailsService não podem ser nulos");
        }
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();
        logger.debug("Processando requisição {} para: {}", method, requestURI);
        
        // Log específico para upload
        if (requestURI.contains("/upload")) {
            logger.info("=== UPLOAD REQUEST DETECTED ===");
            logger.info("Method: {}, URI: {}", method, requestURI);
            logger.info("Content-Type: {}", request.getContentType());
            logger.info("Authorization header: {}", request.getHeader("Authorization") != null ? "Present" : "Missing");
            logger.info("Content-Length: {}", request.getContentLength());
        }
        
        try {
            // Se for uma rota pública, continua sem autenticação
            if (isPublicPath(requestURI)) {
                logger.debug("Rota pública detectada: {} {}", method, requestURI);
                logger.debug("Continuando a cadeia de filtros sem autenticação");
                filterChain.doFilter(request, response);
                logger.debug("Retornando após a cadeia de filtros");
                return;
            }
            
            // Extrai e valida o token
            String token = extractTokenFromRequest(request);
            if (token != null) {
                processTokenAuthentication(token, request);
            }
            
            // Continua a cadeia de filtros
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            System.err.println("ERRO NO FILTRO JWT: " + e.getMessage());
            e.printStackTrace();
            logger.error("Erro ao processar autenticação JWT: {}", e.getMessage(), e);
            handleAuthenticationError(response, e);
        } finally {
            System.out.println("=== FIM DA REQUISIÇÃO ===\n");
        }
    }
    
    /**
     * Verifica se o caminho da requisição é público e não requer autenticação.
     */
    private boolean isPublicPath(String path) {
        if (path == null) {
            logger.debug("Caminho nulo, retornando falso");
            return false;
        }
        
        logger.debug("Verificando se o caminho é público: {}", path);
        
        boolean isPublic = path.startsWith("/api/auth/") || 
               path.startsWith("/v3/api-docs") || 
               path.startsWith("/swagger-ui") ||
               path.startsWith("/swagger-ui.html") ||
               "/error".equals(path);
               
        logger.debug("O caminho {} é público? {}", path, isPublic);
        return isPublic;
    }
    
    /**
     * Extrai o token JWT do cabeçalho Authorization.
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        System.out.println("\n=== EXTRACTING TOKEN ===");
        
        // Log de todos os cabeçalhos para depuração
        System.out.println("Cabeçalhos da requisição:");
        java.util.Collections.list(request.getHeaderNames())
            .forEach(headerName -> 
                System.out.println("  " + headerName + ": " + request.getHeader(headerName))
            );
        
        String header = request.getHeader(AUTHORIZATION_HEADER);
        System.out.println("Header " + AUTHORIZATION_HEADER + ": " + header);
        
        if (!StringUtils.hasText(header)) {
            System.out.println("ERRO: Cabeçalho Authorization está vazio ou nulo");
            return null;
        }
        
        if (!header.startsWith(BEARER_PREFIX)) {
            System.out.println("ERRO: Cabeçalho Authorization não começa com 'Bearer '");
            return null;
        }
        
        String token = header.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            System.out.println("ERRO: Token JWT está vazio após remoção do prefixo 'Bearer'");
            return null;
        }
        
        System.out.println("Token JWT extraído com sucesso");
        System.out.println("Tamanho do token: " + token.length() + " caracteres");
        System.out.println("Início do token: " + token.substring(0, Math.min(20, token.length())) + "...");
        
        return token;
    }
    
    /**
     * Processa a autenticação com base no token JWT.
     */
    private void processTokenAuthentication(String token, HttpServletRequest request) {
        try {
            String username = validateAndExtractUsername(token);
            if (username == null) {
                return;
            }
            
            UserDetails userDetails = loadUserDetails(username);
            if (!jwtUtil.validateToken(token, userDetails)) {
                logger.warn("Token JWT inválido para o usuário: {}", username);
                return;
            }
            
            setSecurityContextAuthentication(userDetails, request);
            
        } catch (Exception e) {
            logger.error("Erro ao processar autenticação JWT: {}", e.getMessage());
            throw new SecurityException("Falha na autenticação JWT", e);
        }
    }
    
    /**
     * Valida o token e extrai o nome de usuário.
     */
    private String validateAndExtractUsername(String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            if (username == null) {
                logger.warn("Não foi possível extrair o nome de usuário do token");
                return null;
            }
            logger.debug("Username extraído do token: {}", username);
            return username;
            
        } catch (Exception e) {
            logger.warn("Token JWT inválido: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Carrega os detalhes do usuário a partir do banco de dados.
     */
    private UserDetails loadUserDetails(String username) {
        try {
            logger.debug("Carregando UserDetails para o usuário: {}", username);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            logger.debug("UserDetails carregado com sucesso. Funções: {}", 
                userDetails.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(", ")));
                    
            return userDetails;
            
        } catch (UsernameNotFoundException e) {
            logger.warn("Usuário não encontrado: {}", username);
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao carregar detalhes do usuário: {}", e.getMessage());
            throw new SecurityException("Falha ao carregar detalhes do usuário", e);
        }
    }
    
    /**
     * Configura a autenticação no contexto de segurança do Spring.
     */
    private void setSecurityContextAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userDetails, 
            null, 
            userDetails.getAuthorities()
        );
        
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        logger.debug("Autenticação configurada no SecurityContext para o usuário: {}", 
            userDetails.getUsername());
    }
    
    /**
     * Trata erros de autenticação, enviando a resposta HTTP apropriada.
     */
    private void handleAuthenticationError(HttpServletResponse response, Exception e) throws IOException {
        int status = HttpServletResponse.SC_UNAUTHORIZED;
        String message = "Falha na autenticação";
        
        if (e instanceof UsernameNotFoundException) {
            message = "Usuário não encontrado";
        } else if (e.getCause() != null && e.getCause() instanceof ExpiredJwtException) {
            message = "Token expirado";
            status = HttpServletResponse.SC_FORBIDDEN;
        }
        
        response.sendError(status, message);
    }
}
