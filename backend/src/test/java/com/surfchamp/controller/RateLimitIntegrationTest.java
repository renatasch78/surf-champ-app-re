package com.surfchamp.controller;

import com.surfchamp.SurfChampApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = SurfChampApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class RateLimitIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl;
    private HttpHeaders headers;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port + "/api/videos/upload";
        headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    }

    @Test
    public void testRateLimiting() throws Exception {
        // Número de requisições para testar (maior que o limite configurado)
        int requestCount = 15;
        int successCount = 0;
        int tooManyRequestsCount = 0;

        // Executa várias requisições em paralelo
        for (int i = 0; i < requestCount; i++) {
            HttpEntity<MultiValueMap<String, Object>> requestEntity = createRequestEntity();
            ResponseEntity<String> response = restTemplate.exchange(
                baseUrl, 
                HttpMethod.POST, 
                requestEntity, 
                String.class
            );

            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                tooManyRequestsCount++;
                // Verifica se o header de retry-after está presente
                assertTrue(response.getHeaders().containsKey("Retry-After") || 
                          response.getHeaders().containsKey("X-RateLimit-Reset"));
            } else if (response.getStatusCode().is2xxSuccessful()) {
                successCount++;
            }
        }

        // Verifica se o rate limiting está funcionando
        assertTrue(successCount <= 10, "Número de requisições bem-sucedidas deve ser menor ou igual ao limite");
        assertTrue(tooManyRequestsCount > 0, "Deveria ter excedido o limite de requisições");
    }

    @Test
    public void testRateLimitReset() throws Exception {
        // Primeiro, esgota o limite de requisições
        for (int i = 0; i < 10; i++) {
            HttpEntity<MultiValueMap<String, Object>> requestEntity = createRequestEntity();
            restTemplate.exchange(baseUrl, HttpMethod.POST, requestEntity, String.class);
        }

        // Deve receber 429 - Too Many Requests
        HttpEntity<MultiValueMap<String, Object>> requestEntity = createRequestEntity();
        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl, 
            HttpMethod.POST, 
            requestEntity, 
            String.class
        );
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());

        // Espera o tempo de reset (1 minuto) + 1 segundo de margem
        Thread.sleep(TimeUnit.MINUTES.toMillis(1) + 1000);

        // Agora deve aceitar mais requisições
        response = restTemplate.exchange(
            baseUrl, 
            HttpMethod.POST, 
            requestEntity, 
            String.class
        );
        assertTrue(response.getStatusCode().is2xxSuccessful() || 
                  response.getStatusCode() == HttpStatus.BAD_REQUEST);
    }

    private HttpEntity<MultiValueMap<String, Object>> createRequestEntity() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        // Adiciona um arquivo de teste vazio
        body.add("file", new org.springframework.core.io.ByteArrayResource(new byte[0]) {
            @Override
            public String getFilename() {
                return "test-video.mp4";
            }
        });
        body.add("surferName", "test-user");
        
        return new HttpEntity<>(body, headers);
    }
}
