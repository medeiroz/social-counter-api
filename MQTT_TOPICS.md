# 📡 Referência Rápida - Tópicos MQTT

## Estrutura Geral
```
social-counter/{platform}/{resource}/{resource_id}/{metric}
```

### Componentes:
- **platform**: Plataforma da rede social (`instagram`, `youtube`, etc.)
- **resource**: Tipo de recurso (`profile`, `post`, `channel`, `video`, etc.)
- **resource_id**: Identificador único do recurso (username, post_id, channel_id, video_id)
- **metric**: Métrica específica (`followers`, `likes`, `views`, etc.)

## 📱 Instagram

### Perfil (`profile`)
```
social-counter/instagram/profile/{username}/followers       # Seguidores
social-counter/instagram/profile/{username}/following       # Seguindo
social-counter/instagram/profile/{username}/posts_count     # Total de posts
```

**Exemplo:**
```
social-counter/instagram/profile/belave.clinica/followers
```

### Post (`post`)
```
social-counter/instagram/post/{post_id}/likes              # Curtidas
social-counter/instagram/post/{post_id}/comments           # Comentários
social-counter/instagram/post/{post_id}/views              # Visualizações
```

**Exemplo:**
```
social-counter/instagram/post/DS_NQUOgVJ9/likes
```

## 📺 YouTube

### Canal (`channel`)
```
social-counter/youtube/channel/{channel_identifier}/subscribers       # Inscritos
social-counter/youtube/channel/{channel_identifier}/video_count       # Total de vídeos
social-counter/youtube/channel/{channel_identifier}/total_views       # Visualizações totais
```

**Exemplo:**
```
social-counter/youtube/channel/manualdomundo/subscribers
social-counter/youtube/channel/UC42jlbI7ByS9naW7xlZthBA/subscribers
```

### Vídeo (`video`)
```
social-counter/youtube/video/{video_id}/views               # Visualizações
social-counter/youtube/video/{video_id}/likes               # Curtidas
social-counter/youtube/video/{video_id}/comments            # Comentários
```

**Exemplo:**
```
social-counter/youtube/video/h_z35D5D5KU/views
```

## 🔍 Wildcards

Inscreva-se em múltiplos tópicos usando wildcards MQTT:

```bash
# Todas as plataformas e métricas
social-counter/#

# Apenas Instagram
social-counter/instagram/#

# Apenas YouTube
social-counter/youtube/#

# Apenas métricas de perfis (todas as plataformas)
social-counter/+/profile/#

# Apenas um perfil específico (todas as métricas)
social-counter/instagram/profile/belave.clinica/#

# Apenas followers de um perfil específico
social-counter/instagram/profile/belave.clinica/followers

# Apenas posts do Instagram (todos)
social-counter/instagram/post/#

# Apenas um post específico (todas as métricas)
social-counter/instagram/post/DS_NQUOgVJ9/#

# Apenas likes de um post específico
social-counter/instagram/post/DS_NQUOgVJ9/likes

# Apenas vídeos do YouTube (todos)
social-counter/youtube/video/#

# Apenas um vídeo específico (todas as métricas)
social-counter/youtube/video/h_z35D5D5KU/#

# Apenas views de um vídeo específico
social-counter/youtube/video/h_z35D5D5KU/views

# Apenas um canal específico (todas as métricas)
social-counter/youtube/channel/manualdomundo/#

# Apenas subscribers de um canal específico
social-counter/youtube/channel/manualdomundo/subscribers

# Apenas uma métrica específica (todas as plataformas e recursos)
social-counter/em um recurso específico
mosquitto_sub -h localhost -t "social-counter/youtube/video/h_z35D5D5KU/views" -v

# 2. Em outro terminal, fazer requisição à API
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/v1/youtube/h_z35D5D5KU/views

# 3. Verificar mensagem recebida no subscriber
```

### Exemplos por caso de uso:

**IoT que mostra apenas views de um vídeo específico:**
```bash
mosquitto_sub -h localhost -t "social-counter/youtube/video/h_z35D5D5KU/views" -v
```

**IoT que mostra followers de um perfil do Instagram:**
```bash
mosquitto_sub -h localhost -t "social-counter/instagram/profile/belave.clinica/followers" -v
```

**IoT que mostra todas as métricas de um canal do YouTube:**
```bash
mosquitto_sub -h localhost -t "social-counter/youtube/channel/manualdomundo/#" -v
```json
{
  "value": 1234567,
  "metadata": {
    "username": "example_user",
    "timestamp": "2026-01-16T10:30:00Z"
  },
  "cached": false
}
```

## 🧪 Teste Rápido

```bash
# 1. Inscrever no tópico
mosquitto_sub -h localhost -t "social-counter/#" -v

# 2. Em outro terminal, fazer requisição à API
curl http://localhost:3000/api/v1/instagram/@instagram/followers

# 3. Verificar mensagem recebida no subscriber
```

## 🔌 QoS (Quality of Service)

Atualmente configurado como QoS 0 (Fire and Forget):
- Sem confirmação de entrega
- Sem armazenamento de mensagens
- Melhor performance

## 📝 Notas

- As mensagens são publicadas automaticamente quando as rotas da API são chamadas
- Dados do cache também geram publicações MQTT
- Recomendado usar `retained: false` para evitar mensagens antigas
- Para produção, considere usar QoS 1 ou 2 para garantir entrega
