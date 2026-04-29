package com.surfchamp.config;

import com.surfchamp.model.User;
import com.surfchamp.model.VideoResult;
import com.surfchamp.model.Surfer;
import com.surfchamp.model.enums.Stance;
import com.surfchamp.model.enums.SurferLevel;
import com.surfchamp.repository.UserRepository;
import com.surfchamp.repository.VideoResultRepository;
import com.surfchamp.repository.SurferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);
    
    private final UserRepository userRepository;
    private final VideoResultRepository videoResultRepository;
    private final SurferRepository surferRepository;
    private final PasswordEncoder passwordEncoder;
    
    @PersistenceContext
    private EntityManager entityManager;

    public DatabaseInitializer(UserRepository userRepository, 
                             VideoResultRepository videoResultRepository,
                             SurferRepository surferRepository,
                             PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.videoResultRepository = videoResultRepository;
        this.surferRepository = surferRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("\n=== INICIANDO INICIALIZAÇÃO DO BANCO DE DADOS ===");
        
        try {
            // Verifica se a tabela de usuários existe
            log.info("Verificando se a tabela de usuários existe...");
            long userCount = userRepository.count();
            log.info("Número de usuários no banco: {}", userCount);
            
            // Verifica se o usuário admin já existe
            log.info("Verificando se o usuário admin existe...");
            Optional<User> adminUser = userRepository.findByUsername("admin");
            
            if (adminUser.isEmpty()) {
                log.info("Criando usuário admin...");
                
                User admin = new User();
                admin.setUsername("admin");
                
                // Codifica a senha
                String senha = "admin123";
                log.info("Senha original: {}", senha);
                String senhaCodificada = passwordEncoder.encode(senha);
                log.info("Senha codificada: {}", senhaCodificada);
                
                admin.setPassword(senhaCodificada);
                admin.setRole("ADMIN");
                
                try {
                    User savedUser = userRepository.save(admin);
                    log.info("Usuário admin criado com sucesso! ID: {}", savedUser.getId());
                } catch (Exception e) {
                    log.error("ERRO ao criar usuário admin: {}", e.getMessage(), e);
                    throw e;
                }
            } else {
                log.info("Usuário admin já existe no banco de dados");
                
                // Verifica se a senha está correta
                User admin = adminUser.get();
                boolean senhaCorreta = passwordEncoder.matches("admin123", admin.getPassword());
                log.info("Verificação de senha para admin: {}", senhaCorreta ? "CORRETA" : "INCORRETA");
                
                if (!senhaCorreta) {
                    log.info("Atualizando senha do admin...");
                    String novaSenhaCodificada = passwordEncoder.encode("admin123");
                    admin.setPassword(novaSenhaCodificada);
                    userRepository.save(admin);
                    log.info("Senha do admin atualizada com sucesso!");
                }
            }
            
            // Lista todos os usuários para depuração
            log.info("\n=== USUÁRIOS NO BANCO DE DADOS ===");
            userRepository.findAll().forEach(user -> {
                log.info("ID: {} | Usuário: {} | Role: {}", 
                        user.getId(), user.getUsername(), user.getRole());
                
                // Verifica se a senha está correta (apenas para depuração)
                if (user.getUsername().equals("admin")) {
                    boolean senhaCorreta = passwordEncoder.matches("admin123", user.getPassword());
                    log.info("Verificação de senha: {}", senhaCorreta ? "CORRETA" : "INCORRETA");
                }
            });
            log.info("=== INICIALIZAÇÃO DO BANCO DE DADOS CONCLUÍDA ===\n");
            
            // Criar vídeo de teste se não houver nenhum
            createSampleVideoIfNeeded();
            
            // Criar surfistas de teste se não houver nenhum
            createSampleSurfers();
            
        } catch (Exception e) {
            log.error("Erro durante a inicialização do banco de dados: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao inicializar o banco de dados", e);
        }
    }
    
    private void createSampleVideoIfNeeded() {
        long videoCount = videoResultRepository.count();
        if (videoCount == 0) {
            log.info("Criando vídeo de teste para o banco de dados...");

            VideoResult testVideo = new VideoResult();
            testVideo.setFilename("test_video_" + System.currentTimeMillis() + ".mp4");
            testVideo.setSurfer("test_surfer");
            testVideo.setUsername("admin");
            testVideo.setStatus("COMPLETED");
            testVideo.setScore(8.5);
            testVideo.setS3Key("videos/" + testVideo.getFilename());
            testVideo.setVideoUrl("/api/videos/stream/1");
            testVideo.setContentType("video/mp4");
            testVideo.setFileSize(10485760L);
            testVideo.setCreatedAt(Instant.now());
            testVideo.setUpdatedAt(Instant.now());

            VideoResult savedVideo = videoResultRepository.save(testVideo);
            log.info("Vídeo de teste inserido com sucesso. ID: {}", savedVideo.getId());
        } else {
            log.info("Já existem {} vídeos no banco, não será criado vídeo de teste.", videoCount);
        }
    }

    private void createSampleSurfers() {
        long surferCount = surferRepository.count();
        if (surferCount == 0) {
            log.info("Criando surfistas de teste para o banco de dados...");
            createSurferUser("joao.silva@email.com", "João Silva", "12345678901", "11987654321", SurferLevel.PROFESSIONAL, 175, 70.5, Stance.REGULAR, LocalDate.of(1995, 5, 15));
            createSurferUser("maria.santos@email.com", "Maria Santos", "12345678902", "11987654322", SurferLevel.INTERMEDIATE, 168, 62.0, Stance.GOOFY, LocalDate.of(1998, 8, 20));
            createSurferUser("pedro.oliveira@email.com", "Pedro Oliveira", "12345678903", "11987654323", SurferLevel.BEGINNER, 180, 75.0, Stance.REGULAR, LocalDate.of(2000, 3, 10));
            log.info("Surfistas de teste criados com sucesso");
        } else {
            log.info("Já existem {} surfistas no banco, não serão criados surfistas de teste.", surferCount);
        }
    }

    private void createSurferUser(String email, String name, String cpf, String phone, SurferLevel level, int height, double weight, Stance stance, LocalDate birthDate) {
        try {
            User user = new User();
            user.setUsername(email);
            user.setPassword(passwordEncoder.encode("surfer123"));
            user.setRole("SURFER");
            User savedUser = userRepository.save(user);

            Surfer surfer = new Surfer();
            surfer.setName(name);
            surfer.setEmail(email);
            surfer.setCpf(cpf);
            surfer.setPhoneNumber(phone);
            surfer.setLevel(level);
            surfer.setHeight(height);
            surfer.setWeight(weight);
            surfer.setStance(stance);
            surfer.setBirthDate(birthDate);
            surfer.setUser(savedUser);
            surferRepository.save(surfer);
            log.info("Surfista criado: {}", name);
        } catch (Exception e) {
            log.warn("Erro ao criar surfista {}: {}", name, e.getMessage());
        }
    }
}


