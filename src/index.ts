import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { authenticateApiKey } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFound } from "./middlewares/not-found.middleware";
import adminRoutes from "./modules/admin/admin.routes";
import instagramRoutes from "./modules/platforms/instagram/instagram.routes";
import youtubeRoutes from "./modules/platforms/youtube/youtube.routes";
import schedulerRoutes from "./modules/scheduler/scheduler.routes";
import { cacheCleanupJob } from "./services/cache-cleanup-job.service";
import { InstagramTokenRefreshService } from "./services/instagram-token-refresh.service";
import { metricScheduler } from "./services/metric-scheduler.service";
import { mqttService } from "./services/mqtt.service";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e parsing
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Swagger documentation (sem autenticação)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Social Counter API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-01-06T10:30:00.000Z
 *                 mqtt:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 */
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		message: "Social Counter API is running",
		timestamp: new Date().toISOString(),
		mqtt: mqttService.getStatus(),
	});
});

// Rotas administrativas (protegidas por admin key)
app.use("/api/admin", adminRoutes);

// Middleware de autenticação (aplica a todas as rotas da API v1)
app.use("/api/v1", authenticateApiKey);

// Rotas da API
app.use("/api/v1/instagram", instagramRoutes);
app.use("/api/v1/youtube", youtubeRoutes);
app.use("/api/v1/scheduler", schedulerRoutes);

// Middlewares de erro (devem ser os últimos)
app.use(notFound);
app.use(errorHandler);

// Função para inicializar serviços assíncronos
async function initializeServices() {
	try {
		// Conecta ao broker MQTT
		await mqttService.connect();
		console.log("✅ MQTT connected");

		// Inicia verificação periódica do token do Instagram
		const tokenRefreshService = new InstagramTokenRefreshService();
		tokenRefreshService.startPeriodicCheck();

		// Inicia o agendador de métricas
		metricScheduler.start();

		// Inicia o job de cleanup do cache
		// cacheCleanupJob.start();
	} catch (error) {
		console.error("❌ Failed to initialize services:", error);
		console.warn("⚠️  Continuing without MQTT connection");
	}
}

app.listen(PORT, async () => {
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
	console.log(`📱 Instagram API: http://localhost:${PORT}/api/v1/instagram`);
	console.log(`📺 YouTube API: http://localhost:${PORT}/api/v1/youtube`);
	console.log(`⏰ Scheduler API: http://localhost:${PORT}/api/v1/scheduler`);

	// Inicializa serviços assíncronos
	await initializeServices();

	console.log(`🔌 MQTT Status:`, mqttService.getStatus());
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("\n🛑 Shutting down gracefully...");
	metricScheduler.stop();
	cacheCleanupJob.stop();
	await mqttService.disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("\n🛑 Shutting down gracefully...");
	metricScheduler.stop();
	cacheCleanupJob.stop();
	await mqttService.disconnect();
	process.exit(0);
});
