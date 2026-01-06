import type {
	MetricResult,
	MetricType,
	PlatformAdapter,
} from "./platform.interface";

/**
 * Classe base abstrata para adapters de plataforma
 * Fornece estrutura comum para todas as implementações
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
	abstract readonly platformName: string;
	abstract readonly platformSlug: string;

	/**
	 * Métricas suportadas pela plataforma
	 * Deve ser definido por cada implementação
	 */
	protected abstract supportedMetrics: MetricType[];

	/**
	 * Implementação específica para obter uma métrica
	 */
	protected abstract fetchMetric(
		resource: string,
		metric: MetricType,
	): Promise<MetricResult>;

	/**
	 * Obtém uma métrica com validação
	 */
	async getMetric(resource: string, metric: MetricType): Promise<MetricResult> {
		if (!this.supportsMetric(metric)) {
			throw new Error(
				`Metric "${metric}" is not supported by ${this.platformName}`,
			);
		}

		return this.fetchMetric(resource, metric);
	}

	/**
	 * Obtém todas as métricas disponíveis
	 */
	async getAllMetrics(resource: string): Promise<Record<string, MetricResult>> {
		const results: Record<string, MetricResult> = {};

		// Busca todas as métricas em paralelo
		const promises = this.supportedMetrics.map(async (metric) => {
			try {
				const result = await this.fetchMetric(resource, metric);
				results[metric] = result;
			} catch (error) {
				// Log do erro mas não falha toda a operação
				console.error(
					`Error fetching ${metric} for ${resource} on ${this.platformName}:`,
					error,
				);
			}
		});

		await Promise.allSettled(promises);

		return results;
	}

	/**
	 * Verifica se uma métrica é suportada
	 */
	supportsMetric(metric: MetricType): boolean {
		return this.supportedMetrics.includes(metric);
	}

	/**
	 * Helper para normalizar recursos (usernames, URLs, etc)
	 */
	protected normalizeResource(resource: string): string {
		return resource.toLowerCase().trim().replace(/^@/, "");
	}
}
