import type { NextFunction, Request, Response } from "express";

/**
 * Middleware para autenticação de rotas administrativas
 */
export function authenticateAdmin(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const adminKey = process.env.API_ADMIN_KEY;

	if (!adminKey) {
		res.status(500).json({
			error: {
				code: "ADMIN_KEY_NOT_CONFIGURED",
				message: "Admin authentication is not configured",
			},
		});
		return;
	}

	// Verifica token no header ou query string
	const token =
		req.headers["x-admin-key"] ||
		req.headers["x-api-key"] ||
		req.query.admin_key;

	if (!token) {
		res.status(401).json({
			error: {
				code: "ADMIN_KEY_REQUIRED",
				message:
					"Admin key is required. Provide it via X-Admin-Key header or admin_key query parameter",
			},
		});
		return;
	}

	if (token !== adminKey) {
		res.status(401).json({
			error: {
				code: "INVALID_ADMIN_KEY",
				message: "Invalid admin key",
			},
		});
		return;
	}

	next();
}
