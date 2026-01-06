import type { Request, Response } from "express";
import { Router } from "express";
import { filterMetadata, parseWithMetadata } from "../../../utils/query-params";
import { ErrorCodes, sendError, sendSuccess } from "../../../utils/response";
import type { MetricType } from "../base/platform.interface";
import { InstagramService } from "./instagram.service";

const router = Router();
const instagramService = new InstagramService();

// POST: Get all post metrics
router.get("/post", async (req: Request, res: Response) => {
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<post_url_or_shortcode>",
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await instagramService.getAllPostMetrics(url);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch post metrics",
		);
	}
});

// POST: Get specific post metric
router.get("/post/:metric", async (req: Request, res: Response) => {
	const { metric } = req.params;
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<post_url_or_shortcode>",
		);
	}

	if (!metric) {
		return sendError(res, ErrorCodes.VALIDATION_ERROR, "Metric is required");
	}

	const validPostMetrics: MetricType[] = ["likes", "comments", "views"];
	if (!validPostMetrics.includes(metric as MetricType)) {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			`Invalid post metric. Valid metrics: ${validPostMetrics.join(", ")}`,
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await instagramService.getMetric(url, metric as MetricType);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch post metric",
		);
	}
});

// ACCOUNT: Get all account metrics
router.get("/account", async (req: Request, res: Response) => {
	const { username } = req.query;

	if (!username || typeof username !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Username query parameter is required. Use ?username=<username>",
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await instagramService.getAllMetrics(username);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error
				? error.message
				: "Failed to fetch account metrics",
		);
	}
});

// ACCOUNT: Get specific account metric
router.get("/account/:metric", async (req: Request, res: Response) => {
	const { metric } = req.params;
	const { username } = req.query;

	if (!username || typeof username !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Username query parameter is required. Use ?username=<username>",
		);
	}

	if (!metric) {
		return sendError(res, ErrorCodes.VALIDATION_ERROR, "Metric is required");
	}

	const validAccountMetrics: MetricType[] = [
		"followers",
		"following",
		"posts_count",
	];
	if (!validAccountMetrics.includes(metric as MetricType)) {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			`Invalid account metric. Valid metrics: ${validAccountMetrics.join(", ")}`,
		);
	}

	try {
		const withMetadata = parseWithMetadata(req);
		const result = await instagramService.getMetric(
			username,
			metric as MetricType,
		);
		const filteredData = filterMetadata(result, withMetadata);
		return sendSuccess(res, filteredData);
	} catch (error) {
		return sendError(
			res,
			ErrorCodes.EXTERNAL_API_ERROR,
			error instanceof Error ? error.message : "Failed to fetch account metric",
		);
	}
});

export default router;
