import { mqttService } from "../../../services/mqtt.service";
import { logger } from "../../../utils/logger";
import { extractResourceId } from "../../../utils/resource-id";
import { get as cacheGet, set as cacheSet } from "../../cache/cache.service";
import type { MetricType } from "../base/platform.interface";
import { YouTubeAdapter } from "./youtube.adapter";

export class YouTubeService {
	private adapter: YouTubeAdapter;

	constructor() {
		this.adapter = new YouTubeAdapter();
	}

	/**
	 * Busca uma métrica específica (com cache)
	 */
	async getMetric(channelIdentifier: string, metric: MetricType) {
		logger.info(
			`[YouTube Service] Fetching ${metric} for channel '${channelIdentifier}'...`,
		);

		// Tenta buscar do cache primeiro
		const cached = await cacheGet("youtube", channelIdentifier, metric);

		if (cached) {
			logger.info(
				`[YouTube Service] Cache HIT for '${channelIdentifier}'/${metric}`,
			);
			return {
				...cached,
				value: Number(cached.value),
			};
		}

		// Se não está em cache, busca da API
		const result = await this.adapter.getMetric(channelIdentifier, metric);

		// Salva no cache
		await cacheSet("youtube", channelIdentifier, metric, result);

		logger.info(
			`[YouTube Service] Successfully fetched and cached ${metric} for '${channelIdentifier}'`,
		);

		const response = {
			metric,
			value: Number(result.value),
			metadata: result.metadata,
			cached: false,
		};

		// Publica no MQTT (channel ou video dependendo da métrica)
		const resource = ["subscribers", "video_count", "total_views"].includes(
			metric,
		)
			? "channel"
			: "video";
		const resourceId = extractResourceId(channelIdentifier);
		mqttService
			.publish("youtube", resource, resourceId, metric, {
				value: response.value,
				metric: response.metric,
			})
			.catch((err) =>
				logger.error("[YouTube Service] Failed to publish to MQTT:", err),
			);

		return response;
	}

	/**
	 * Busca todas as métricas de um vídeo (com cache)
	 */
	async getAllVideoMetrics(videoIdentifier: string) {
		logger.info(
			`[YouTube Service] Fetching all video metrics for '${videoIdentifier}'...`,
		);

		const metrics: MetricType[] = ["views", "likes", "comments"];

		const results = await Promise.allSettled(
			metrics.map((metric) => this.getMetric(videoIdentifier, metric)),
		);

		const data: Record<string, unknown> = {};
		const errors: Array<{ metric: string; error: string }> = [];

		results.forEach((result, index) => {
			const metric = metrics[index];
			if (!metric) return;

			if (result.status === "fulfilled") {
				data[metric] = result.value;
			} else if (result.status === "rejected") {
				errors.push({
					metric,
					error:
						result.reason instanceof Error
							? result.reason.message
							: String(result.reason),
				});
			}
		});

		const response = {
			video: videoIdentifier,
			metrics: data,
			...(errors.length > 0 && { partial_errors: errors }),
		};

		// Publica cada métrica no MQTT
		const resourceId = extractResourceId(videoIdentifier);
		for (const [metric, metricData] of Object.entries(data)) {
			const md = metricData as { value: number; metric: string };
			mqttService
				.publish("youtube", "video", resourceId, metric, {
					value: md.value,
					metric: md.metric,
				})
				.catch((err) =>
					logger.error(
						`[YouTube Service] Failed to publish ${metric} to MQTT:`,
						err,
					),
				);
		}

		return response;
	}

	/**
	 * Busca todas as métricas disponíveis (com cache)
	 */
	async getAllMetrics(channelIdentifier: string) {
		logger.info(
			`[YouTube Service] Fetching all metrics for '${channelIdentifier}'...`,
		);

		const metrics: MetricType[] = ["subscribers", "video_count", "total_views"];

		const results = await Promise.allSettled(
			metrics.map((metric) => this.getMetric(channelIdentifier, metric)),
		);

		const data: Record<string, unknown> = {};
		const errors: Array<{ metric: string; error: string }> = [];

		results.forEach((result, index) => {
			const metric = metrics[index];
			if (!metric) return;

			if (result.status === "fulfilled") {
				data[metric] = result.value;
			} else if (result.status === "rejected") {
				errors.push({
					metric,
					error:
						result.reason instanceof Error
							? result.reason.message
							: String(result.reason),
				});
			}
		});

		const response = {
			channel: channelIdentifier,
			metrics: data,
			...(errors.length > 0 && { partial_errors: errors }),
		};

		// Publica cada métrica no MQTT
		const resourceId = extractResourceId(channelIdentifier);
		for (const [metric, metricData] of Object.entries(data)) {
			const md = metricData as { value: number; metric: string };
			mqttService
				.publish("youtube", "channel", resourceId, metric, {
					value: md.value,
					metric: md.metric,
				})
				.catch((err) =>
					logger.error(
						`[YouTube Service] Failed to publish ${metric} to MQTT:`,
						err,
					),
				);
		}

		return response;
	}
}

// Exporta instância singleton
export const youtubeService = new YouTubeService();
