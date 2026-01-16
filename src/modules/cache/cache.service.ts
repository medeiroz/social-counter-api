import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../utils/logger";
import type { CachedMetric, MetricData } from "./cache.types";

/**
 * TTL padrão por plataforma (em minutos)
 * Para contador em tempo real, use TTLs mais baixos
 */
const TTL_CONFIG: Record<string, number> = {
	instagram: 2, // Reduzido para 2 minutos (tempo real)
	"instagram:followers": 0.5, // Followers atualiza a cada 30 segundos
	"instagram:following": 5, // Following menos crítico
	"instagram:posts_count": 10, // Posts count menos crítico
	youtube: 5,
	"youtube:subscribers": 2, // Subscribers mais frequente
	tiktok: 3,
	twitch: 5,
	"twitch:live_viewers": 0.5, // 30 segundos para viewers ao vivo
};

/**
 * Obtém o TTL apropriado para uma plataforma/métrica
 */
function getTTL(platformSlug: string, metricType: string): number {
	const key = `${platformSlug}:${metricType}`;
	return TTL_CONFIG[key] || TTL_CONFIG[platformSlug] || 5;
}

/**
 * Busca uma métrica no cache
 * Retorna null se não encontrado ou expirado
 */
export async function get(
	platformSlug: string,
	resource: string,
	metricType: string,
): Promise<CachedMetric | null> {
	try {
		const platform = await prisma.platform.findUnique({
			where: { slug: platformSlug },
		});

		if (!platform) {
			logger.warn(`Platform not found: ${platformSlug}`);
			return null;
		}

		const metric = await prisma.metric.findFirst({
			where: {
				platform_id: platform.id,
				resource: resource.toLowerCase(),
				metric_type: metricType,
				expires_at: {
					gt: new Date(), // Ainda não expirou
				},
			},
			orderBy: {
				fetched_at: "desc", // Pega o mais recente
			},
		});

		if (!metric) {
			logger.debug(`Cache miss: ${platformSlug}/${resource}/${metricType}`);
			return null;
		}

		logger.debug(`Cache hit: ${platformSlug}/${resource}/${metricType}`);

		const result: CachedMetric = {
			metric: metricType,
			value: metric.value,
			cached: true,
			fetchedAt: metric.fetched_at.toISOString(),
			expiresAt: metric.expires_at.toISOString(),
		};

		if (metric.metadata) {
			result.metadata = metric.metadata as Record<string, unknown>;
		}

		return result;
	} catch (error) {
		logger.error("Error getting cache", error);
		return null;
	}
}

/**
 * Salva uma métrica no cache
 */
export async function set(
	platformSlug: string,
	resource: string,
	metricType: string,
	data: MetricData,
	requestId?: string,
	requestedBy?: string,
): Promise<void> {
	try {
		const platform = await prisma.platform.findUnique({
			where: { slug: platformSlug },
		});

		if (!platform) {
			logger.error(`Platform not found: ${platformSlug}`);
			return;
		}

		const ttlMinutes = getTTL(platformSlug, metricType);
		const now = new Date();
		const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

		// Converte number para BigInt se necessário
		const value =
			typeof data.value === "bigint" ? data.value : BigInt(data.value);

		await prisma.metric.create({
			data: {
				platform_id: platform.id,
				resource: resource.toLowerCase(),
				metric_type: metricType,
				value,
				...(data.metadata && {
					metadata: data.metadata as Prisma.InputJsonValue,
				}),
				fetched_at: now,
				expires_at: expiresAt,
				...(requestId && { request_id: requestId }),
				...(requestedBy && { requested_by: requestedBy }),
			},
		});
		logger.debug(
			`Cache set: ${platformSlug}/${resource}/${metricType} (TTL: ${ttlMinutes}min)`,
		);
	} catch (error) {
		logger.error("Error setting cache", error);
	}
}

/**
 * Limpa cache expirado (para job de limpeza periódica)
 */
export async function cleanup(): Promise<number> {
	try {
		const result = await prisma.metric.deleteMany({
			where: {
				expires_at: {
					lt: new Date(),
				},
			},
		});

		logger.info(`Cache cleanup: ${result.count} expired entries removed`);
		return result.count;
	} catch (error) {
		logger.error("Error cleaning up cache", error);
		return 0;
	}
}

/**
 * Obtém estatísticas do cache (útil para monitoramento)
 */
export async function getStats(): Promise<{
	total: number;
	expired: number;
	byPlatform: Record<string, number>;
}> {
	try {
		const [total, expired, byPlatform] = await Promise.all([
			prisma.metric.count(),
			prisma.metric.count({
				where: { expires_at: { lt: new Date() } },
			}),
			prisma.metric.groupBy({
				by: ["platform_id"],
				_count: true,
			}),
		]);

		const platforms = await prisma.platform.findMany();
		const platformMap = platforms.reduce(
			(acc: Record<string, string>, p: { id: string; slug: string }) => {
				acc[p.id] = p.slug;
				return acc;
			},
			{} as Record<string, string>,
		);

		const byPlatformStats = byPlatform.reduce(
			(
				acc: Record<string, number>,
				item: { platform_id: string; _count: number },
			) => {
				const slug = platformMap[item.platform_id] || item.platform_id;
				acc[slug] = item._count;
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			total,
			expired,
			byPlatform: byPlatformStats,
		};
	} catch (error) {
		logger.error("Error getting cache stats", error);
		return { total: 0, expired: 0, byPlatform: {} };
	}
}
