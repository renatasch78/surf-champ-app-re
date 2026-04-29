-- CORREÇÃO IMEDIATA DO SCHEMA VIDEO_RESULTS
-- Execute este script manualmente no PostgreSQL

-- 1. Remover tabela existente
DROP TABLE IF EXISTS video_results;

-- 2. Criar tabela com estrutura correta
CREATE TABLE video_results (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    surfer VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    score DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    job_id VARCHAR(255),
    s3_key VARCHAR(500),
    video_url VARCHAR(1000),
    content_type VARCHAR(255),
    file_size BIGINT,
    manobras VARCHAR(1000),
    pontuacoes_manobras VARCHAR(2000),
    dicas_melhoria VARCHAR(4000),
    feedback VARCHAR(4000),
    error_details VARCHAR(2000)
);

-- 3. Verificar estrutura
\d video_results;

-- 4. Testar inserção
INSERT INTO video_results (filename, surfer, username, status) 
VALUES ('test.mp4', 'Test Surfer', 'admin', 'UPLOADED');

-- 5. Limpar teste
DELETE FROM video_results WHERE filename = 'test.mp4';
