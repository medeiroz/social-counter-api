import { logger } from "../utils/logger";
import { ErrorCodes, sendError } from "../utils/response";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de autenticação por API Key
 * Verifica se o header X-API-Key ou query param api_key é válido
 */
export function authenticateApiKey(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// Busca a API key do header ou query string
	const apiKeyFromHeader = req.headers["x-api-key"] as string | undefined;
	const apiKeyFromQuery = req.query.api_key as string | undefined;

	const providedApiKey = apiKeyFromHeader || apiKeyFromQuery;

	// API key esperada (deve vir de variável de ambiente)
	const validApiKey = process.env.API_KEY;

	// Se não há API key configurada, permite acesso (modo desenvolvimento)
	if (!validApiKey) {
		logger.warn(
			"[Auth] No API_KEY configured in environment. Authentication disabled.",
		);
		next();
		return;
	}

	// Se não foi fornecida API key
	if (!providedApiKey) {
		logger.warn(
			`[Auth] Missing API key from ${req.ip} - ${req.method} ${req.path}`,
		);
		sendError(
			res,
			ErrorCodes.UNAUTHORIZED,
			"API key is required. Provide it via X-API-Key header or api_key query parameter.",
			401,
		);
		return;
	}

	// Valida a API key
	if (providedApiKey !== validApiKey) {
		logger.warn(
			`[Auth] Invalid API key from ${req.ip} - ${req.method} ${req.path}`,
		);
		sendError(res, ErrorCodes.UNAUTHORIZED, "Invalid API key", 401);
		return;
	}

	// API key válida
	logger.info(
		`[Auth] Valid API key from ${req.ip} - ${req.method} ${req.path}`,
	);
	next();
}
