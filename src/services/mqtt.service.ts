import mqtt from "mqtt";
import { logger } from "../utils/logger";

export class MqttService {
	private client: mqtt.MqttClient | null = null;
	private isConnected = false;
	private connectPromise: Promise<void> | null = null;

	/**
	 * Inicializa e conecta ao broker MQTT
	 */
	async connect(): Promise<void> {
		// Se já está conectando ou conectado, retorna a promise existente
		if (this.connectPromise) {
			return this.connectPromise;
		}

		// Se já está conectado, retorna imediatamente
		if (this.isConnected && this.client) {
			return Promise.resolve();
		}

		this.connectPromise = new Promise((resolve, reject) => {
			const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
			const username = process.env.MQTT_USERNAME;
			const password = process.env.MQTT_PASSWORD;
			const clientIdPrefix = process.env.MQTT_CLIENT_ID || `social-counter-api`;
			const clientId = `${clientIdPrefix}-${Math.random().toString(16).slice(2, 10)}`;

			logger.info(`[MQTT] Connecting to broker: ${brokerUrl}`);

			try {
				const options: mqtt.IClientOptions = {
					clientId,
					clean: true,
					reconnectPeriod: 1000,
					connectTimeout: 30000,
				};

				// Adiciona username/password apenas se estiverem definidos
				if (username) {
					options.username = username;
				}
				if (password) {
					options.password = password;
				}

				this.client = mqtt.connect(brokerUrl, options);

				this.client.on("connect", () => {
					this.isConnected = true;
					logger.info("[MQTT] Connected successfully to broker");
					resolve();
				});

				this.client.on("error", (error) => {
					logger.error("[MQTT] Connection error:", error);
					this.isConnected = false;
					// Não rejeitamos aqui porque o cliente vai tentar reconectar
					if (!this.isConnected) {
						reject(error);
					}
				});

				this.client.on("offline", () => {
					this.isConnected = false;
					logger.warn("[MQTT] Client is offline");
				});

				this.client.on("reconnect", () => {
					logger.info("[MQTT] Attempting to reconnect...");
				});

				// Timeout de 30 segundos para a conexão inicial
				setTimeout(() => {
					if (!this.isConnected) {
						reject(new Error("MQTT connection timeout"));
					}
				}, 30000);
			} catch (error) {
				logger.error("[MQTT] Failed to initialize client:", error);
				reject(error);
			}
		});

		return this.connectPromise;
	}

	/**
	 * Publica uma mensagem em um tópico MQTT
	 * Tópicos seguem o padrão: social-counter/{platform}/{resource}/{resource_id}/{metric}
	 */
	async publish(
		platform: string,
		resource: string,
		resourceId: string,
		metric: string,
		data: unknown,
	): Promise<void> {
		if (!this.client || !this.isConnected) {
			logger.warn("[MQTT] Client not connected, skipping publish");
			return;
		}

		const topic = `social-counter/${platform}/${resource}/${resourceId}/${metric}`;
		const message = JSON.stringify(data);

		return new Promise((resolve, reject) => {
			if (!this.client) {
				reject(new Error("MQTT client not initialized"));
				return;
			}

			this.client.publish(topic, message, { qos: 0 }, (error) => {
				if (error) {
					logger.error(`[MQTT] Failed to publish to ${topic}:`, error);
					reject(error);
				} else {
					logger.info(`[MQTT] Published to ${topic}`);
					resolve();
				}
			});
		});
	}

	/**
	 * Desconecta do broker MQTT
	 */
	async disconnect(): Promise<void> {
		if (this.client) {
			return new Promise((resolve) => {
				if (!this.client) {
					resolve();
					return;
				}

				this.client.end(false, {}, () => {
					logger.info("[MQTT] Disconnected from broker");
					this.isConnected = false;
					resolve();
				});
			});
		}
	}

	/**
	 * Retorna o status da conexão
	 */
	getStatus(): { connected: boolean } {
		return { connected: this.isConnected };
	}
}

// Exporta uma instância singleton
export const mqttService = new MqttService();
