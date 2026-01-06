import type { Response } from "express";
import type { ErrorResponse, SuccessResponse } from "../types/global";

/**
 * Envia uma resposta de sucesso padronizada
 */
export function sendSuccess<T>(
	res: Response,
	data: T,
	statusCode = 200,
): Response<SuccessResponse<T>> {
	return res.status(statusCode).json(data);
}

/**
 * Envia uma resposta de erro padronizada
 */
export function sendError(
	res: Response,
	code: string,
	message: string,
	statusCode = 400,
	details?: unknown,
): Response<ErrorResponse> {
	return res.status(statusCode).json({
		error: {
			code,
			message,
			...(details && typeof details === "object" && details !== null
				? { details }
				: {}),
		},
	});
}

/**
 * Códigos de erro comuns
 */
export const ErrorCodes = {
	// Validação
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_PLATFORM: "INVALID_PLATFORM",
	INVALID_METRIC: "INVALID_METRIC",

	// Autenticação
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",

	// Recursos
	USER_NOT_FOUND: "USER_NOT_FOUND",
	PLATFORM_NOT_FOUND: "PLATFORM_NOT_FOUND",
	METRIC_NOT_FOUND: "METRIC_NOT_FOUND",

	// Rate limiting
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

	// APIs externas
	EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
	EXTERNAL_API_TIMEOUT: "EXTERNAL_API_TIMEOUT",
	EXTERNAL_API_RATE_LIMIT: "EXTERNAL_API_RATE_LIMIT",

	// Servidor
	INTERNAL_ERROR: "INTERNAL_ERROR",
	NOT_FOUND: "NOT_FOUND",
} as const;
