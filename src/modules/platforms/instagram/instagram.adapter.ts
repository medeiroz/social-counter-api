import axios from "axios";
import { InstagramTokenRefreshService } from "../../../services/instagram-token-refresh.service";
import { logger } from "../../../utils/logger";
import { retry } from "../../../utils/retry";
import { BasePlatformAdapter } from "../base/platform.adapter";
import type { MetricResult, MetricType } from "../base/platform.interface";
import type {
	InstagramMetricMetadata,
	InstagramMetricType,
	InstagramPost,
	InstagramProfile,
} from "./instagram.types";

interface InstagramAPIResponse {
	data: {
		user: {
			username: string;
			full_name?: string;
			biography?: string;
			profile_pic_url?: string;
			profile_pic_url_hd?: string;
			is_verified?: boolean;
			is_private?: boolean;
			edge_followed_by?: { count: number };
			edge_follow?: { count: number };
			edge_owner_to_timeline_media?: { count: number };
		};
	};
}

interface InstagramPostAPIResponse {
	data: {
		shortcode_media: {
			id: string;
			shortcode: string;
			edge_media_preview_like?: { count: number };
			edge_media_to_comment?: { count: number };
			video_view_count?: number;
			edge_liked_by?: { count: number };
			edge_media_to_parent_comment?: { count: number };
			taken_at_timestamp?: number;
			edge_media_to_caption?: {
				edges: Array<{ node: { text: string } }>;
			};
			display_url?: string;
			owner?: {
				username: string;
				full_name?: string;
			};
		};
	};
}

export class InstagramAdapter extends BasePlatformAdapter {
	readonly platformName = "Instagram";
	readonly platformSlug = "instagram";
	private accessToken: string;
	private useGraphAPI: boolean;
	private tokenService: InstagramTokenRefreshService;

	protected supportedMetrics: InstagramMetricType[] = [
		"followers",
		"following",
		"posts_count",
		"likes",
		"comments",
		"views",
	];

	constructor() {
		super();
		this.tokenService = new InstagramTokenRefreshService();
		this.accessToken = "";
		this.useGraphAPI = false;

		// Carrega o token do banco de dados de forma assíncrona
		this.loadTokenFromDatabase();
	}

	/**
	 * Carrega o token do banco de dados
	 */
	private async loadTokenFromDatabase(): Promise<void> {
		try {
			const token = await this.tokenService.getToken();
			if (token) {
				this.accessToken = token;
				this.useGraphAPI = true;
				logger.info("[Instagram Adapter] Token loaded from database");
			} else {
				logger.warn(
					"[Instagram Adapter] No access token found, using web scraping (may be unreliable)",
				);
			}
		} catch (error) {
			logger.error(
				"[Instagram Adapter] Failed to load token from database:",
				error,
			);
			logger.warn("[Instagram Adapter] Falling back to web scraping");
		}
	}

	/**
	 * Verifica se a métrica é suportada
	 */
	supportsMetric(metric: MetricType): boolean {
		return this.supportedMetrics.includes(metric as InstagramMetricType);
	}

	/**
	 * Normaliza o username removendo @ e espaços
	 */
	protected normalizeResource(resource: string): string {
		return resource.replace(/^@/, "").trim().toLowerCase();
	}

	/**
	 * Busca dados do perfil usando Instagram Graph API
	 */
	private async fetchProfileDataGraphAPI(
		username: string,
	): Promise<InstagramProfile> {
		try {
			// Para o Graph API, precisamos do ID da conta de negócio
			// Se o username for fornecido, tentamos buscar pelo business discovery
			const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

			if (!businessAccountId) {
				throw new Error("INSTAGRAM_BUSINESS_ACCOUNT_ID not configured");
			}

			const fields =
				"id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website";
			const apiUrl = `https://graph.facebook.com/v23.0/${businessAccountId}?fields=business_discovery.username(${username}){${fields}}&access_token=${this.accessToken}`;

			console.log("Request URL", apiUrl); // Debugging line

			const response = await retry(() =>
				axios.get(apiUrl, {
					timeout: 15000,
				}),
			);

			const businessDiscovery = response.data.business_discovery;

			if (!businessDiscovery) {
				throw new Error("Business discovery data not found");
			}

			const profile: InstagramProfile = {
				username: businessDiscovery.username,
				followers: businessDiscovery.followers_count ?? 0,
				following: businessDiscovery.follows_count ?? 0,
				posts_count: businessDiscovery.media_count ?? 0,
			};

			if (businessDiscovery.name) profile.full_name = businessDiscovery.name;
			if (businessDiscovery.biography)
				profile.biography = businessDiscovery.biography;
			if (businessDiscovery.profile_picture_url)
				profile.profile_pic_url = businessDiscovery.profile_picture_url;
			if (businessDiscovery.website)
				profile.website = businessDiscovery.website;

			return profile;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorData = error.response?.data?.error;
				if (errorData) {
					logger.error(
						`Instagram Graph API Error: ${errorData.message}`,
						errorData,
					);
					throw new Error(`Instagram Graph API: ${errorData.message}`);
				}
			}

			logger.error(
				`Error fetching Instagram profile via Graph API for @${username}`,
				error,
			);
			throw new Error(`Failed to fetch Instagram profile: ${error}`);
		}
	}

	/**
	 * Busca todas as métricas de conta de uma vez (otimizado - 1 requisição)
	 */
	async getAllAccountMetrics(
		username: string,
	): Promise<Record<string, MetricResult>> {
		const normalizedUsername = this.normalizeResource(username);

		logger.info(
			`Fetching all account metrics for @${normalizedUsername} (optimized)...`,
		);

		// Usa Graph API se disponível, senão fallback para web scraping
		const profile = this.useGraphAPI
			? await this.fetchProfileDataGraphAPI(normalizedUsername)
			: await this.fetchProfileData(normalizedUsername);

		// Monta metadata uma vez para todos
		const metadata: InstagramMetricMetadata = {};
		if (profile.full_name) metadata.display_name = profile.full_name;
		if (profile.profile_pic_url) metadata.avatar_url = profile.profile_pic_url;
		if (profile.is_verified !== undefined)
			metadata.verified = profile.is_verified;
		if (profile.is_private !== undefined)
			metadata.is_private = profile.is_private;
		if (profile.biography) metadata.biography = profile.biography;
		if (profile.website) metadata.external_url = profile.website;

		return {
			followers: {
				metric: "followers",
				value: BigInt(profile.followers),
				metadata: { ...metadata },
			},
			following: {
				metric: "following",
				value: BigInt(profile.following),
				metadata: { ...metadata },
			},
			posts_count: {
				metric: "posts_count",
				value: BigInt(profile.posts_count),
				metadata: { ...metadata },
			},
		};
	}

	/**
	 * Busca dados do perfil do Instagram via API interna (fallback)
	 */
	private async fetchProfileData(username: string): Promise<InstagramProfile> {
		// Tenta primeiro a API interna do Instagram
		const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

		try {
			const response = await retry(() =>
				axios.get(apiUrl, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						"x-ig-app-id": "936619743392459",
						Accept: "*/*",
						"Accept-Language": "en-US,en;q=0.9",
						Referer: `https://www.instagram.com/${username}/`,
					},
					timeout: 15000,
				}),
			);

			const data = response.data as InstagramAPIResponse;

			if (!data?.data?.user) {
				logger.error(
					"Invalid Instagram API response:",
					JSON.stringify(data, null, 2),
				);
				throw new Error("Invalid API response structure");
			}
			const user = data.data.user;

			const profile: InstagramProfile = {
				username: typeof user.username === "string" ? user.username : username,
				followers: user.edge_followed_by?.count ?? 0,
				following: user.edge_follow?.count ?? 0,
				posts_count: user.edge_owner_to_timeline_media?.count ?? 0,
			};

			if (user.full_name) profile.full_name = user.full_name;
			if (user.biography) profile.biography = user.biography;
			if (user.profile_pic_url_hd)
				profile.profile_pic_url = user.profile_pic_url_hd;
			else if (user.profile_pic_url)
				profile.profile_pic_url = user.profile_pic_url;
			if (user.is_verified !== undefined)
				profile.is_verified = user.is_verified;
			if (user.is_private !== undefined) profile.is_private = user.is_private;

			return profile;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 404) {
					throw new Error(`Instagram user @${username} not found`);
				}
				if (error.response?.status === 429) {
					throw new Error("Rate limited by Instagram. Please try again later.");
				}
			}

			logger.error(`Error fetching Instagram profile for @${username}`, error);
			throw new Error(`Failed to fetch Instagram profile: ${error}`);
		}
	}

	/**
	 * Busca todas as métricas de um post de uma vez (otimizado - 1 requisição)
	 */
	async getAllPostMetrics(
		postIdentifier: string,
	): Promise<Record<string, MetricResult>> {
		const shortcode = this.extractShortcode(postIdentifier);

		logger.info(
			`Fetching all post metrics for shortcode '${shortcode}' (optimized)...`,
		);

		const post = await this.fetchPostData(shortcode);

		// Monta metadata uma vez para todos
		const metadata: InstagramMetricMetadata = {};
		if (post.shortcode) metadata.post_shortcode = post.shortcode;
		if (post.id) metadata.post_id = post.id;
		if (post.caption) metadata.post_caption = post.caption;
		if (post.thumbnail) metadata.post_thumbnail = post.thumbnail;
		if (post.timestamp) metadata.post_timestamp = post.timestamp;
		if (post.owner?.username) metadata.display_name = post.owner.username;
		if (post.likesCount !== undefined) metadata.like_count = post.likesCount;
		if (post.commentsCount !== undefined)
			metadata.comment_count = post.commentsCount;
		if (post.viewsCount !== undefined) metadata.view_count = post.viewsCount;

		return {
			likes: {
				metric: "likes",
				value: BigInt(post.likesCount ?? 0),
				metadata: { ...metadata },
			},
			comments: {
				metric: "comments",
				value: BigInt(post.commentsCount ?? 0),
				metadata: { ...metadata },
			},
			views: {
				metric: "views",
				value: BigInt(post.viewsCount ?? 0),
				metadata: { ...metadata },
			},
		};
	}

	/**
	 * Busca dados de um post específico do Instagram
	 */
	private async fetchPostData(shortcode: string): Promise<InstagramPost> {
		try {
			logger.info(
				`Fetching Instagram post data for shortcode '${shortcode}'...`,
			);

			const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

			const response = await retry(
				() =>
					axios.get(apiUrl, {
						timeout: 10000,
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
							"x-ig-app-id": "936619743392459",
						},
					}),
				{ maxAttempts: 3, delayMs: 1000 },
			);

			const data = response.data as InstagramPostAPIResponse;

			if (!data?.data?.shortcode_media) {
				throw new Error("Invalid API response structure for post");
			}

			const post = data.data.shortcode_media;

			const postData: InstagramPost = {
				id: post.id,
				shortcode: post.shortcode,
			};

			if (post.edge_media_preview_like?.count !== undefined)
				postData.likesCount = post.edge_media_preview_like.count;
			else if (post.edge_liked_by?.count !== undefined)
				postData.likesCount = post.edge_liked_by.count;

			if (post.edge_media_to_comment?.count !== undefined)
				postData.commentsCount = post.edge_media_to_comment.count;
			else if (post.edge_media_to_parent_comment?.count !== undefined)
				postData.commentsCount = post.edge_media_to_parent_comment.count;

			if (post.video_view_count !== undefined)
				postData.viewsCount = post.video_view_count;

			if (post.display_url) postData.thumbnail = post.display_url;

			if (post.edge_media_to_caption?.edges?.[0]?.node?.text)
				postData.caption = post.edge_media_to_caption.edges[0].node.text;

			if (post.taken_at_timestamp)
				postData.timestamp = new Date(
					post.taken_at_timestamp * 1000,
				).toISOString();

			if (post.owner?.username) {
				postData.owner = {
					username: post.owner.username,
				};
				if (post.owner.full_name)
					postData.owner.full_name = post.owner.full_name;
			}

			logger.info(
				`Successfully fetched Instagram post: ${postData.shortcode} (${postData.likesCount || 0} likes)`,
			);

			return postData;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 404) {
					throw new Error(`Instagram post '${shortcode}' not found`);
				}
				if (error.response?.status === 429) {
					throw new Error("Rate limited by Instagram. Please try again later.");
				}
			}

			logger.error(`Error fetching Instagram post '${shortcode}'`, error);
			throw new Error(
				`Failed to fetch Instagram post: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Extrai shortcode de uma URL ou retorna o shortcode diretamente
	 */
	private extractShortcode(input: string): string {
		// Se já é um shortcode (sem / ou http), retorna direto
		if (!/[/:]/.test(input)) {
			return input;
		}

		// Padrões de URL do Instagram
		const patterns = [
			/instagram\.com\/p\/([A-Za-z0-9_-]+)/,
			/instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
			/instagram\.com\/reels\/([A-Za-z0-9_-]+)/,
		];

		for (const pattern of patterns) {
			const match = input.match(pattern);
			if (match?.[1]) {
				return match[1];
			}
		}

		// Se não encontrou, assume que é um shortcode inválido
		throw new Error(`Invalid Instagram post URL or shortcode: ${input}`);
	}

	/**
	 * Busca uma métrica específica
	 */
	protected async fetchMetric(
		resource: string,
		metric: MetricType,
	): Promise<MetricResult> {
		if (!this.supportsMetric(metric)) {
			throw new Error(
				`Metric '${metric}' is not supported for Instagram. Supported metrics: ${this.supportedMetrics.join(", ")}`,
			);
		}

		// Métricas de post
		const postMetrics: InstagramMetricType[] = ["likes", "comments", "views"];

		if (postMetrics.includes(metric as InstagramMetricType)) {
			logger.info(
				`Fetching Instagram post metric '${metric}' for '${resource}'...`,
			);

			const shortcode = this.extractShortcode(resource);
			const post = await this.fetchPostData(shortcode);

			// Determina o valor da métrica
			let metricValue: number;
			switch (metric) {
				case "likes":
					metricValue = post.likesCount || 0;
					break;
				case "comments":
					metricValue = post.commentsCount || 0;
					break;
				case "views":
					metricValue = post.viewsCount || 0;
					break;
				default:
					throw new Error(`Unsupported post metric: ${metric}`);
			}

			// Monta metadata
			const metadata: InstagramMetricMetadata = {};

			if (post.shortcode) metadata.post_shortcode = post.shortcode;
			if (post.id) metadata.post_id = post.id;
			if (post.caption) metadata.post_caption = post.caption;
			if (post.thumbnail) metadata.post_thumbnail = post.thumbnail;
			if (post.timestamp) metadata.post_timestamp = post.timestamp;
			if (post.owner?.username) metadata.display_name = post.owner.username;
			if (post.likesCount !== undefined) metadata.like_count = post.likesCount;
			if (post.commentsCount !== undefined)
				metadata.comment_count = post.commentsCount;
			if (post.viewsCount !== undefined) metadata.view_count = post.viewsCount;

			return {
				metric,
				value: BigInt(metricValue),
				metadata,
			};
		}

		// Métricas de conta
		const username = this.normalizeResource(resource);

		logger.info(
			`Fetching Instagram metric '${metric}' for user @${username}...`,
		);

		// Usa Graph API se disponível, senão fallback para web scraping
		const profile = this.useGraphAPI
			? await this.fetchProfileDataGraphAPI(username)
			: await this.fetchProfileData(username);

		// Mapeia métricas para campos do profile
		const metricMap: Record<string, number> = {
			followers: profile.followers,
			following: profile.following,
			posts_count: profile.posts_count,
		};

		const value = metricMap[metric];

		if (value === undefined) {
			throw new Error(
				`Metric '${metric}' is not available for Instagram accounts`,
			);
		}

		// Monta metadata
		const metadata: InstagramMetricMetadata = {};

		if (profile.full_name) metadata.display_name = profile.full_name;
		if (profile.profile_pic_url) metadata.avatar_url = profile.profile_pic_url;
		if (profile.is_verified !== undefined)
			metadata.verified = profile.is_verified;
		if (profile.is_private !== undefined)
			metadata.is_private = profile.is_private;
		if (profile.biography) metadata.biography = profile.biography;

		return {
			metric,
			value: BigInt(value),
			metadata,
		};
	}
}
