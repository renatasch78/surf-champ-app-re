@echo off
echo Verificando a conexão com o banco de dados MySQL...
mysql -u root -pcma123 -e "SHOW DATABASES;"

echo.
echo Verificando se o banco de dados 'surf_champ' existe...
mysql -u root -pcma123 -e "SHOW DATABASES LIKE 'surf_champ';"

mysql -u root -pcma123 -e "
-- Verifica se o banco de dados existe, se não existir, cria
CREATE DATABASE IF NOT EXISTS surf_champ;

-- Usa o banco de dados
USE surf_champ;

-- Verifica se a tabela de usuários existe
SHOW TABLES LIKE 'users';

-- Cria a tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);

-- Insere o usuário admin se não existir
INSERT IGNORE INTO users (username, password, role) 
VALUES ('admin', '$2a$10$Ot/SXpq/k2SH4XoPRptBkukTkf0ouQtdnRB887.g8sy3jTLrjhgXK', 'ADMIN');

-- Mostra os usuários existentes
SELECT * FROM users;
" surf_champ

echo.
echo Processo concluído. Pressione qualquer tecla para sair...
pause > nul
