-- Corrigir schema da tabela video_results
-- Renomear coluna "user" para "username

-- Renomear coluna existente
ALTER TABLE video_results RENAME COLUMN "user" TO username;

-- Verificar estrutura atual
\d video_results;
