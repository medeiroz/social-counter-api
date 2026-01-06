import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../utils/logger";
import type { CachedMetric, MetricData } from "./cache.types";

/**
 * TTL padrão por plataforma (em minutos)
 */
const TTL_CONFIG: Record<string, number> = {
	instagram: 5,
	youtube: 10,
	tiktok: 3,
	twitch: 5,
	"twitch:live_viewers": 1, // Caso especial para live viewers
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
				platformId: platform.id,
				resource: resource.toLowerCase(),
				metricType,
				expiresAt: {
					gt: new Date(), // Ainda não expirou
				},
			},
			orderBy: {
				fetchedAt: "desc", // Pega o mais recente
			},
		});

		if (!metric) {
			logger.debug(`Cache miss: ${platformSlug}/${resource}/${metricType}`);
			return null;
		}

		logger.debug(`Cache hit: ${platformSlug}/${resource}/${metricType}`);

		const result: CachedMetric = {
			value: metric.value,
			cached: true,
			fetchedAt: metric.fetchedAt.toISOString(),
			expiresAt: metric.expiresAt.toISOString(),
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
				platformId: platform.id,
				resource: resource.toLowerCase(),
				metricType,
				value,
				...(data.metadata && {
					metadata: data.metadata as Prisma.InputJsonValue,
				}),
				fetchedAt: now,
				expiresAt,
				...(requestId && { requestId }),
				...(requestedBy && { requestedBy }),
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
				expiresAt: {
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
				where: { expiresAt: { lt: new Date() } },
			}),
			prisma.metric.groupBy({
				by: ["platformId"],
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
				item: { platformId: string; _count: number },
			) => {
				const slug = platformMap[item.platformId] || item.platformId;
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
