/**
 * Extrai o ID limpo de um recurso, removendo URLs, @, etc.
 */

/**
 * Extrai o ID do vídeo do YouTube de uma URL ou retorna o ID se já for um ID
 * Exemplos:
 * - https://www.youtube.com/watch?v=h_z35D5D5KU -> h_z35D5D5KU
 * - https://youtu.be/h_z35D5D5KU -> h_z35D5D5KU
 * - h_z35D5D5KU -> h_z35D5D5KU
 */
export function extractYouTubeVideoId(input: string): string {
	const cleanInput = input.trim();

	// Se já é um ID (11 caracteres), retorna
	if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
		return cleanInput;
	}

	// URL do tipo: https://www.youtube.com/watch?v=VIDEO_ID
	const watchMatch = cleanInput.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
	if (watchMatch?.[1]) {
		return watchMatch[1];
	}

	// URL do tipo: https://youtu.be/VIDEO_ID
	const shortMatch = cleanInput.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
	if (shortMatch?.[1]) {
		return shortMatch[1];
	}

	// Se não conseguiu extrair, retorna o input original
	return cleanInput;
}

/**
 * Extrai o ID ou handle do canal do YouTube de uma URL ou retorna o input se já for um ID/handle
 * Exemplos:
 * - https://www.youtube.com/@manualdomundo -> manualdomundo
 * - https://www.youtube.com/channel/UC42jlbI7ByS9naW7xlZthBA -> UC42jlbI7ByS9naW7xlZthBA
 * - @manualdomundo -> manualdomundo
 * - UC42jlbI7ByS9naW7xlZthBA -> UC42jlbI7ByS9naW7xlZthBA
 */
export function extractYouTubeChannelId(input: string): string {
	const cleanInput = input.trim();

	// URL do tipo: https://www.youtube.com/@handle
	const handleMatch = cleanInput.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
	if (handleMatch?.[1]) {
		return handleMatch[1];
	}

	// URL do tipo: https://www.youtube.com/channel/CHANNEL_ID
	const channelMatch = cleanInput.match(
		/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
	);
	if (channelMatch?.[1]) {
		return channelMatch[1];
	}

	// Remove @ se tiver
	const withoutAt = cleanInput.replace(/^@/, "");

	return withoutAt;
}

/**
 * Extrai o username do Instagram de uma URL ou retorna o input se já for um username
 * Exemplos:
 * - https://www.instagram.com/belave.clinica/ -> belave.clinica
 * - @belave.clinica -> belave.clinica
 * - belave.clinica -> belave.clinica
 */
export function extractInstagramUsername(input: string): string {
	const cleanInput = input.trim();

	// URL do tipo: https://www.instagram.com/username/
	const urlMatch = cleanInput.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	// Remove @ se tiver
	const withoutAt = cleanInput.replace(/^@/, "");

	return withoutAt;
}

/**
 * Extrai o ID de um post do Instagram de uma URL ou retorna o input se já for um ID
 * Exemplos:
 * - https://www.instagram.com/p/DS_NQUOgVJ9/ -> DS_NQUOgVJ9
 * - DS_NQUOgVJ9 -> DS_NQUOgVJ9
 */
export function extractInstagramPostId(input: string): string {
	const cleanInput = input.trim();

	// URL do tipo: https://www.instagram.com/p/POST_ID/
	const urlMatch = cleanInput.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	return cleanInput;
}

/**
 * Detecta automaticamente o tipo de recurso e extrai o ID limpo
 * Suporta: YouTube (vídeo e canal) e Instagram (perfil e post)
 *
 * @param input - URL, username, ID de vídeo, etc
 * @returns ID limpo do recurso
 */
export function extractResourceId(input: string): string {
	const cleanInput = input.trim();

	// YouTube Video
	if (
		cleanInput.includes("youtube.com/watch") ||
		cleanInput.includes("youtu.be/") ||
		/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)
	) {
		return extractYouTubeVideoId(cleanInput);
	}

	// YouTube Channel
	if (
		cleanInput.includes("youtube.com/@") ||
		cleanInput.includes("youtube.com/channel/") ||
		cleanInput.startsWith("UC") ||
		cleanInput.startsWith("@")
	) {
		return extractYouTubeChannelId(cleanInput);
	}

	// Instagram Post
	if (cleanInput.includes("instagram.com/p/")) {
		return extractInstagramPostId(cleanInput);
	}

	// Instagram Profile (URL ou username)
	if (
		cleanInput.includes("instagram.com/") ||
		cleanInput.startsWith("@") ||
		/^[a-zA-Z0-9._]+$/.test(cleanInput)
	) {
		return extractInstagramUsername(cleanInput);
	}

	// Se não reconheceu, retorna o input original limpo
	return cleanInput.replace(/^@/, "");
}
