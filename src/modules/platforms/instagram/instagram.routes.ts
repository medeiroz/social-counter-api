import type { Request, Response } from "express";
import { Router } from "express";
import { filterMetadata, parseWithMetadata } from "../../../utils/query-params";
import { ErrorCodes, sendError, sendSuccess } from "../../../utils/response";
import type { MetricType } from "../base/platform.interface";
import { InstagramService } from "./instagram.service";

const router = Router();
const instagramService = new InstagramService();

/**
 * GET /api/v1/instagram/post?url=<post_url_or_shortcode>
 * Busca todas as métricas de um post
 *
 * Exemplos:
 *   /api/v1/instagram/post?url=https://www.instagram.com/p/ABC123/
 *   /api/v1/instagram/post?url=ABC123
 */
router.get("/post", async (req: Request, res: Response) => {
	const { url } = req.query;

	if (!url || typeof url !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"URL query parameter is required. Use ?url=<post_url_or_shortcode>",
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await instagramService.getAllPostMetrics(url);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch post metrics",
	);
});

/**
 * GET /api/v1/instagram/post/:metric?url=<post_url_or_shortcode>
 * Busca uma métrica específica de um post
 * Métricas suportadas: likes, comments, views
 *
 * Exemplos:
 *   /api/v1/instagram/post/likes?url=https://www.instagram.com/p/ABC123/
 *   /api/v1/instagram/post/comments?url=ABC123
 */
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

	const withMetadata = parseWithMetadata(req);
	const result = await instagramService.getMetric(url, metric as MetricType);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch post metric",
	);
});

/**
 * GET /api/v1/instagram/account?username=<username>
 * Busca todas as métricas de uma conta
 *
 * Exemplo:
 *   /api/v1/instagram/account?username=belave.clinica
 */
router.get("/account", async (req: Request, res: Response) => {
	const { username } = req.query;

	if (!username || typeof username !== "string") {
		return sendError(
			res,
			ErrorCodes.VALIDATION_ERROR,
			"Username query parameter is required. Use ?username=<username>",
		);
	}

	const withMetadata = parseWithMetadata(req);
	const result = await instagramService.getAllMetrics(username);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch account metrics",
	);
});

/**
 * GET /api/v1/instagram/account/:metric?username=<username>
 * Busca uma métrica específica de uma conta
 * Métricas suportadas: followers, following, posts_count
 *
 * Exemplos:
 *   /api/v1/instagram/account/followers?username=belave.clinica
 *   /api/v1/instagram/account/following?username=belave.clinica
 */
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

	const withMetadata = parseWithMetadata(req);
	const result = await instagramService.getMetric(
		username,
		metric as MetricType,
	);

	if (result.success) {
		const filteredData = filterMetadata(result.data, withMetadata);
		return sendSuccess(res, filteredData);
	}

	return sendError(
		res,
		result.error?.code || ErrorCodes.EXTERNAL_API_ERROR,
		result.error?.message || "Failed to fetch account metric",
	);
});

export default router;
