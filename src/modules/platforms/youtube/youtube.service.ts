import { YouTubeAdapter } from "./youtube.adapter";
import { get as cacheGet, set as cacheSet } from "../../cache/cache.service";
import type { MetricType } from "../base/platform.interface";
import { logger } from "../../../utils/logger";
import { ErrorCodes } from "../../../utils/response";

export class YouTubeService {
	private adapter: YouTubeAdapter;

	constructor() {
		this.adapter = new YouTubeAdapter();
	}

	/**
	 * Busca uma métrica específica (com cache)
	 */
	async getMetric(channelIdentifier: string, metric: MetricType) {
		try {
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
					success: true,
					data: {
						...cached,
						value: Number(cached.value),
					},
				};
			}

			// Se não está em cache, busca da API
			const result = await this.adapter.getMetric(channelIdentifier, metric);

			// Salva no cache
			await cacheSet("youtube", channelIdentifier, metric, result);

			logger.info(
				`[YouTube Service] Successfully fetched and cached ${metric} for '${channelIdentifier}'`,
			);

			return {
				success: true,
				data: {
					value: Number(result.value),
					metadata: result.metadata,
					cached: false,
				},
			};
		} catch (error) {
			logger.error(
				`[YouTube Service] Error fetching metric ${metric} for '${channelIdentifier}'`,
				error,
			);

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message: errorMessage,
				},
			};
		}
	}

	/**
	 * Busca todas as métricas de um vídeo (com cache)
	 */
	async getAllVideoMetrics(videoIdentifier: string) {
		try {
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

				if (result.status === "fulfilled" && result.value.success) {
					data[metric] = result.value.data;
				} else if (result.status === "fulfilled" && !result.value.success) {
					errors.push({
						metric,
						error: result.value.error?.message || "Unknown error",
					});
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

			return {
				success: true,
				data: {
					video: videoIdentifier,
					metrics: data,
					...(errors.length > 0 && { partial_errors: errors }),
				},
			};
		} catch (error) {
			logger.error(
				`[YouTube Service] Error fetching all video metrics for '${videoIdentifier}'`,
				error,
			);

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message: errorMessage,
				},
			};
		}
	}

	/**
	 * Busca todas as métricas disponíveis (com cache)
	 */
	async getAllMetrics(channelIdentifier: string) {
		try {
			logger.info(
				`[YouTube Service] Fetching all metrics for '${channelIdentifier}'...`,
			);

			const metrics: MetricType[] = [
				"subscribers",
				"video_count",
				"total_views",
			];

			const results = await Promise.allSettled(
				metrics.map((metric) => this.getMetric(channelIdentifier, metric)),
			);

			const data: Record<string, unknown> = {};
			const errors: Array<{ metric: string; error: string }> = [];

			results.forEach((result, index) => {
				const metric = metrics[index];
				if (!metric) return;

				if (result.status === "fulfilled" && result.value.success) {
					data[metric] = result.value.data;
				} else if (result.status === "fulfilled" && !result.value.success) {
					errors.push({
						metric,
						error: result.value.error?.message || "Unknown error",
					});
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

			return {
				success: true,
				data: {
					channel: channelIdentifier,
					metrics: data,
					...(errors.length > 0 && { partial_errors: errors }),
				},
			};
		} catch (error) {
			logger.error(
				`[YouTube Service] Error fetching all metrics for '${channelIdentifier}'`,
				error,
			);

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message: errorMessage,
				},
			};
		}
	}
}
