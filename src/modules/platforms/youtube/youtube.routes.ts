import type { Request, Response } from "express";
import { Router } from "express";
import type { MetricType } from "../base/platform.interface";
import { filterMetadata, parseWithMetadata } from "../../../utils/query-params";
import { ErrorCodes, sendError, sendSuccess } from "../../../utils/response";
import { YouTubeService } from "./youtube.service";

const router = Router();
const youtubeService = new YouTubeService();

/**
 * GET /api/v1/youtube/video?url=<encoded_url>
 * Busca todas as métricas de um vídeo
 *
 * Exemplo:
 *   /api/v1/youtube/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
 */
router.get("/video", async (req: Request, res: Response) => {
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<video_url>",
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await youtubeService.getAllVideoMetrics(url);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch video metrics",
	);
});

/**
 * GET /api/v1/youtube/video/:metric?url=<encoded_url>
 * Busca uma métrica específica de um vídeo usando URL completa via query param
 * Métricas suportadas: views, likes, comments
 *
 * Exemplos:
 *   /api/v1/youtube/video/views?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   /api/v1/youtube/video/likes?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   /api/v1/youtube/video/comments?url=dQw4w9WgXcQ
 */
router.get("/video/:metric", async (req: Request, res: Response) => {
	const { metric } = req.params;
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<video_url>",
		);
	}

	if (!metric) {
		return sendError(res, ErrorCodes.VALIDATION_ERROR, "Metric is required");
	}

	const validVideoMetrics: MetricType[] = ["views", "likes", "comments"];
	if (!validVideoMetrics.includes(metric as MetricType)) {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			`Invalid video metric. Valid metrics: ${validVideoMetrics.join(", ")}`,
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await youtubeService.getMetric(url, metric as MetricType);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch video metric",
	);
});

/**
 * GET /api/v1/youtube/channel?channel=<channel_identifier>
 * Busca todas as métricas de um canal
 *
 * Exemplos:
 *   /api/v1/youtube/channel?channel=@manualdomundo
 *   /api/v1/youtube/channel?channel=UCKHhA5hN2UohhFDfNXB_cvQ
 */
router.get("/channel", async (req: Request, res: Response) => {
	const { channel } = req.query;

	if (!channel || typeof channel !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Channel query parameter is required. Use ?channel=<channel_id_or_handle>",
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await youtubeService.getAllMetrics(channel);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch channel metrics",
	);
});

/**
 * GET /api/v1/youtube/channel/:metric?channel=<channel_identifier>
 * Busca uma métrica específica de um canal
 * Métricas suportadas: subscribers, video_count, total_views
 *
 * Exemplos:
 *   /api/v1/youtube/channel/subscribers?channel=@manualdomundo
 *   /api/v1/youtube/channel/total_views?channel=UCKHhA5hN2UohhFDfNXB_cvQ
 */
router.get("/channel/:metric", async (req: Request, res: Response) => {
	const { metric } = req.params;
	const { channel } = req.query;

	if (!channel || typeof channel !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Channel query parameter is required. Use ?channel=<channel_id_or_handle>",
		);
	}

	if (!metric) {
		return sendError(res, ErrorCodes.VALIDATION_ERROR, "Metric is required");
	}

	const validChannelMetrics: MetricType[] = [
		"subscribers",
		"video_count",
		"total_views",
	];
	if (!validChannelMetrics.includes(metric as MetricType)) {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			`Invalid channel metric. Valid metrics: ${validChannelMetrics.join(", ")}`,
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await youtubeService.getMetric(channel, metric as MetricType);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch channel metric",
	);
});

export default router;
