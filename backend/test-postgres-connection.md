# Teste de Conexão PostgreSQL

## Pré-requisitos
1. PostgreSQL instalado e rodando na porta 5432
2. Banco de dados `surf_champ` criado
3. Usuário `postgres` com senha `postgres` (ou ajustar configurações)

## Comandos para configurar PostgreSQL

### Criar banco de dados
```sql
CREATE DATABASE surf_champ;
```

### Criar usuário (se necessário)
```sql
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE surf_champ TO postgres;
```

## Para testar a aplicação

1. Substitua o application.properties atual pelo application-postgresql.properties
2. Execute a aplicação com Maven:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgresql
```

3. Ou copie o conteúdo de application-postgresql.properties para application.properties

## Validações
- Verifique se a aplicação inicia sem erros de conexão
- Confirme se as tabelas são criadas automaticamente
- Teste endpoints básicos da API
