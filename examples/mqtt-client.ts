/**
 * Exemplo de cliente MQTT em Node.js
 * Este script demonstra como se conectar ao broker MQTT e receber notificações
 */

import mqtt from "mqtt";

// Configurações
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

console.log("🚀 Cliente MQTT - Social Counter API");
console.log("=====================================\n");

// Configurar opções de conexão
const options = {
	clientId: `mqtt-client-${Math.random().toString(16).slice(2, 10)}`,
	clean: true,
	reconnectPeriod: 5000,
	...(MQTT_USERNAME && { username: MQTT_USERNAME }),
	...(MQTT_PASSWORD && { password: MQTT_PASSWORD }),
};

console.log(`📡 Conectando ao broker: ${MQTT_BROKER_URL}\n`);

// Conectar ao broker
const client = mqtt.connect(MQTT_BROKER_URL, options);

client.on("connect", () => {
	console.log("✅ Conectado ao broker MQTT\n");

	// Inscrever em todos os tópicos da social-counter
	const topics = [
		"social-counter/#", // Todos os tópicos
		// Ou tópicos específicos:
		// 'social-counter/instagram/profile/followers',
		// 'social-counter/instagram/post/likes',
		// 'social-counter/youtube/channel/subscribers',
	];

	topics.forEach((topic) => {
		client.subscribe(topic, (err) => {
			if (err) {
				console.error(`❌ Erro ao inscrever no tópico ${topic}:`, err);
			} else {
				console.log(`📥 Inscrito no tópico: ${topic}`);
			}
		});
	});

	console.log("\n🎧 Aguardando mensagens...\n");
});

client.on("message", (topic, message) => {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`📨 Mensagem recebida`);
	console.log(`📍 Tópico: ${topic}`);

	try {
		const data = JSON.parse(message.toString());
		console.log(`📊 Dados:`, JSON.stringify(data, null, 2));
	} catch {
		console.log(`📄 Mensagem: ${message.toString()}`);
	}

	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});

client.on("error", (error) => {
	console.error("❌ Erro na conexão MQTT:", error);
});

client.on("offline", () => {
	console.log("⚠️  Cliente offline, tentando reconectar...");
});

client.on("reconnect", () => {
	console.log("🔄 Reconectando ao broker...");
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n\n🛑 Encerrando cliente MQTT...");
	client.end(() => {
		console.log("✅ Cliente desconectado");
		process.exit(0);
	});
});
