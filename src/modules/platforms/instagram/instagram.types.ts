export interface InstagramProfile {
	username: string;
	full_name?: string;
	biography?: string;
	profile_pic_url?: string;
	is_verified?: boolean;
	is_private?: boolean;
	followers: number;
	following: number;
	posts_count: number;
	website?: string;
}

export interface InstagramPost {
	id: string;
	shortcode: string;
	caption?: string;
	thumbnail?: string;
	likesCount?: number;
	commentsCount?: number;
	viewsCount?: number;
	timestamp?: string;
	owner?: {
		username: string;
		full_name?: string;
	};
}

export interface InstagramMetricMetadata {
	display_name?: string;
	avatar_url?: string;
	verified?: boolean;
	is_private?: boolean;
	biography?: string;
	external_url?: string;
	post_shortcode?: string;
	post_id?: string;
	post_caption?: string;
	post_thumbnail?: string;
	post_timestamp?: string;
	[key: string]: unknown;
}

export type InstagramMetricType =
	| "followers"
	| "following"
	| "posts_count"
	| "likes"
	| "comments"
	| "views";
