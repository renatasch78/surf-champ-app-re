# Surf Champ API

API para gerenciamento de vídeos de surf e análise de ondas.

## Status dos Vídeos

Os vídeos podem ter os seguintes status:

- `UPLOADED`: O vídeo foi enviado e está aguardando análise
- `ANALYZING`: O vídeo está sendo processado
- `ANALYZED`: A análise foi concluída com sucesso
- `FAILED`: Ocorreu um erro durante a análise

## Endpoints da API

### 1. Histórico de Vídeos

**GET** `/api/videos/history?username={username}`

Retorna o histórico de vídeos de um usuário específico.

**Parâmetros de Consulta:**
- `username` (obrigatório): Nome de usuário para filtrar o histórico

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": 1,
    "filename": "onda1.mp4",
    "surfer": "usuario123",
    "status": "ANALYZED",
    "score": 8.5,
    "createdAt": "2025-09-26T11:30:00Z",
    "updatedAt": "2025-09-26T11:35:00Z"
  },
  ...
]
```

### 2. Upload e Análise de Vídeo

**POST** `/api/videos/upload`

Faz o upload de um novo vídeo para análise. A análise é realizada de forma assíncrona e pode levar alguns segundos para ser concluída.

**Corpo da Requisição (JSON):**
```json
{
  "filename": "nova_onda.mp4",
  "videoUrl": "https://exemplo.com/videos/nova_onda.mp4",
  "surferName": "usuario123"
}
```

**Resposta de Sucesso (201 Created):**
```json
{
  "id": 2,
  "filename": "nova_onda.mp4",
  "surfer": "usuario123",
  "status": "UPLOADED",
  "score": 0.0,
  "createdAt": "2025-09-26T12:00:00Z",
  "updatedAt": "2025-09-26T12:00:00Z"
}
```

**Nota:** O campo `score` será atualizado assim que a análise for concluída. Verifique o status do vídeo periodicamente até que ele mude para `ANALYZED`.

### 3. Verificar Status de Análise

**GET** `/api/videos/{videoId}`

Retorna o status atual e a pontuação de um vídeo específico.

**Parâmetros de Caminho:**
- `videoId` (obrigatório): ID do vídeo

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 2,
  "filename": "nova_onda.mp4",
  "surfer": "usuario123",
  "status": "ANALYZED",
  "score": 8.7,
  "createdAt": "2025-09-26T12:00:00Z",
  "updatedAt": "2025-09-26T12:02:30Z"
}
```

**POST** `/api/videos/upload`

Faz o upload de um novo vídeo para análise.

**Corpo da Requisição (JSON):**
```json
{
  "filename": "nova_onda.mp4",
  "videoUrl": "https://exemplo.com/videos/nova_onda.mp4",
  "surferName": "usuario123"
}
```

**Campos Obrigatórios:**
- `filename`: Nome do arquivo de vídeo
- `surferName`: Nome do surfista/dono do vídeo
- `videoUrl`: URL do vídeo (opcional, pode ser usado para vídeos hospedados externamente)

**Resposta de Sucesso (201 Created):**
```json
{
  "id": 2,
  "filename": "nova_onda.mp4",
  "surfer": "usuario123",
  "status": "UPLOADED",
  "score": 0.0,
  "createdAt": "2025-09-26T12:00:00Z",
  "updatedAt": "2025-09-26T12:00:00Z"
}
```

## Configuração

1. Certifique-se de ter o Java 21 instalado
2. Configure o banco de dados PostgreSQL em `application-local.properties`
3. Execute a aplicação usando Maven:
   ```
   ./mvnw spring-boot:run
   ```

## Variáveis de Ambiente

As seguintes propriedades podem ser configuradas no `application.properties`:

- `spring.datasource.url`: URL de conexão com o banco de dados
- `spring.datasource.username`: Nome de usuário do banco de dados
- `spring.datasource.password`: Senha do banco de dados
- `server.port`: Porta em que a aplicação irá rodar (padrão: 8080)
