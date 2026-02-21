# Configuração MQTT

Este documento descreve como configurar e usar o MQTT na Social Counter API.

## 📋 Visão Geral

A API agora publica automaticamente todas as métricas buscadas em um broker MQTT, permitindo que dispositivos IoT recebam notificações em tempo real sobre mudanças nas estatísticas das redes sociais.

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="your_mqtt_username"
MQTT_PASSWORD="your_mqtt_password"
MQTT_CLIENT_ID="social-counter-api"
```

- **MQTT_BROKER_URL**: URL do broker MQTT (padrão: `mqtt://localhost:1883`)
- **MQTT_USERNAME**: Usuário para autenticação (opcional)
- **MQTT_PASSWORD**: Senha para autenticação (opcional)
- **MQTT_CLIENT_ID**: ID do cliente (padrão: auto-gerado)

### 2. Broker MQTT Local (Desenvolvimento)

Para testes locais, você pode usar o Mosquitto:

```bash
# Docker
docker run -it -p 1883:1883 eclipse-mosquitto:2

# Ou instalar localmente
# Windows: https://mosquitto.org/download/
# Linux: sudo apt-get install mosquitto mosquitto-clients
# macOS: brew install mosquitto
```

### 3. Brokers MQTT na Nuvem

Você também pode usar brokers na nuvem:

- **HiveMQ Cloud**: https://www.hivemq.com/mqtt-cloud-broker/
- **CloudMQTT**: https://www.cloudmqtt.com/
- **EMQX Cloud**: https://www.emqx.com/en/cloud

## 📡 Estrutura dos Tópicos

Para detalhes completos sobre a estrutura de tópicos, wildcards e exemplos práticos, consulte: **[TOPICS.md](TOPICS.md)**

Resumo: Os tópicos seguem o padrão `social-counter/{platform}/{resource}/{resource_id}/{metric}`

**Exemplos:**
- `social-counter/instagram/profile/belave.clinica/followers`
- `social-counter/youtube/video/h_z35D5D5KU/views`

## 📨 Formato das Mensagens

Todas as mensagens são enviadas em formato JSON, com a mesma estrutura retornada pelas rotas da API:

### Exemplo - Métrica Individual:

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

### Exemplo - Post do Instagram:

```json
{
  "value": 5432,
  "metadata": {
    "post_url": "https://www.instagram.com/p/ABC123/",
    "timestamp": "2026-01-16T10:30:00Z"
  },
  "cached": false
}
```

### Exemplo - Vídeo do YouTube:

```json
{
  "value": 123456,
  "metadata": {
    "video_id": "dQw4w9WgXcQ",
    "timestamp": "2026-01-16T10:30:00Z"
  },
  "cached": false
}
```

## 🎯 Subscrição aos Tópicos

### Usando Mosquitto Client (Linha de Comando):

```bash
# Inscrever em todos os tópicos
mosquitto_sub -h localhost -t "social-counter/#" -v

# Inscrever em tópicos específicos do Instagram
mosquitto_sub -h localhost -t "social-counter/instagram/#" -v

# Inscrever em um perfil específico (todas as métricas)
mosquitto_sub -h localhost -t "social-counter/instagram/profile/belave.clinica/#" -v

# Inscrever em seguidores de um perfil específico
mosquitto_sub -h localhost -t "social-counter/instagram/profile/belave.clinica/followers" -v

# Inscrever em um post específico (todas as métricas)
mosquitto_sub -h localhost -t "social-counter/instagram/post/DS_NQUOgVJ9/#" -v

# Inscrever em likes de um post específico
mosquitto_sub -h localhost -t "social-counter/instagram/post/DS_NQUOgVJ9/likes" -v

# Inscrever em um canal específico do YouTube
mosquitto_sub -h localhost -t "social-counter/youtube/channel/manualdomundo/#" -v

# Inscrever em views de um vídeo específico
mosquitto_sub -h localhost -t "social-counter/youtube/video/h_z35D5D5KU/views" -v

# Com autenticação
mosquitto_sub -h broker.example.com -u username -P password -t "social-counter/#" -v
```

### Wildcards MQTT:

- `#` - Múltiplos níveis (ex: `social-counter/#` recebe tudo)
- `+` - Um nível (ex: `social-counter/+/profile/+/#` recebe todas as métricas de todos os perfis)

## 🔌 Integração com ESP32/Arduino

Exemplo de código para ESP32 que monitora views de um vídeo específico:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* mqtt_server = "your_mqtt_broker";
const char* mqtt_user = "your_username";
const char* mqtt_pass = "your_password";

// Tópico específico para monitorar views de um vídeo
const char* topic = "social-counter/youtube/video/h_z35D5D5KU/views";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (!error) {
    long value = doc["value"];
    Serial.print("Views: ");
    Serial.println(value);
    
    // Atualizar display LCD, LED, etc.
    updateDisplay(value);
  }
}

void setup() {
  Serial.begin(115200);
  
  // Conectar ao WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Configurar MQTT
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  // Conectar ao broker
  while (!client.connected()) {
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("Connected to MQTT broker");
      
      // Inscrever no tópico específico
      client.subscribe(topic);
      Serial.print("Subscribed to: ");
      Serial.println(topic);
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    // Reconectar
    setup();
  }
  client.loop();
}

void updateDisplay(long value) {
  // Implementar atualização do seu display aqui
  // Exemplo: LCD, LED matrix, OLED, etc.
}
```

## 🧪 Testes

### 1. Iniciar o servidor:

```bash
npm run dev
```

### 2. Em outro terminal, iniciar o subscriber:

```bash
mosquitto_sub -h localhost -t "social-counter/#" -v
```

### 3. Fazer uma requisição à API:

```bash
curl http://localhost:3000/instagram/@username/followers
```

### 4. Verificar a mensagem no subscriber:

```
social-counter/instagram/profile/followers {"value":1234567,"metadata":{...},"cached":false}
```

## ⚙️ Funcionamento

1. Quando qualquer rota da API é chamada e retorna dados
2. O serviço MQTT automaticamente publica a mensagem no tópico apropriado
3. Todos os dispositivos inscritos naquele tópico recebem a atualização em tempo real
4. As mensagens são idênticas às respostas da API (formato JSON)

## 🔒 Segurança

- Use TLS/SSL em produção (`mqtts://`)
- Configure autenticação com username/password
- Use ACLs (Access Control Lists) no broker para limitar acesso aos tópicos
- Considere usar certificados cliente para autenticação mais segura

## 📚 Recursos Úteis

- [MQTT.org](https://mqtt.org/)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [HiveMQ](https://www.hivemq.com/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [PubSubClient (Arduino)](https://github.com/knolleary/pubsubclient)
