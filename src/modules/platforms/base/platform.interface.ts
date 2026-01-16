/**
 * Tipos base para plataformas de mídia social
 */

export type MetricType =
	| "followers"
	| "following"
	| "subscribers"
	| "posts_count"
	| "video_count"
	| "total_views"
	| "live_viewers"
	| "likes"
	| "views" // Para views de um vídeo específico
	| "comments"; // Para comentários de um vídeo específico

export interface MetricResult {
	metric: MetricType;
	value: number | bigint;
	metadata?: {
		display_name?: string;
		avatar_url?: string;
		verified?: boolean;
		bio?: string;
		[key: string]: unknown;
	};
}

export interface PlatformAdapter {
	/**
	 * Nome da plataforma
	 */
	readonly platformName: string;

	/**
	 * Slug da plataforma (usado em URLs)
	 */
	readonly platformSlug: string;

	/**
	 * Obtém uma métrica específica
	 * @param resource - Username, video ID/URL, ou qualquer identificador do recurso
	 * @param metric - Tipo de métrica a ser obtida
	 */
	getMetric(resource: string, metric: MetricType): Promise<MetricResult>;

	/**
	 * Obtém todas as métricas disponíveis para um recurso
	 * @param resource - Username, video ID/URL, ou qualquer identificador do recurso
	 */
	getAllMetrics(resource: string): Promise<Record<string, MetricResult>>;

	/**
	 * Verifica se uma métrica é suportada por esta plataforma
	 */
	supportsMetric(metric: MetricType): boolean;
}
