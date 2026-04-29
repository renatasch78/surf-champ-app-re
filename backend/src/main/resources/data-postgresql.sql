-- Inserir um usuário administrador padrão se não existir (PostgreSQL)
-- A senha é 'admin123' codificada com BCrypt
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$Ot/SXpq/k2SH4XoPRptBkukTkf0ouQtdnRB887.g8sy3jTLrjhgXK', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
