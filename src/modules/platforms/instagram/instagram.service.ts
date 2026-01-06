import { logger } from "../../../utils/logger";
import { ErrorCodes } from "../../../utils/response";
import { get as cacheGet, set as cacheSet } from "../../cache/cache.service";
import type { MetricType } from "../base/platform.interface";
import { InstagramAdapter } from "./instagram.adapter";

export class InstagramService {
	private adapter: InstagramAdapter;

	constructor() {
		this.adapter = new InstagramAdapter();
	}

	/**
	 * Busca uma métrica específica (com cache)
	 */
	async getMetric(username: string, metric: MetricType) {
		try {
			logger.info(`[Instagram Service] Fetching ${metric} for @${username}...`);

			// Tenta buscar do cache primeiro
			const cached = await cacheGet("instagram", username, metric);

			if (cached) {
				logger.info(`[Instagram Service] Cache HIT for @${username}/${metric}`);
				return {
					success: true,
					data: {
						...cached,
						value: Number(cached.value),
						cached: true,
					},
				};
			}

			logger.info(`[Instagram Service] Cache MISS for @${username}/${metric}`);

			// Se não está em cache, busca da API
			const result = await this.adapter.getMetric(username, metric);

			// Salva no cache
			await cacheSet("instagram", username, metric, result);
			logger.info(
				`[Instagram Service] Successfully fetched and cached ${metric} for @${username}`,
			);

			return {
				success: true,
				data: {
					...result,
					value: Number(result.value),
					cached: false,
				},
			};
		} catch (error) {
			logger.error(
				`[Instagram Service] Error fetching ${metric} for @${username}`,
				error,
			);

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message:
						error instanceof Error ? error.message : "Failed to fetch metric",
				},
			};
		}
	}

	/**
	 * Busca todas as métricas de um post (com cache)
	 */
	async getAllPostMetrics(postIdentifier: string) {
		try {
			logger.info(
				`[Instagram Service] Fetching all post metrics for '${postIdentifier}'...`,
			);

			const metrics: MetricType[] = ["likes", "comments", "views"];

			const results = await Promise.allSettled(
				metrics.map((metric) => this.getMetric(postIdentifier, metric)),
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
						error: result.reason?.message || "Request failed",
					});
				}
			});

			logger.info(
				`[Instagram Service] Fetched ${Object.keys(data).length}/${metrics.length} post metrics for '${postIdentifier}'`,
			);

			return {
				success: true,
				data: {
					post: postIdentifier,
					metrics: data,
					...(errors.length > 0 && { partial_errors: errors }),
				},
			};
		} catch (error) {
			logger.error(
				`[Instagram Service] Error fetching all post metrics for '${postIdentifier}'`,
				error,
			);

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch post metrics",
				},
			};
		}
	}

	/**
	 * Busca todas as métricas disponíveis (com cache)
	 */
	async getAllMetrics(username: string) {
		try {
			logger.info(
				`[Instagram Service] Fetching all metrics for @${username}...`,
			);

			const metrics: MetricType[] = ["followers", "following", "posts_count"];

			const results = await Promise.allSettled(
				metrics.map((metric) => this.getMetric(username, metric)),
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
						error: result.reason?.message || "Request failed",
					});
				}
			});

			logger.info(
				`[Instagram Service] Fetched ${Object.keys(data).length}/${metrics.length} metrics for @${username}`,
			);

			return {
				success: true,
				data: {
					username,
					metrics: data,
					...(errors.length > 0 && { partial_errors: errors }),
				},
			};
		} catch (error) {
			logger.error(
				`[Instagram Service] Error fetching all metrics for @${username}`,
				error,
			);

			return {
				success: false,
				error: {
					code: ErrorCodes.EXTERNAL_API_ERROR,
					message:
						error instanceof Error ? error.message : "Failed to fetch metrics",
				},
			};
		}
	}
}
