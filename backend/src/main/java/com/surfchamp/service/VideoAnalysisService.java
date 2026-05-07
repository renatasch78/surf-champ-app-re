package com.surfchamp.service;

import com.surfchamp.model.VideoResult;
import com.surfchamp.repository.VideoResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.surfchamp.websocket.WebSocketMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class VideoAnalysisService {
    private static final Logger logger = LoggerFactory.getLogger(VideoAnalysisService.class);
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final Random random = new Random();
    
    @Autowired
    private VideoResultRepository videoResultRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // Lista de manobras comuns no surf
    private static final List<String> MANOBRAS = Arrays.asList(
        "Aéreo", "Cutback", "Floater", "Tube", "Bottom Turn",
        "Top Turn", "Snap", "Roundhouse Cutback", "360", "Air Reverse"
    );
    
    // Dicas de melhoria baseadas nas manobras
    private static final Map<String, List<String>> DICAS_MELHORIA = Map.of(
        "Aéreo", Arrays.asList("Mantenha os joelhos flexionados durante o salto", "Olhe para onde quer pousar"),
        "Cutback", Arrays.asList("Use mais o quadril para gerar potência", "Mantenha o olhar na direção da curva"),
        "Floater", Arrays.asList("Ajuste a velocidade antes da manobra", "Mantenha o equilíbrio sobre a espuma"),
        "Tube", Arrays.asList("Posicione-se mais para trás na prancha", "Mantenha o corpo baixo e estável")
    );
    
    public CompletableFuture<VideoResult> analyzeVideo(VideoResult video) {
        CompletableFuture<VideoResult> future = new CompletableFuture<>();
        
        // Simula o tempo de processamento baseado no tamanho do vídeo (10-30 segundos)
        long processingTime = 10 + random.nextInt(21);
        
        // Atualiza o status para PROCESSING
        video.setStatus("PROCESSING");
        video.setUpdatedAt(java.time.Instant.now());
        videoResultRepository.saveAndFlush(video);
        enviarAtualizacaoVideo(video);
        
        // Agenda a análise para ser executada após o tempo de processamento
        scheduler.schedule(() -> {
            try {
                // Gera as manobras detectadas (1-4 manobras por vídeo)
                List<String> manobrasDetectadas = gerarManobrasAleatorias(1 + random.nextInt(4));
                
                // Analisa cada manobra e gera pontuações
                Map<String, Double> pontuacoesManobras = new HashMap<>();
                Map<String, List<String>> dicasManobras = new HashMap<>();
                
                for (String manobra : manobrasDetectadas) {
                    double pontuacao = 3.0 + (7.0 * random.nextDouble()); // Entre 3.0 e 10.0
                    pontuacoesManobras.put(manobra, Math.round(pontuacao * 10) / 10.0);
                    
                    // Adiciona dicas de melhoria se disponíveis
                    if (DICAS_MELHORIA.containsKey(manobra)) {
                        dicasManobras.put(manobra, DICAS_MELHORIA.get(manobra));
                    }
                }
                
                // Calcula a pontuação geral (média das manobras com peso extra para as mais difíceis)
                double scoreTotal = calcularPontuacaoTotal(pontuacoesManobras);
                
                // Gera um feedback personalizado
                String feedback = gerarFeedback(manobrasDetectadas, pontuacoesManobras);
                
                // Atualiza o vídeo com os resultados
                video.setStatus("COMPLETED");
                video.setScore(scoreTotal);
                video.setManobras(String.join(", ", manobrasDetectadas));
                video.setPontuacoesManobras(mapToString(pontuacoesManobras));
                video.setDicasMelhoria(mapOfListsToString(dicasManobras));
                video.setFeedback(feedback);
                video.setUpdatedAt(java.time.Instant.now());
                
                // Salva o vídeo com os resultados
                VideoResult savedVideo = videoResultRepository.save(video);
                logger.info("Análise concluída para o vídeo {} com sucesso. Pontuação: {}", video.getFilename(), video.getScore());
                
                // Envia atualização via WebSocket
                enviarAtualizacaoVideo(savedVideo);
                
                future.complete(savedVideo);
            } catch (Exception e) {
                logger.error("Erro ao processar o vídeo", e);
                video.setStatus("ERROR");
                video.setErrorDetails(e.getMessage());
                VideoResult erroVideo = videoResultRepository.save(video);
                enviarAtualizacaoVideo(erroVideo);
                future.completeExceptionally(e);
            }
        }, processingTime, TimeUnit.SECONDS);
        
        return future;
    }
    
    private List<String> gerarManobrasAleatorias(int quantidade) {
        Collections.shuffle(MANOBRAS);
        return MANOBRAS.stream()
                     .limit(quantidade)
                     .collect(Collectors.toList());
    }
    
    private double calcularPontuacaoTotal(Map<String, Double> pontuacoesManobras) {
        if (pontuacoesManobras.isEmpty()) return 0.0;
        
        double somaPonderada = 0.0;
        double totalPesos = 0.0;
        
        // Manobras mais difíceis têm mais peso na pontuação final
        Map<String, Double> pesosManobras = Map.of(
            "Aéreo", 1.2,
            "Tube", 1.3,
            "360", 1.4,
            "Air Reverse", 1.5
        );
        
        for (Map.Entry<String, Double> entry : pontuacoesManobras.entrySet()) {
            double peso = pesosManobras.getOrDefault(entry.getKey(), 1.0);
            somaPonderada += entry.getValue() * peso;
            totalPesos += peso;
        }
        
        double mediaPonderada = somaPonderada / totalPesos;
        return Math.round(mediaPonderada * 10) / 10.0; // Arredonda para 1 casa decimal
    }
    
    private String gerarFeedback(List<String> manobras, Map<String, Double> pontuacoes) {
        if (manobras.isEmpty()) return "Nenhuma manobra detectada no vídeo.";
        
        StringBuilder feedback = new StringBuilder("Análise da sua sessão de surf:\n\n");
        
        // Adiciona análise por manobra
        for (String manobra : manobras) {
            double pontuacao = pontuacoes.get(manobra);
            feedback.append(String.format("- %s: %.1f/10.0", manobra, pontuacao));
            
            if (pontuacao >= 8.0) {
                feedback.append(" (Excelente!)\\n");
            } else if (pontuacao >= 6.0) {
                feedback.append(" (Bom, pode melhorar)\\n");
            } else {
                feedback.append(" (Precisa de prática)\\n");
            }
            
            // Adiciona dicas específicas se disponíveis
            if (DICAS_MELHORIA.containsKey(manobra) && pontuacao < 8.0) {
                feedback.append("  Dicas: ")
                       .append(String.join(", ", DICAS_MELHORIA.get(manobra)))
                       .append("\n\n");
            } else {
                feedback.append("\n");
            }
        }
        
        // Adiciona feedback geral
        double media = pontuacoes.values().stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
            
        if (media >= 8.0) {
            feedback.append("\nExcelente desempenho! Continue assim!");
        } else if (media >= 6.0) {
            feedback.append("\nBom trabalho! Com prática, você pode melhorar ainda mais!");
        } else {
            feedback.append("\nContinue praticando! Foque nas dicas para melhorar suas manobras.");
        }
        
        return feedback.toString();
    }
    
    // Métodos auxiliares para serialização
    private String mapToString(Map<String, ?> map) {
        return map.entrySet().stream()
            .map(e -> e.getKey() + "=" + e.getValue())
            .collect(Collectors.joining(";"));
    }
    
    private String mapOfListsToString(Map<String, List<String>> map) {
        return map.entrySet().stream()
            .map(e -> e.getKey() + "=" + String.join(",", e.getValue()))
            .collect(Collectors.joining(";"));
    }
    
    private void enviarAtualizacaoVideo(VideoResult video) {
        try {
            WebSocketMessage mensagem = new WebSocketMessage("VIDEO_ATUALIZADO", video);
            messagingTemplate.convertAndSend("/topic/videos", mensagem);
            logger.debug("Notificação WebSocket enviada para o vídeo ID: {}", video.getId());
        } catch (Exception e) {
            logger.error("Erro ao enviar notificação WebSocket", e);
        }
    }
}
