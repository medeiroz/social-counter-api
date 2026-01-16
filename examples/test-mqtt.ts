/**
 * Script de teste para integração MQTT
 * Inicia um subscriber e faz requisições à API para verificar as publicações
 */

import axios from "axios";
import mqtt from "mqtt";

// Configurações
const MQTT_HOST = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const API_URL = process.env.API_URL || "http://localhost:3000";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

console.log("🚀 Teste de Integração MQTT - Social Counter API");
console.log("=================================================\n");

console.log("📋 Configurações:");
console.log(`  MQTT Broker: ${MQTT_HOST}`);
console.log(`  API URL: ${API_URL}\n`);

// Verifica se a API está rodando
console.log("🔍 Verificando se a API está rodando...");
try {
	await axios.get(`${API_URL}/health`);
	console.log("✅ API está rodando\n");
} catch {
	console.log(`❌ API não está respondendo em ${API_URL}`);
	console.log("Inicie a API com: npm run dev");
	process.exit(1);
}

// Configurar cliente MQTT
const options = {
	clientId: `test-client-${Math.random().toString(16).slice(2, 10)}`,
	clean: true,
	...(MQTT_USERNAME && { username: MQTT_USERNAME }),
	...(MQTT_PASSWORD && { password: MQTT_PASSWORD }),
};

console.log("📡 Conectando ao broker MQTT...");
const client = mqtt.connect(MQTT_HOST, options);

client.on("connect", async () => {
	console.log("✅ Conectado ao broker MQTT");
	console.log("📥 Inscrito em: social-counter/#\n");

	// Inscrever em todos os tópicos
	client.subscribe("social-counter/#");

	// Aguarda um pouco para garantir a conexão
	await new Promise((resolve) => setTimeout(resolve, 1000));

	console.log("🧪 Executando testes...\n");

	// Teste 1: Instagram Profile Metric
	console.log("1️⃣ Testando Instagram - Profile Followers");
	console.log(
		`   Requisição: GET ${API_URL}/api/v1/instagram/@instagram/followers`,
	);
	try {
		await axios.get(`${API_URL}/api/v1/instagram/@instagram/followers`, {
			headers: { "X-API-Key": process.env.API_KEY || "your_api_key" },
		});
		console.log("   ✅ Requisição enviada");
	} catch (_error) {
		console.log("   ⚠️ Erro na requisição (verifique a API_KEY)");
	}
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log();

	// Teste 2: Instagram All Metrics
	console.log("2️⃣ Testando Instagram - All Profile Metrics");
	console.log(`   Requisição: GET ${API_URL}/api/v1/instagram/@instagram/all`);
	try {
		await axios.get(`${API_URL}/api/v1/instagram/@instagram/all`, {
			headers: { "X-API-Key": process.env.API_KEY || "your_api_key" },
		});
		console.log("   ✅ Requisição enviada");
	} catch {
		console.log("   ⚠️ Erro na requisição (verifique a API_KEY)");
	}
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log();

	// Teste 3: YouTube Channel Metric
	console.log("3️⃣ Testando YouTube - Channel Subscribers");
	console.log(
		`   Requisição: GET ${API_URL}/api/v1/youtube/@MrBeast/subscribers`,
	);
	try {
		await axios.get(`${API_URL}/api/v1/youtube/@MrBeast/subscribers`, {
			headers: { "X-API-Key": process.env.API_KEY || "your_api_key" },
		});
		console.log("   ✅ Requisição enviada");
	} catch {
		console.log("   ⚠️ Erro na requisição (verifique a API_KEY)");
	}
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log();

	// Teste 4: YouTube All Metrics
	console.log("4️⃣ Testando YouTube - All Channel Metrics");
	console.log(`   Requisição: GET ${API_URL}/api/v1/youtube/@MrBeast/all`);
	try {
		await axios.get(`${API_URL}/api/v1/youtube/@MrBeast/all`, {
			headers: { "X-API-Key": process.env.API_KEY || "your_api_key" },
		});
		console.log("   ✅ Requisição enviada");
	} catch {
		console.log("   ⚠️ Erro na requisição (verifique a API_KEY)");
	}
	await new Promise((resolve) => setTimeout(resolve, 2000));
	console.log();

	console.log("✨ Testes concluídos!");
	console.log("\n📊 Verifique acima as mensagens recebidas no subscriber MQTT");
	console.log("Pressione Ctrl+C para encerrar\n");
});

client.on("message", (topic, message) => {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`📨 Mensagem MQTT recebida`);
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
	process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n\n🛑 Encerrando teste...");
	client.end(() => {
		console.log("✅ Cliente desconectado");
		process.exit(0);
	});
});
