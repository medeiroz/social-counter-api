import { logger } from "../../../utils/logger";
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
		logger.info(`[Instagram Service] Fetching ${metric} for @${username}...`);

		// Tenta buscar do cache primeiro
		const cached = await cacheGet("instagram", username, metric);

		if (cached) {
			logger.info(`[Instagram Service] Cache HIT for @${username}/${metric}`);
			return {
				...cached,
				value: Number(cached.value),
				cached: true,
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
			...result,
			value: Number(result.value),
			cached: false,
		};
	}

	/**
	 * Busca todas as métricas de um post (com cache)
	 * Otimizado: faz apenas 1 requisição ao invés de 3
	 */
	async getAllPostMetrics(postIdentifier: string) {
		logger.info(
			`[Instagram Service] Fetching all post metrics for '${postIdentifier}'...`,
		);

		const metrics: MetricType[] = ["likes", "comments", "views"];
		const cacheKey = `all_post_metrics`;

		// Tenta buscar do cache primeiro
		const cached = await cacheGet("instagram", postIdentifier, cacheKey);

		if (cached && typeof cached === "object" && "likes" in cached) {
			logger.info(
				`[Instagram Service] Cache HIT for ${postIdentifier}/all_post_metrics`,
			);
			const cachedData = cached as unknown as Record<
				string,
				{ value: number | bigint; metadata?: Record<string, unknown> }
			>;
			return {
				post: postIdentifier,
				metrics: {
					likes: { ...cachedData.likes, cached: true },
					comments: { ...cachedData.comments, cached: true },
					views: { ...cachedData.views, cached: true },
				},
			};
		}

		logger.info(
			`[Instagram Service] Cache MISS for ${postIdentifier}/all_post_metrics`,
		);

		try {
			// Busca todas as métricas de uma vez (1 requisição)
			const result = await this.adapter.getAllPostMetrics(postIdentifier);

			// Salva cada métrica no cache individualmente
			const data: Record<string, unknown> = {};
			for (const metric of metrics) {
				const metricResult = result[metric];
				if (!metricResult) continue;

				const metricData = {
					value: Number(metricResult.value),
					metadata: metricResult.metadata || {},
					cached: false,
				};
				data[metric] = metricData;

				// Salva no cache individual
				await cacheSet("instagram", postIdentifier, metric, {
					value: metricResult.value,
					metadata: metricResult.metadata || {},
				});
			}

			// Salva no cache consolidado (não salva porque cacheSet espera MetricData, não Record)
			// Os caches individuais por métrica já foram salvos

			logger.info(
				`[Instagram Service] Successfully fetched and cached all post metrics for '${postIdentifier}'`,
			);

			return {
				post: postIdentifier,
				metrics: data,
			};
		} catch (_error) {
			// Fallback para o método antigo se falhar
			logger.warn(
				`[Instagram Service] Failed to fetch all post metrics at once, falling back to individual requests`,
			);
			const results = await Promise.allSettled(
				metrics.map((metric) => this.getMetric(postIdentifier, metric)),
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
						error: result.reason?.message || "Request failed",
					});
				}
			});

			logger.info(
				`[Instagram Service] Fetched ${Object.keys(data).length}/${metrics.length} post metrics for '${postIdentifier}'`,
			);

			return {
				post: postIdentifier,
				metrics: data,
				...(errors.length > 0 && { partial_errors: errors }),
			};
		}
	}

	/**
	 * Busca todas as métricas disponíveis (com cache)
	 * Otimizado: faz apenas 1 requisição ao invés de 3
	 */
	async getAllMetrics(username: string) {
		logger.info(`[Instagram Service] Fetching all metrics for @${username}...`);

		const metrics: MetricType[] = ["followers", "following", "posts_count"];
		const cacheKey = `all_metrics`;

		// Tenta buscar do cache primeiro
		const cached = await cacheGet("instagram", username, cacheKey);

		if (cached && typeof cached === "object" && "followers" in cached) {
			logger.info(`[Instagram Service] Cache HIT for @${username}/all_metrics`);
			const cachedData = cached as unknown as Record<
				string,
				{ value: number | bigint; metadata?: Record<string, unknown> }
			>;
			return {
				username,
				metrics: {
					followers: { ...cachedData.followers, cached: true },
					following: { ...cachedData.following, cached: true },
					posts_count: { ...cachedData.posts_count, cached: true },
				},
			};
		}

		logger.info(`[Instagram Service] Cache MISS for @${username}/all_metrics`);

		try {
			// Busca todas as métricas de uma vez (1 requisição)
			const result = await this.adapter.getAllAccountMetrics(username);

			// Salva cada métrica no cache individualmente
			const data: Record<string, unknown> = {};
			for (const metric of metrics) {
				const metricResult = result[metric];
				if (!metricResult) continue;

				const metricData = {
					value: Number(metricResult.value),
					metadata: metricResult.metadata || {},
					cached: false,
				};
				data[metric] = metricData;

				// Salva no cache individual
				await cacheSet("instagram", username, metric, {
					value: metricResult.value,
					metadata: metricResult.metadata || {},
				});
			}

			// Salva no cache consolidado (não salva porque cacheSet espera MetricData, não Record)
			// Os caches individuais por métrica já foram salvos

			logger.info(
				`[Instagram Service] Successfully fetched and cached all metrics for @${username}`,
			);

			return {
				username,
				metrics: data,
			};
		} catch (_error) {
			// Fallback para o método antigo se falhar
			logger.warn(
				`[Instagram Service] Failed to fetch all metrics at once, falling back to individual requests`,
			);

			const results = await Promise.allSettled(
				metrics.map((metric) => this.getMetric(username, metric)),
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
						error: result.reason?.message || "Request failed",
					});
				}
			});

			logger.info(
				`[Instagram Service] Fetched ${Object.keys(data).length}/${metrics.length} metrics for @${username}`,
			);

			return {
				username,
				metrics: data,
				...(errors.length > 0 && { partial_errors: errors }),
			};
		}
	}
}
