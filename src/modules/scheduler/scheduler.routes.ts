import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { metricScheduler } from "../../services/metric-scheduler.service";
import { logger } from "../../utils/logger";
import { extractResourceId } from "../../utils/resource-id";

const router = Router();

// Schema de validação
const addScheduleSchema = z
	.object({
		platform: z.enum(["instagram", "youtube"]),
		resource: z.enum(["profile", "post", "channel", "video"]),
		resource_id: z.string().min(1),
		metric: z.string().min(1),
		interval_minutes: z
			.number()
			.min(0.5)
			.max(24 * 60)
			.default(5),
		expires_in_days: z.number().min(1).max(30).default(7),
		notify_only_changed: z.boolean().default(false),
	})
	.transform((data) => ({
		platform: data.platform,
		resource: data.resource,
		resourceId: data.resource_id,
		metric: data.metric,
		intervalMinutes: data.interval_minutes,
		expiresInDays: data.expires_in_days,
		notifyOnlyChanged: data.notify_only_changed,
	}));

/**
 * @openapi
 * /api/v1/scheduler:
 *   post:
 *     summary: Adiciona uma métrica ao agendamento automático
 *     description: Agenda uma métrica para ser buscada automaticamente em intervalos regulares
 *     tags:
 *       - Scheduler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - resource
 *               - resource_id
 *               - metric
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [instagram, youtube]
 *                 example: youtube
 *               resource:
 *                 type: string
 *                 enum: [profile, post, channel, video]
 *                 example: video
 *               resource_id:
 *                 type: string
 *                 description: ID ou URL do recurso
 *                 example: h_z35D5D5KU
 *               metric:
 *                 type: string
 *                 example: views
 *               interval_minutes:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 1440
 *                 default: 5
 *                 description: Intervalo de busca em minutos (mínimo 30 segundos)
 *               expires_in_days:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 30
 *                 default: 7
 *                 description: Validade do agendamento em dias
 *               notify_only_changed:
 *                 type: boolean
 *                 default: false
 *                 description: Se true, só publica no MQTT quando o valor mudar
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Agendamento já existe
 */
router.post("/", async (req: Request, res: Response) => {
	try {
		const data = addScheduleSchema.parse(req.body);

		// Extrai o ID limpo do recurso automaticamente
		const cleanResourceId = extractResourceId(data.resourceId);

		// Calcula data de expiração
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

		// Verifica se já existe
		const existing = await prisma.scheduledMetric.findUnique({
			where: {
				platform_resource_resource_id_metric: {
					platform: data.platform,
					resource: data.resource,
					resource_id: cleanResourceId,
					metric: data.metric,
				},
			},
		});

		if (existing) {
			// Atualiza o existente
			const nextRunAt = new Date(Date.now() + data.intervalMinutes * 60 * 1000);
			const updated = await prisma.scheduledMetric.update({
				where: { id: existing.id },
				data: {
					interval_minutes: data.intervalMinutes,
					expires_at: expiresAt,
					is_active: true,
					notify_only_changed: data.notifyOnlyChanged,
					next_run_at: nextRunAt,
				},
			});

			logger.info(
				`[Scheduler] Updated scheduled metric: ${data.platform}/${data.resource}/${cleanResourceId}/${data.metric}`,
			);

			return res.status(200).json({
				message: "Scheduled metric updated",
				data: updated,
			});
		}

		// Cria novo agendamento
		const nextRunAt = new Date(); // Executa imediatamente na primeira vez
		const scheduled = await prisma.scheduledMetric.create({
			data: {
				platform: data.platform,
				resource: data.resource,
				resource_id: cleanResourceId,
				metric: data.metric,
				interval_minutes: data.intervalMinutes,
				expires_at: expiresAt,
				next_run_at: nextRunAt,
				notify_only_changed: data.notifyOnlyChanged,
				created_by: req.ip || "unknown",
			},
		});

		logger.info(
			`[Scheduler] Created scheduled metric: ${data.platform}/${data.resource}/${cleanResourceId}/${data.metric}`,
		);

		return res.status(201).json({
			message: "Scheduled metric created",
			data: scheduled,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				error: "Invalid request data",
				details: error.errors,
			});
		}

		logger.error("[Scheduler] Error creating scheduled metric:", error);
		return res.status(500).json({
			error: "Internal server error",
		});
	}
});

/**
 * @openapi
 * /api/v1/scheduler:
 *   get:
 *     summary: Lista todas as métricas agendadas
 *     description: Retorna todas as métricas agendadas ativas
 *     tags:
 *       - Scheduler
 *     responses:
 *       200:
 *         description: Lista de métricas agendadas
 */
router.get("/", async (_req: Request, res: Response) => {
	try {
		const scheduled = await prisma.scheduledMetric.findMany({
			where: {
				is_active: true,
				expires_at: {
					gt: new Date(),
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		return res.status(200).json({
			data: scheduled,
			count: scheduled.length,
		});
	} catch (error) {
		logger.error("[Scheduler] Error listing scheduled metrics:", error);
		return res.status(500).json({
			error: "Internal server error",
		});
	}
});

/**
 * @openapi
 * /api/v1/scheduler/stats:
 *   get:
 *     summary: Estatísticas do agendador
 *     description: Retorna estatísticas sobre as métricas agendadas
 *     tags:
 *       - Scheduler
 *     responses:
 *       200:
 *         description: Estatísticas do agendador
 */
router.get("/stats", async (_req: Request, res: Response) => {
	try {
		const stats = await metricScheduler.getStats();

		return res.status(200).json({
			data: stats,
		});
	} catch (error) {
		logger.error("[Scheduler] Error getting scheduler stats:", error);
		return res.status(500).json({
			error: "Internal server error",
		});
	}
});

/**
 * @openapi
 * /api/v1/scheduler/{id}:
 *   delete:
 *     summary: Remove uma métrica do agendamento
 *     description: Desativa um agendamento específico
 *     tags:
 *       - Scheduler
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento removido com sucesso
 *       404:
 *         description: Agendamento não encontrado
 */
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({
				error: "ID is required",
			});
		}

		const scheduled = await prisma.scheduledMetric.findUnique({
			where: { id },
		});

		if (!scheduled) {
			return res.status(404).json({
				error: "Scheduled metric not found",
			});
		}

		// Desativa ao invés de deletar (soft delete)
		await prisma.scheduledMetric.update({
			where: { id },
			data: { is_active: false },
		});

		logger.info(`[Scheduler] Deactivated scheduled metric: ${id}`);

		return res.status(200).json({
			message: "Scheduled metric deactivated",
		});
	} catch (error) {
		logger.error("[Scheduler] Error deleting scheduled metric:", error);
		return res.status(500).json({
			error: "Internal server error",
		});
	}
});

export default router;
