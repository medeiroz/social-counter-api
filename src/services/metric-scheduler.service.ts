import { prisma } from "../lib/prisma";
import type { MetricType } from "../modules/platforms/base/platform.interface";
import { instagramService } from "../modules/platforms/instagram/instagram.service";
import { youtubeService } from "../modules/platforms/youtube/youtube.service";
import { logger } from "../utils/logger";

export class MetricSchedulerService {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;
	private checkIntervalMs = 60000; // Verifica a cada 1 minuto

	/**
	 * Inicia o agendador
	 */
	start() {
		if (this.isRunning) {
			logger.warn("[Scheduler] Already running");
			return;
		}

		logger.info("[Scheduler] Starting metric scheduler...");
		this.isRunning = true;

		// Executa imediatamente uma vez
		this.processScheduledMetrics();

		// Depois executa periodicamente
		this.intervalId = setInterval(() => {
			this.processScheduledMetrics();
		}, this.checkIntervalMs);

		logger.info(
			`[Scheduler] Metric scheduler started (check interval: ${this.checkIntervalMs / 1000}s)`,
		);
	}

	/**
	 * Para o agendador
	 */
	stop() {
		if (!this.isRunning) {
			return;
		}

		logger.info("[Scheduler] Stopping metric scheduler...");

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}

		this.isRunning = false;
		logger.info("[Scheduler] Metric scheduler stopped");
	}

	/**
	 * Processa todas as métricas agendadas que precisam ser atualizadas
	 */
	private async processScheduledMetrics() {
		try {
			const now = new Date();

			// Busca métricas que estão prontas para executar (query otimizada)
			const scheduledMetrics = await prisma.scheduledMetric.findMany({
				where: {
					is_active: true,
					expires_at: { gt: now },
					next_run_at: { lte: now },
				},
				take: 50, // Limite de métricas por ciclo
				orderBy: { next_run_at: "asc" },
			});

			if (scheduledMetrics.length === 0) {
				return;
			}

			logger.info(
				`[Scheduler] Processing ${scheduledMetrics.length} scheduled metrics`,
			);

			// Processa métricas em paralelo (máximo 10 por vez)
			const batchSize = 10;
			for (let i = 0; i < scheduledMetrics.length; i += batchSize) {
				const batch = scheduledMetrics.slice(i, i + batchSize);
				await Promise.allSettled(
					batch.map((scheduled) => this.fetchScheduledMetric(scheduled)),
				);
			}
		} catch (error) {
			logger.error("[Scheduler] Error processing scheduled metrics:", error);
		}
	}

	/**
	 * Busca uma métrica específica agendada
	 */
	private async fetchScheduledMetric(scheduled: {
		id: string;
		platform: string;
		resource: string;
		resource_id: string;
		metric: string;
		interval_minutes: number;
		notify_only_changed: boolean;
		last_value: string | null;
	}) {
		logger.info(
			`[Scheduler] Fetching ${scheduled.platform}/${scheduled.resource}/${scheduled.resource_id}/${scheduled.metric}`,
		);

		try {
			let result:
				| {
						value: number;
						cached: boolean;
						metric: string;
						fetchedAt?: string;
						expiresAt?: string;
						metadata?: Record<string, unknown> | undefined;
				  }
				| undefined;

			if (scheduled.platform === "instagram") {
				if (scheduled.resource === "profile") {
					result = await instagramService.getMetric(
						scheduled.resource_id,
						scheduled.metric as MetricType,
					);
				} else if (scheduled.resource === "post") {
					// Para posts, pode precisar buscar métricas específicas
					result = await instagramService.getMetric(
						scheduled.resource_id,
						scheduled.metric as MetricType,
					);
				}
			} else if (scheduled.platform === "youtube") {
				result = await youtubeService.getMetric(
					scheduled.resource_id,
					scheduled.metric as MetricType,
				);
			}

			// Verifica se deve notificar
			const currentValue = result?.value?.toString() || "";
			let shouldNotify = true;

			if (scheduled.notify_only_changed && scheduled.last_value !== null) {
				// Só notifica se o valor mudou
				shouldNotify = currentValue !== scheduled.last_value;

				if (!shouldNotify) {
					logger.debug(
						`[Scheduler] Value unchanged for ${scheduled.platform}/${scheduled.resource}/${scheduled.resource_id}/${scheduled.metric}, skipping MQTT notification`,
					);
				}
			}

			// Calcula próxima execução
			const nextRunAt = new Date(
				Date.now() + scheduled.interval_minutes * 60 * 1000,
			);

			// Atualiza o lastValue e next_run_at no banco de dados
			await prisma.scheduledMetric.update({
				where: { id: scheduled.id },
				data: {
					last_value: currentValue,
					last_fetched_at: new Date(),
					next_run_at: nextRunAt,
				},
			});

			// Se não deve notificar, força a flag no resultado para não publicar no MQTT
			if (!shouldNotify && result) {
				// O MQTT já foi publicado pelos services, então esta verificação
				// serve mais para logging. Precisamos ajustar a lógica nos services.
				logger.info(
					`[Scheduler] Fetched ${scheduled.platform}/${scheduled.resource}/${scheduled.resource_id}/${scheduled.metric} (notification: ${shouldNotify ? "sent" : "skipped"})`,
				);
			} else {
				logger.info(
					`[Scheduler] Successfully fetched ${scheduled.platform}/${scheduled.resource}/${scheduled.resource_id}/${scheduled.metric}`,
				);
			}
		} catch (error) {
			logger.error(
				`[Scheduler] Error fetching metric ${scheduled.platform}/${scheduled.resource}/${scheduled.resource_id}/${scheduled.metric}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Retorna estatísticas do agendador
	 */
	async getStats() {
		const now = new Date();

		const [total, active, expired, dueNow] = await Promise.all([
			prisma.scheduledMetric.count(),
			prisma.scheduledMetric.count({
				where: {
					is_active: true,
					expires_at: { gt: now },
				},
			}),
			prisma.scheduledMetric.count({
				where: {
					expires_at: { lte: now },
				},
			}),
			prisma.scheduledMetric.count({
				where: {
					is_active: true,
					expires_at: { gt: now },
					OR: [
						{ last_fetched_at: null },
						{
							last_fetched_at: {
								lte: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutos atrás
							},
						},
					],
				},
			}),
		]);

		return {
			total,
			active,
			expired,
			dueNow,
			isRunning: this.isRunning,
		};
	}
}

// Exporta instância singleton
export const metricScheduler = new MetricSchedulerService();
