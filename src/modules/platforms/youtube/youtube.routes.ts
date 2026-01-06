import type { Request, Response } from "express";
import { Router } from "express";
import { filterMetadata, parseWithMetadata } from "../../../utils/query-params";
import { ErrorCodes, sendError, sendSuccess } from "../../../utils/response";
import type { MetricType } from "../base/platform.interface";
import { YouTubeService } from "./youtube.service";

const router = Router();
const youtubeService = new YouTubeService();

// VIDEO: Get all video metrics
router.get("/video", async (req: Request, res: Response) => {
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<video_url>",
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await youtubeService.getAllVideoMetrics(url);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch video metrics",
		);
	}
});

// VIDEO: Get specific video metric
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

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await youtubeService.getMetric(url, metric as MetricType);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch video metric",
		);
	}
});

// CHANNEL: Get all channel metrics
router.get("/channel", async (req: Request, res: Response) => {
	const { channel } = req.query;

	if (!channel || typeof channel !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Channel query parameter is required. Use ?channel=<channel_id_or_handle>",
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await youtubeService.getAllMetrics(channel);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error
				? error.message
				: "Failed to fetch channel metrics",
		);
	}
});

// CHANNEL: Get specific channel metric
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

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await youtubeService.getMetric(
			channel,
			metric as MetricType,
		);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch channel metric",
		);
	}
});

export default router;
