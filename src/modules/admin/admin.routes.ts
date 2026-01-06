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
 * GET /api/admin/instagram/verify-credentials
 * Verifica se as credenciais do Facebook App estão corretas
 */
router.get(
	"/instagram/verify-credentials",
	async (_req: Request, res: Response) => {
		try {
			const appId = process.env.INSTAGRAM_APP_ID;
			const appSecret = process.env.INSTAGRAM_APP_SECRET;

			if (!appId || !appSecret) {
				res.status(500).json({
					error: {
						code: "CREDENTIALS_NOT_CONFIGURED",
						message: "Instagram App ID or Secret not configured",
					},
				});
				return;
			}

			// Tenta obter app access token para validar credenciais
			const response = await fetch(
				`https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`,
			);

			if (!response.ok) {
				const errorData = await response.json();
				res.status(400).json({
					valid: false,
					error: errorData.error?.message || "Failed to verify credentials",
					app_id: appId,
					hint: "Check if App ID and App Secret are correct in Facebook Developers",
				});
				return;
			}

			const data = await response.json();

			res.status(200).json({
				valid: true,
				app_id: appId,
				app_access_token_obtained: !!data.access_token,
				message: "Credentials are valid",
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			res.status(500).json({
				error: {
					code: "VERIFICATION_FAILED",
					message: "Failed to verify credentials",
					details: errorMessage,
				},
			});
		}
	},
);

/**
 * POST /api/admin/instagram/update-token
 * Atualiza o token do Instagram manualmente
 */
router.post(
	"/instagram/update-token",
	async (req: Request, res: Response) => {
		try {
			const { token, expires_in_days } = req.body;

			if (!token) {
				res.status(400).json({
					error: {
						code: "TOKEN_REQUIRED",
						message: "Token is required in request body",
					},
				});
				return;
			}

			const tokenService = new InstagramTokenRefreshService();
			const daysUntilExpiry = expires_in_days || 60;
			const expiresAt = new Date(
				Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000,
			);

			// Salva o token no banco
			await tokenService.updateToken(token, expiresAt);

			res.status(200).json({
				message: "Token updated successfully",
				expires_at: expiresAt.toISOString(),
				days_until_expiry: daysUntilExpiry,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			res.status(500).json({
				error: {
					code: "TOKEN_UPDATE_FAILED",
					message: "Failed to update token",
					details: errorMessage,
				},
			});
		}
	},
);

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
