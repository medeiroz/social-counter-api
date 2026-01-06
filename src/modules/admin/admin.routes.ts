import type { Request, Response } from "express";
import { Router } from "express";
import { authenticateAdmin } from "../../middlewares/admin-auth.middleware";
import { InstagramTokenRefreshService } from "../../services/instagram-token-refresh.service";

const router = Router();

// Aplica autenticação admin em todas as rotas
router.use(authenticateAdmin);

/**
 * POST /api/admin/instagram/refresh-token
 * Força a renovação do token do Instagram
 */
router.post(
	"/instagram/refresh-token",
	async (_req: Request, res: Response) => {
		try {
			const tokenService = new InstagramTokenRefreshService();

			await tokenService.refreshToken();

			res.status(200).json({
				message: "Instagram token refreshed successfully",
				refreshed_at: new Date().toISOString(),
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			res.status(500).json({
				error: {
					code: "TOKEN_REFRESH_FAILED",
					message: "Failed to refresh Instagram token",
					details: errorMessage,
				},
			});
		}
	},
);

/**
 * GET /api/admin/instagram/token-status
 * Verifica o status do token do Instagram
 */
router.get("/instagram/token-status", async (_req: Request, res: Response) => {
	try {
		const tokenService = new InstagramTokenRefreshService();

		const tokenInfo = await tokenService.getTokenInfo();
		const isExpiringSoon = await tokenService.isTokenExpiringSoon();

		const now = new Date();
		let daysUntilExpiry: number | null = null;

		if (tokenInfo.expiresAt) {
			daysUntilExpiry = Math.floor(
				(tokenInfo.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			);
		}

		res.status(200).json({
			has_token: !!tokenInfo.token,
			is_expiring_soon: isExpiringSoon,
			needs_refresh: isExpiringSoon,
			expires_at: tokenInfo.expiresAt?.toISOString() || null,
			days_until_expiry: daysUntilExpiry,
			created_at: tokenInfo.createdAt?.toISOString() || null,
			updated_at: tokenInfo.updatedAt?.toISOString() || null,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		res.status(500).json({
			error: {
				code: "TOKEN_STATUS_CHECK_FAILED",
				message: "Failed to check token status",
				details: errorMessage,
			},
		});
	}
});

/**
 * GET /api/admin/health
 * Health check administrativo
 */
router.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		message: "Admin API is running",
		timestamp: new Date().toISOString(),
	});
});

export default router;
