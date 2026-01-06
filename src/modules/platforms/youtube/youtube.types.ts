export interface YouTubeChannel {
	id: string;
	title: string;
	description?: string;
	customUrl?: string;
	thumbnail?: string;
	subscriberCount: number;
	videoCount: number;
	viewCount: number;
	hiddenSubscriberCount?: boolean;
}

export interface YouTubeMetricMetadata {
	channel_name?: string;
	channel_id?: string;
	thumbnail?: string;
	custom_url?: string;
	description?: string;
	verified?: boolean;
	video_title?: string;
	video_id?: string;
	published_at?: string;
	[key: string]: unknown;
}

export interface YouTubeVideo {
	id: string;
	title: string;
	description?: string;
	thumbnail?: string;
	viewCount: number;
	likeCount?: number;
	commentCount?: number;
	publishedAt?: string;
	channelId?: string;
	channelTitle?: string;
}

export type YouTubeMetricType =
	| "subscribers"
	| "video_count"
	| "total_views"
	| "views"
	| "likes"
	| "comments";
