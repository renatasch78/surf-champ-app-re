-- Tabela de surfistas
CREATE TABLE surfers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    birth_date DATE,
    stance VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    weight DOUBLE,
    height INT,
    level VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    phone_number VARCHAR(20),
    cpf VARCHAR(11) UNIQUE,
    
    -- Endereço
    street VARCHAR(100),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(9),
    
    -- Contato de emergência
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id BIGINT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela para os patrocinadores (relacionamento muitos-para-muitos)
CREATE TABLE surfer_sponsors (
    surfer_id BIGINT NOT NULL,
    sponsor VARCHAR(100) NOT NULL,
    PRIMARY KEY (surfer_id, sponsor),
    FOREIGN KEY (surfer_id) REFERENCES surfers(id) ON DELETE CASCADE
);

-- Índices para melhorar consultas comuns
CREATE INDEX idx_surfer_email ON surfers(email);
CREATE INDEX idx_surfer_cpf ON surfers(cpf);
CREATE INDEX idx_surfer_level ON surfers(level);
CREATE INDEX idx_surfer_active ON surfers(is_active);
