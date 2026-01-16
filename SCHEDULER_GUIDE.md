# ⏰ Sistema de Agendamento Automático de Métricas

## 📋 Visão Geral

O sistema de agendamento permite que métricas sejam buscadas automaticamente em intervalos regulares e publicadas no MQTT, ideal para dispositivos IoT que precisam receber atualizações constantes sem fazer requisições HTTP.

## 🎯 Características

- ✅ Agendamento com validade (máximo 30 dias)
- ✅ Intervalo personalizável (mínimo 1 minuto, máximo 24 horas)
- ✅ Limpeza automática de agendamentos expirados
- ✅ Publicação automática no MQTT
- ✅ Suporte para Instagram e YouTube
- ✅ Extração automática de IDs de URLs

## 📡 Como Funciona

1. **Usuário adiciona métrica** via HTTP POST
2. **Sistema valida e limpa** o resource_id (remove URLs, @, etc)
3. **Agendador busca periodicamente** a métrica no intervalo configurado
4. **Dados são publicados automaticamente** no MQTT
5. **Agendamento expira** após o período definido

## 🔧 API Endpoints

### Adicionar Agendamento

```http
POST /api/v1/scheduler
Authorization: X-API-Key: your_api_key
Content-Type: application/json

{
  "platform": "youtube",
  "resource": "video",
  "resourceId": "h_z35D5D5KU",
  "metric": "views",
  "intervalMinutes": 5,
  "expiresInDays": 7
}
```

**Parâmetros:**
- `platform` (required): `instagram` ou `youtube`
- `resource` (required): `profile`, `post`, `channel`, ou `video`
- `resourceId` (required): ID do recurso (pode ser URL)
- `metric` (required): Nome da métrica (`followers`, `views`, `likes`, etc)
- `intervalMinutes` (optional): Intervalo de busca (padrão: 5, min: 1, max: 1440)
- `expiresInDays` (optional): Validade em dias (padrão: 7, min: 1, max: 30)
- `notifyOnlyChanged` (optional): Se `true`, só publica no MQTT quando o valor mudar (padrão: false)

**Resposta (201):**
```json
{
  "message": "Scheduled metric created",
  "data": {
    "id": "clx...",
    "platform": "youtube",
    "resource": "video",
    "resourceId": "h_z35D5D5KU",
    "metric": "views",
    "intervalMinutes": 5,
    "expiresAt": "2026-01-23T10:30:00.000Z",
    "isActive": true,
    "createdAt": "2026-01-16T10:30:00.000Z"
  }
}
```

### Listar Agendamentos

```http
GET /api/v1/scheduler
Authorization: X-API-Key: your_api_key
```

**Resposta (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "platform": "youtube",
      "resource": "video",
      "resourceId": "h_z35D5D5KU",
      "metric": "views",
      "intervalMinutes": 5,
      "expiresAt": "2026-01-23T10:30:00.000Z",
      "lastFetchedAt": "2026-01-16T10:35:00.000Z",
      "isActive": true
    }
  ],
  "count": 1
}
```

### Estatísticas do Agendador

```http
GET /api/v1/scheduler/stats
Authorization: X-API-Key: your_api_key
```

**Resposta (200):**
```json
{
  "data": {
    "total": 10,
    "active": 8,
    "expired": 2,
    "dueNow": 3,
    "isRunning": true
  }
}
```

### Remover Agendamento

```http
DELETE /api/v1/scheduler/{id}
Authorization: X-API-Key: your_api_key
```

**Resposta (200):**
```json
{
  "message": "Scheduled metric deactivated"
}
```

## 💡 Exemplos de Uso

### Exemplo 1: Monitorar Views de Vídeo

```bash
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "resource": "video",
    "resourceId": "https://www.youtube.com/watch?v=h_z35D5D5KU",
    "metric": "views",
    "intervalMinutes": 5,
    "expiresInDays": 7
  }'
```

**Resultado:**
- A cada 5 minutos, o sistema busca os views do vídeo
- Publica no MQTT toda vez que busca

### Exemplo 2: Monitorar Seguidores (Só Notificar se Mudar)

```bash
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "resource": "profile",
    "resourceId": "@username",
    "metric": "followers",
    "intervalMinutes": 10,
    "expiresInDays": 30,
    "notifyOnlyChanged": true
  }'
```

**Resultado:**
- A cada 10 minutos, o sistema busca os seguidores
- **Só publica no MQTT se o valor mudar** (economiza largura de banda)
- Ideal para métricas que mudam pouco
- Publica automaticamente em: `social-counter/youtube/video/h_z35D5D5KU/views`
- Agendamento válido por 7 dias

### Exemplo 2: Monitorar Seguidores do Instagram

```bash
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "resource": "profile",
    "resourceId": "@belave.clinica",
    "metric": "followers",
    "intervalMinutes": 10,
    "expiresInDays": 30
  }'
```

**Resultado:**
- A cada 10 minutos, busca os seguidores
- Publica em: `social-counter/instagram/profile/belave.clinica/followers`
- Válido por 30 dias (máximo permitido)

### Exemplo 3: Múltiplas Métricas

```bash
# Views
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","resource":"video","resourceId":"h_z35D5D5KU","metric":"views","intervalMinutes":5,"expiresInDays":7}'

# Likes
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","resource":"video","resourceId":"h_z35D5D5KU","metric":"likes","intervalMinutes":5,"expiresInDays":7}'

# Comments
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","resource":"video","resourceId":"h_z35D5D5KU","metric":"comments","intervalMinutes":5,"expiresInDays":7}'
```

## 🔌 Integração com IoT

### Dispositivo IoT com Agendamento

```cpp
// ESP32 - Recebe atualizações automáticas
#include <WiFi.h>
#include <PubSubClient.h>

const char* topic = "social-counter/youtube/video/h_z35D5D5KU/views";

void setup() {
  // Conectar WiFi e MQTT
  // ...
  
  // Apenas inscrever no tópico
  client.subscribe(topic);
  
  // O ESP32 receberá atualizações automaticamente a cada 5 minutos
  // Sem necessidade de fazer requisições HTTP!
}
```

### Renovar Agendamento

```bash
# Antes de expirar, renove o agendamento
curl -X POST http://localhost:3000/api/v1/scheduler \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "resource": "video",
    "resourceId": "h_z35D5D5KU",
    "metric": "views",
    "intervalMinutes": 5,
    "expiresInDays": 7
  }'
```

Se o agendamento já existir, ele será atualizado (expiration renovado).

## ⚙️ Configuração

### Intervalo de Verificação

O agendador verifica métricas pendentes a cada 1 minuto (configurável em `metric-scheduler.service.ts`):

```typescript
private checkIntervalMs = 60000; // 60 segundos
```

### Limites

- **Intervalo mínimo**: 1 minuto
- **Intervalo máximo**: 1440 minutos (24 horas)
- **Validade mínima**: 1 dia
- **Validade máxima**: 30 dias

## 📊 Banco de Dados

### Tabela: scheduled_metrics

```sql
CREATE TABLE scheduled_metrics (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  resource TEXT NOT NULL,
  resourceId TEXT NOT NULL,
  metric TEXT NOT NULL,
  intervalMinutes INTEGER DEFAULT 5,
  expiresAt TIMESTAMP NOT NULL,
  lastFetchedAt TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  createdBy TEXT,
  UNIQUE(platform, resource, resourceId, metric)
);
```

## 🎯 Casos de Uso

### 1. Display LCD de Views em Tempo Real
- Agendamento a cada 1 minuto
- ESP32 recebe atualizações via MQTT
- Display mostra número de views

### 2. Painel de Seguidores
- Agendamento a cada 5 minutos
- Múltiplas contas monitoradas
- Dashboard atualizado automaticamente

### 3. Alertas de Métricas
- Agendamento a cada 10 minutos
- Sistema verifica crescimento
- Dispara alertas quando atingir metas

## 📝 Notas Importantes

- ✅ Agendamentos expirados são ignorados automaticamente
- ✅ Sistema extrai IDs de URLs automaticamente
- ✅ Métricas em cache são reaproveitadas quando possível
- ✅ Publicações MQTT são automáticas
- ⚠️ Não abuse de intervalos muito curtos (mínimo recomendado: 5 minutos)
- ⚠️ Renove agendamentos antes de expirarem para manter continuidade

## 🔍 Monitoramento

Verifique logs para acompanhar o agendador:

```
[Scheduler] Starting metric scheduler...
[Scheduler] Processing 3 scheduled metrics
[Scheduler] Fetching youtube/video/h_z35D5D5KU/views
[Scheduler] Successfully fetched youtube/video/h_z35D5D5KU/views
```

Verifique estatísticas via API:

```bash
curl http://localhost:3000/api/v1/scheduler/stats \
  -H "X-API-Key: your_api_key"
```
