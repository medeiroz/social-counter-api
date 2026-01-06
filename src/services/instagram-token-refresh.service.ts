import type { PrismaClient } from "@prisma/client";
import axios from "axios";
import { prisma } from "../lib/prisma";

interface TokenRefreshResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
}

export class InstagramTokenRefreshService {
	private readonly appId: string;
	private readonly appSecret: string;
	private readonly prisma: PrismaClient;

	// Cache em memória do token
	private static tokenCache: {
		token: string | null;
		expiresAt: Date | null;
		lastFetch: Date | null;
	} = {
		token: null,
		expiresAt: null,
		lastFetch: null,
	};
	private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

	constructor() {
		this.appId = process.env.INSTAGRAM_APP_ID || "";
		this.appSecret = process.env.INSTAGRAM_APP_SECRET || "";
		this.prisma = prisma;

		if (!this.appId || !this.appSecret) {
			console.warn(
				"⚠️  Instagram App ID or Secret not configured. Token auto-refresh disabled.",
			);
		}
	}

	/**
	 * Verifica se o cache está válido
	 */
	private isCacheValid(): boolean {
		const { lastFetch } = InstagramTokenRefreshService.tokenCache;

		if (!lastFetch) return false;

		const now = new Date();
		const cacheAge = now.getTime() - lastFetch.getTime();

		return cacheAge < InstagramTokenRefreshService.CACHE_TTL;
	}

	/**
	 * Busca o token atual do banco de dados (com cache)
	 */
	private async getCurrentToken(): Promise<string | null> {
		// Retorna do cache se válido
		if (this.isCacheValid() && InstagramTokenRefreshService.tokenCache.token) {
			return InstagramTokenRefreshService.tokenCache.token;
		}

		// Busca do banco
		const tokenRecord = await this.prisma.platformToken.findUnique({
			where: { platform: "instagram" },
		});

		// Atualiza cache
		InstagramTokenRefreshService.tokenCache = {
			token: tokenRecord?.token || null,
			expiresAt: tokenRecord?.expiresAt || null,
			lastFetch: new Date(),
		};

		return tokenRecord?.token || null;
	}

	/**
	 * Obtém informações detalhadas do token
	 */
	async getTokenInfo(): Promise<{
		token: string | null;
		expiresAt: Date | null;
		createdAt: Date | null;
		updatedAt: Date | null;
	}> {
		const tokenRecord = await this.prisma.platformToken.findUnique({
			where: { platform: "instagram" },
		});

		return {
			token: tokenRecord?.token || null,
			expiresAt: tokenRecord?.expiresAt || null,
			createdAt: tokenRecord?.createdAt || null,
			updatedAt: tokenRecord?.updatedAt || null,
		};
	}

	/**
	 * Verifica se o token está próximo de expirar (com cache)
	 */
	async isTokenExpiringSoon(): Promise<boolean> {
		// Se tem cache válido, usa do cache
		if (
			this.isCacheValid() &&
			InstagramTokenRefreshService.tokenCache.expiresAt
		) {
			const now = new Date();
			const expiresAt = InstagramTokenRefreshService.tokenCache.expiresAt;
			const daysUntilExpiry = Math.floor(
				(expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			);
			return daysUntilExpiry <= 15;
		}

		// Busca do banco
		const tokenRecord = await this.prisma.platformToken.findUnique({
			where: { platform: "instagram" },
		});

		if (!tokenRecord) {
			// Se não tem registro, assume que precisa renovar
			return true;
		}

		// Atualiza cache
		InstagramTokenRefreshService.tokenCache = {
			token: tokenRecord.token,
			expiresAt: tokenRecord.expiresAt,
			lastFetch: new Date(),
		};

		const now = new Date();
		const expiresAt = new Date(tokenRecord.expiresAt);
		const daysUntilExpiry = Math.floor(
			(expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);

		// Renova se faltar menos de 15 dias para expirar
		return daysUntilExpiry <= 15;
	}

	/**
	 * Troca o token atual por um novo long-lived token
	 */
	async refreshToken(): Promise<string> {
		if (!this.appId || !this.appSecret) {
			throw new Error(
				"Instagram App ID and Secret are required for token refresh",
			);
		}

		const currentToken = await this.getCurrentToken();

		if (!currentToken) {
			throw new Error("No Instagram access token found to refresh");
		}

		try {
			console.log("🔄 Refreshing Instagram access token...");

			const response = await axios.get<TokenRefreshResponse>(
				"https://graph.facebook.com/v23.0/oauth/access_token",
				{
					params: {
						grant_type: "fb_exchange_token",
						client_id: this.appId,
						client_secret: this.appSecret,
						fb_exchange_token: currentToken,
					},
				},
			);

			const newToken = response.data.access_token;
			const expiresIn = response.data.expires_in || 60 * 24 * 60 * 60; // 60 dias em segundos
			const expiresAt = new Date(Date.now() + expiresIn * 1000);

			// Atualiza o token no banco de dados
			await this.prisma.platformToken.upsert({
				where: { platform: "instagram" },
				update: {
					token: newToken,
					expiresAt: expiresAt,
					updatedAt: new Date(),
				},
				create: {
					platform: "instagram",
					token: newToken,
					expiresAt: expiresAt,
				},
			});

			// Invalida cache após atualização
			InstagramTokenRefreshService.tokenCache = {
				token: newToken,
				expiresAt: expiresAt,
				lastFetch: new Date(),
			};

			console.log("✅ Instagram access token refreshed successfully");
			console.log(`📅 New token expires at: ${expiresAt.toISOString()}`);

			return newToken;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorMessage =
					error.response?.data?.error?.message || error.message;
				throw new Error(`Failed to refresh Instagram token: ${errorMessage}`);
			}
			throw error;
		}
	}

	/**
	 * Obtém o token do Instagram (do banco ou do .env como fallback)
	 */
	async getToken(): Promise<string | null> {
		// Tenta buscar do banco primeiro
		const dbToken = await this.getCurrentToken();
		if (dbToken) {
			return dbToken;
		}

		// Fallback para .env
		const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
		if (envToken) {
			console.log("⚠️  Using token from .env (consider migrating to database)");

			// Migra o token do .env para o banco
			try {
				const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 dias
				await this.prisma.platformToken.create({
					data: {
						platform: "instagram",
						token: envToken,
						expiresAt: expiresAt,
					},
				});

				// Atualiza cache após migração
				InstagramTokenRefreshService.tokenCache = {
					token: envToken,
					expiresAt: expiresAt,
					lastFetch: new Date(),
				};

				console.log("✅ Token migrated from .env to database");
			} catch (error) {
				console.error("❌ Failed to migrate token to database:", error);
			}

			return envToken;
		}

		return null;
	}

	/**
	 * Verifica e renova o token se necessário
	 */
	async checkAndRefreshIfNeeded(): Promise<void> {
		if (!this.appId || !this.appSecret) {
			console.log(
				"⏭️  Skipping token refresh check (credentials not configured)",
			);
			return;
		}

		const expiringSoon = await this.isTokenExpiringSoon();

		if (expiringSoon) {
			console.log("⚠️  Token is expiring soon, refreshing...");
			await this.refreshToken();
		} else {
			console.log("✅ Token is still valid");
		}
	}

	/**
	 * Inicia verificação periódica do token (a cada 24 horas)
	 */
	startPeriodicCheck(): void {
		if (!this.appId || !this.appSecret) {
			console.log(
				"⏭️  Token auto-refresh disabled (credentials not configured)",
			);
			return;
		}

		console.log("🚀 Starting Instagram token periodic check (every 24 hours)");

		// Verifica imediatamente na inicialização
		this.checkAndRefreshIfNeeded().catch((error) => {
			console.error("❌ Failed to check/refresh token on startup:", error);
		});

		// Verifica a cada 24 horas
		const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

		setInterval(async () => {
			try {
				await this.checkAndRefreshIfNeeded();
			} catch (error) {
				console.error("❌ Failed to check/refresh token:", error);
			}
		}, CHECK_INTERVAL);
	}
}
