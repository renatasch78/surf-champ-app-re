package com.surfchamp.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

@Component
@Order(1)
public class RequestResponseLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestResponseLoggingFilter.class);

    /**
     * Verifica se uma string contÃ©m apenas caracteres de texto legÃ­veis.
     * @param str String a ser verificada
     * @return true se a string contiver apenas texto legÃ­vel, false caso contrÃ¡rio
     */
    private boolean isPlainText(String str) {
        if (str == null || str.isEmpty()) {
            return true;
        }
        
        // Verifica se a string contÃ©m caracteres nÃ£o imprimÃ­veis
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            // Verifica por caracteres de controle nÃ£o imprimÃ­veis (exceto quebras de linha e tabs)
            if (c < 32 && c != '\n' && c != '\r' && c != '\t') {
                return false;
            }
            // Verifica por caracteres de substituiÃ§Ã£o ou invÃ¡lidos
            if (c == '\u0000') {  // Check for null character
                return false;
            }
        }
        
        // Verifica se a string contÃ©m sequÃªncias binÃ¡rias comuns
        String lowerStr = str.toLowerCase();
        if (lowerStr.contains("") || 
            lowerStr.contains("\ufffd") || 
            lowerStr.contains("\u0000") ||
            lowerStr.contains("\u0001") ||
            lowerStr.contains("\u0002") ||
            lowerStr.contains("\u0003") ||
            lowerStr.contains("\u0004") ||
            lowerStr.contains("\u0005") ||
            lowerStr.contains("\u0006") ||
            lowerStr.contains("\u0007") ||
            lowerStr.contains("\u0008") ||
            lowerStr.contains("\u000b") ||
            lowerStr.contains("\u000c") ||
            lowerStr.contains("\u000e") ||
            lowerStr.contains("\u000f") ||
            lowerStr.contains("\u0010") ||
            lowerStr.contains("\u0011") ||
            lowerStr.contains("\u0012") ||
            lowerStr.contains("\u0013") ||
            lowerStr.contains("\u0014") ||
            lowerStr.contains("\u0015") ||
            lowerStr.contains("\u0016") ||
            lowerStr.contains("\u0017") ||
            lowerStr.contains("\u0018") ||
            lowerStr.contains("\u0019") ||
            lowerStr.contains("\u001a") ||
            lowerStr.contains("\u001b") ||
            lowerStr.contains("\u001c") ||
            lowerStr.contains("\u001d") ||
            lowerStr.contains("\u001e") ||
            lowerStr.contains("\u001f")) {
            return false;
        }
        
        return true;
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String requestContentType = httpRequest.getContentType();
        boolean isMultipartRequest = requestContentType != null
                && requestContentType.toLowerCase().startsWith("multipart/");
        boolean isUploadEndpoint = httpRequest.getRequestURI() != null
                && httpRequest.getRequestURI().contains("/api/videos/upload");

        // Avoid wrapping multipart upload requests, which can interfere with large request streams.
        if (isMultipartRequest || isUploadEndpoint) {
            logger.info("=== INICIO DA REQUISICAO (UPLOAD/MULTIPART) ===");
            logger.info("Metodo: {}", httpRequest.getMethod());
            logger.info("URI: {}", httpRequest.getRequestURI());
            logger.info("Content-Type: {}", requestContentType);
            logger.info("Content-Length: {}", httpRequest.getContentLengthLong());
            chain.doFilter(request, response);
            logger.info("=== RESPOSTA (UPLOAD/MULTIPART) ===");
            logger.info("Status: {}", httpResponse.getStatus());
            logger.info("=== FIM DA REQUISICAO (UPLOAD/MULTIPART) ===\\n");
            return;
        }


        // Log da requisiÃ§Ã£o
        logger.info("=== INÃCIO DA REQUISIÃ‡ÃƒO ===");
        logger.info("MÃ©todo: {}", httpRequest.getMethod());
        logger.info("URI: {}", httpRequest.getRequestURI());
        logger.info("Query String: {}", httpRequest.getQueryString());
        logger.info("CabeÃ§alhos:");
        httpRequest.getHeaderNames().asIterator()
                .forEachRemaining(headerName -> 
                    logger.info("  {}: {}", headerName, httpRequest.getHeader(headerName))
                );

        // Envolve a requisiÃ§Ã£o e resposta para permitir leitura mÃºltipla do corpo
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(httpRequest);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(httpResponse);

        try {
            // Continua a cadeia de filtros
            chain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            // Log da resposta
            logger.info("=== RESPOSTA ===");
            logger.info("Status: {}", wrappedResponse.getStatus());
            logger.info("CabeÃ§alhos da resposta:");
            wrappedResponse.getHeaderNames().forEach(headerName ->
                wrappedResponse.getHeaders(headerName).forEach(headerValue ->
                    logger.info("  {}: {}", headerName, headerValue)
                )
            );

            // Log do corpo da resposta (apenas se for texto)
            byte[] responseBody = wrappedResponse.getContentAsByteArray();
            if (responseBody.length > 0) {
                String contentType = response.getContentType();
                // Verifica se o conteÃºdo Ã© texto baseado no Content-Type
                if (contentType != null && (contentType.startsWith("text/") || 
                                       contentType.contains("json") || 
                                       contentType.contains("xml") || 
                                       contentType.contains("form") ||
                                       contentType.contains("javascript"))) {
                    try {
                        String responseBodyString = new String(responseBody, wrappedResponse.getCharacterEncoding());
                        // Verifica se o conteÃºdo parece ser texto imprimÃ­vel
                        if (isPlainText(responseBodyString)) {
                            logger.info("Corpo da resposta ({}): {}", contentType, responseBodyString);
                        } else {
                            logger.info("Corpo da resposta ({}): [conteÃºdo binÃ¡rio ou nÃ£o-texto suprimido]", contentType);
                        }
                    } catch (Exception e) {
                        logger.debug("Erro ao ler corpo da resposta: {}", e.getMessage());
                    }
                } else {
                    logger.debug("Resposta com conteÃºdo binÃ¡rio ({}): [conteÃºdo suprimido] - Tamanho: {} bytes", 
                               contentType, responseBody.length);
                }
            }

            logger.info("=== FIM DA REQUISIÃ‡ÃƒO ===\n");

            // Importante: copiar o corpo da resposta para o fluxo de saÃ­da original
            wrappedResponse.copyBodyToResponse();
        }
    }
}
