import axios from "axios";
import { logger } from "../../../utils/logger";
import { retry } from "../../../utils/retry";
import { BasePlatformAdapter } from "../base/platform.adapter";
import type { MetricResult, MetricType } from "../base/platform.interface";
import type {
	YouTubeChannel,
	YouTubeMetricMetadata,
	YouTubeMetricType,
	YouTubeVideo,
} from "./youtube.types";

interface YouTubeAPIResponse {
	items?: Array<{
		id: string;
		snippet: {
			title: string;
			description?: string;
			customUrl?: string;
			thumbnails?: {
				default?: { url: string };
				medium?: { url: string };
				high?: { url: string };
			};
		};
		statistics: {
			subscriberCount?: string;
			videoCount?: string;
			viewCount?: string;
			hiddenSubscriberCount?: boolean;
		};
	}>;
}

export class YouTubeAdapter extends BasePlatformAdapter {
	readonly platformName = "YouTube";
	readonly platformSlug = "youtube";

	protected supportedMetrics: YouTubeMetricType[] = [
		"subscribers",
		"video_count",
		"total_views",
		"views",
		"likes",
		"comments",
	];

	/**
	 * Verifica se a métrica é suportada
	 */
	supportsMetric(metric: MetricType): boolean {
		return this.supportedMetrics.includes(metric as YouTubeMetricType);
	}

	/**
	 * Normaliza o channel ID/handle removendo @ e espaços
	 */
	protected normalizeResource(resource: string): string {
		return resource.replace(/^@/, "").trim();
	}

	/**
	 * Busca dados do canal do YouTube via API pública
	 * Requer YouTube API Key configurada
	 */
	private async fetchChannelData(
		channelIdentifier: string,
	): Promise<YouTubeChannel> {
		const apiKey = process.env.YOUTUBE_API_KEY;

		if (!apiKey) {
			throw new Error(
				"YouTube API Key not configured. Set YOUTUBE_API_KEY in .env file",
			);
		}

		// Remove @ se existir
		const cleanIdentifier = channelIdentifier.replace(/^@/, "").trim();

		// Detecta se é channel ID ou handle
		const isChannelId = cleanIdentifier.startsWith("UC");

		let apiUrl: string;
		if (isChannelId) {
			apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${cleanIdentifier}&key=${apiKey}`;
		} else {
			// Para handles, tenta primeiro com forHandle e se falhar com forUsername
			apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${cleanIdentifier}&key=${apiKey}`;
		}

		try {
			let response = await retry(
				() =>
					axios.get(apiUrl, {
						timeout: 15000,
					}),
				{ maxAttempts: 2, delayMs: 500 },
			);

			let data = response.data as YouTubeAPIResponse;

			// Se não encontrou com forHandle, tenta com forUsername
			if ((!data.items || data.items.length === 0) && !isChannelId) {
				logger.info(
					`Handle not found with forHandle, trying forUsername for '${cleanIdentifier}'`,
				);
				const fallbackUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${cleanIdentifier}&key=${apiKey}`;
				response = await retry(
					() =>
						axios.get(fallbackUrl, {
							timeout: 15000,
						}),
					{ maxAttempts: 2, delayMs: 500 },
				);
				data = response.data as YouTubeAPIResponse;
			}

			if (!data.items || data.items.length === 0) {
				throw new Error(`YouTube channel '${channelIdentifier}' not found`);
			}

			const channel = data.items[0];
			if (!channel) {
				throw new Error(`YouTube channel '${channelIdentifier}' not found`);
			}

			const stats = channel.statistics;

			const channelData: YouTubeChannel = {
				id: channel.id,
				title: channel.snippet.title,
				subscriberCount: Number.parseInt(stats.subscriberCount || "0", 10),
				videoCount: Number.parseInt(stats.videoCount || "0", 10),
				viewCount: Number.parseInt(stats.viewCount || "0", 10),
			};

			if (channel.snippet.description)
				channelData.description = channel.snippet.description;
			if (channel.snippet.customUrl)
				channelData.customUrl = channel.snippet.customUrl;
			if (channel.snippet.thumbnails?.high?.url)
				channelData.thumbnail = channel.snippet.thumbnails.high.url;
			else if (channel.snippet.thumbnails?.medium?.url)
				channelData.thumbnail = channel.snippet.thumbnails.medium.url;
			if (stats.hiddenSubscriberCount !== undefined)
				channelData.hiddenSubscriberCount = stats.hiddenSubscriberCount;

			logger.info(
				`Successfully fetched YouTube channel: ${channel.snippet.title} (${channelData.subscriberCount} subscribers)`,
			);

			return channelData;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorData = error.response?.data as
					| { error?: { message?: string; code?: number } }
					| undefined;
				const errorMessage = errorData?.error?.message || error.message;

				if (error.response?.status === 404) {
					throw new Error(`YouTube channel '${channelIdentifier}' not found`);
				}
				if (error.response?.status === 403) {
					throw new Error(
						`YouTube API error: ${errorMessage}. Check your YOUTUBE_API_KEY and quota.`,
					);
				}
				if (error.response?.status === 400) {
					throw new Error(`Invalid YouTube request: ${errorMessage}`);
				}
			}

			logger.error(
				`Error fetching YouTube channel for '${channelIdentifier}'`,
				error,
			);
			throw new Error(
				`Failed to fetch YouTube channel: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Extrai ID do vídeo de uma URL ou retorna o ID diretamente
	 */
	private extractVideoId(input: string): string {
		// Se já é um ID (11 caracteres), retorna direto
		if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
			return input;
		}

		// Padrões de URL do YouTube
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
		];

		for (const pattern of patterns) {
			const match = input.match(pattern);
			if (match?.[1]) {
				return match[1];
			}
		}

		// Se não encontrou, assume que é um ID inválido
		throw new Error(`Invalid YouTube video ID or URL: ${input}`);
	}

	/**
	 * Busca dados de um vídeo específico do YouTube
	 */
	private async fetchVideoData(videoIdentifier: string): Promise<YouTubeVideo> {
		const apiKey = process.env.YOUTUBE_API_KEY;

		if (!apiKey) {
			throw new Error(
				"YouTube API Key not configured. Set YOUTUBE_API_KEY in .env file",
			);
		}

		const videoId = this.extractVideoId(videoIdentifier);
		const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;

		try {
			const response = await retry(
				() =>
					axios.get(apiUrl, {
						timeout: 15000,
					}),
				{ maxAttempts: 2, delayMs: 500 },
			);

			const data = response.data as {
				items?: Array<{
					id: string;
					snippet: {
						title: string;
						description?: string;
						thumbnails?: {
							default?: { url: string };
							medium?: { url: string };
							high?: { url: string };
						};
						publishedAt?: string;
						channelId?: string;
						channelTitle?: string;
					};
					statistics: {
						viewCount?: string;
						likeCount?: string;
						commentCount?: string;
					};
				}>;
			};

			if (!data.items || data.items.length === 0) {
				throw new Error(`YouTube video '${videoIdentifier}' not found`);
			}

			const video = data.items[0];
			if (!video) {
				throw new Error(`YouTube video '${videoIdentifier}' not found`);
			}

			const stats = video.statistics;

			const videoData: YouTubeVideo = {
				id: video.id,
				title: video.snippet.title,
				viewCount: Number.parseInt(stats.viewCount || "0", 10),
			};

			if (video.snippet.description)
				videoData.description = video.snippet.description;
			if (video.snippet.thumbnails?.high?.url)
				videoData.thumbnail = video.snippet.thumbnails.high.url;
			else if (video.snippet.thumbnails?.medium?.url)
				videoData.thumbnail = video.snippet.thumbnails.medium.url;
			if (stats.likeCount)
				videoData.likeCount = Number.parseInt(stats.likeCount, 10);
			if (stats.commentCount)
				videoData.commentCount = Number.parseInt(stats.commentCount, 10);
			if (video.snippet.publishedAt)
				videoData.publishedAt = video.snippet.publishedAt;
			if (video.snippet.channelId)
				videoData.channelId = video.snippet.channelId;
			if (video.snippet.channelTitle)
				videoData.channelTitle = video.snippet.channelTitle;

			logger.info(
				`Successfully fetched YouTube video: ${video.snippet.title} (${videoData.viewCount} views)`,
			);

			return videoData;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorData = error.response?.data as {
					error?: { message?: string; code?: number };
				};
				const errorMessage = errorData?.error?.message || error.message;

				if (error.response?.status === 404) {
					throw new Error(`YouTube video '${videoIdentifier}' not found`);
				}
				if (error.response?.status === 403) {
					throw new Error(
						`YouTube API error: ${errorMessage}. Check your YOUTUBE_API_KEY and quota.`,
					);
				}
				if (error.response?.status === 400) {
					throw new Error(`Invalid YouTube request: ${errorMessage}`);
				}
			}

			logger.error(
				`Error fetching YouTube video for '${videoIdentifier}'`,
				error,
			);
			throw new Error(
				`Failed to fetch YouTube video: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Obtém uma métrica específica
	 */
	protected async fetchMetric(
		resourceIdentifier: string,
		metric: MetricType,
	): Promise<MetricResult> {
		// Se a métrica é de vídeo, busca dados do vídeo
		const videoMetrics: YouTubeMetricType[] = ["views", "likes", "comments"];

		if (videoMetrics.includes(metric as YouTubeMetricType)) {
			logger.info(
				`Fetching YouTube video metric '${metric}' for '${resourceIdentifier}'...`,
			);

			const video = await this.fetchVideoData(resourceIdentifier);

			// Determina o valor da métrica
			let metricValue: number;
			switch (metric) {
				case "views":
					metricValue = video.viewCount;
					break;
				case "likes":
					metricValue = video.likeCount || 0;
					break;
				case "comments":
					metricValue = video.commentCount || 0;
					break;
				default:
					throw new Error(`Unsupported video metric: ${metric}`);
			}

			// Monta metadata
			const metadata: YouTubeMetricMetadata = {};

			if (video.title) metadata.video_title = video.title;
			if (video.id) metadata.video_id = video.id;
			if (video.thumbnail) metadata.thumbnail = video.thumbnail;
			if (video.description) metadata.description = video.description;
			if (video.publishedAt) metadata.published_at = video.publishedAt;
			if (video.channelId) metadata.channel_id = video.channelId;
			if (video.channelTitle) metadata.channel_name = video.channelTitle;
			if (video.likeCount) metadata.like_count = video.likeCount;
			if (video.commentCount) metadata.comment_count = video.commentCount;
			if (video.viewCount) metadata.view_count = video.viewCount;

			return {
				metric,
				value: BigInt(metricValue),
				metadata,
			};
		}

		// Para outras métricas, busca dados do canal
		const normalizedChannel = this.normalizeResource(resourceIdentifier);

		logger.info(
			`Fetching YouTube metric '${metric}' for channel '${normalizedChannel}'...`,
		);

		const channel = await this.fetchChannelData(normalizedChannel);

		// Extrai o valor da métrica solicitada
		const metricMap: Record<string, number> = {
			subscribers: channel.subscriberCount,
			video_count: channel.videoCount,
			total_views: channel.viewCount,
		};

		const value = metricMap[metric];

		if (value === undefined) {
			throw new Error(
				`Metric '${metric}' is not supported for YouTube channels`,
			);
		}

		// Monta metadata
		const metadata: YouTubeMetricMetadata = {};

		if (channel.title) metadata.channel_name = channel.title;
		if (channel.id) metadata.channel_id = channel.id;
		if (channel.thumbnail) metadata.thumbnail = channel.thumbnail;
		if (channel.customUrl) metadata.custom_url = channel.customUrl;
		if (channel.description) metadata.description = channel.description;
		if (channel.hiddenSubscriberCount !== undefined)
			metadata.hidden_subscribers = channel.hiddenSubscriberCount;

		return {
			metric,
			value: BigInt(value),
			metadata,
		};
	}
}
