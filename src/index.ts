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
import instagramRoutes from "./modules/platforms/instagram/instagram.routes";
import youtubeRoutes from "./modules/platforms/youtube/youtube.routes";

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
 */
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		message: "Social Counter API is running",
		timestamp: new Date().toISOString(),
	});
});

// Middleware de autenticação (aplica a todas as rotas da API)
app.use("/api", authenticateApiKey);

// Rotas da API
app.use("/api/v1/instagram", instagramRoutes);
app.use("/api/v1/youtube", youtubeRoutes);

// Middlewares de erro (devem ser os últimos)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
	console.log(`📱 Instagram API: http://localhost:${PORT}/api/v1/instagram`);
	console.log(`📺 YouTube API: http://localhost:${PORT}/api/v1/youtube`);
});
