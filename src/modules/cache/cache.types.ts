/**
 * Tipos para o sistema de cache
 */

export interface CacheEntry {
	platformId: string;
	resource: string;
	metricType: string;
	value: bigint;
	metadata?: Record<string, unknown>;
	fetchedAt: Date;
	expiresAt: Date;
}

export interface MetricData {
	value: bigint | number;
	metadata?: Record<string, unknown>;
}

export interface CachedMetric extends MetricData {
	cached: boolean;
	fetchedAt: string;
	expiresAt: string;
}
