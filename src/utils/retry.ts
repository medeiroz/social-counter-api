import { logger } from "./logger";

/**
 * Configurações de retry
 */
export interface RetryOptions {
	maxAttempts?: number;
	delayMs?: number;
	backoffMultiplier?: number;
	onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
	maxAttempts: 3,
	delayMs: 1000,
	backoffMultiplier: 2,
	onRetry: (attempt: number, error: Error) => {
		logger.warn(`Retry attempt ${attempt}`, { error: error.message });
	},
};

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executa uma função com retry automático em caso de falha
 *
 * @example
 * const data = await retry(
 *   async () => axios.get('https://api.example.com'),
 *   { maxAttempts: 3, delayMs: 1000 }
 * );
 */
export async function retry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	let lastError: Error = new Error("All retry attempts failed");

	for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < opts.maxAttempts) {
				opts.onRetry(attempt, lastError);

				// Exponential backoff
				const delayTime =
					opts.delayMs * opts.backoffMultiplier ** (attempt - 1);
				await delay(delayTime);
			}
		}
	}

	// Se chegou aqui, todas as tentativas falharam
	throw lastError;
}

/**
 * Retry específico para requisições HTTP com tratamento de status codes
 */
export async function retryHttp<T>(
	fn: () => Promise<T>,
	options: RetryOptions & { retryOnStatus?: number[] } = {},
): Promise<T> {
	const retryOnStatus = options.retryOnStatus || [429, 500, 502, 503, 504];

	return retry(async () => {
		try {
			return await fn();
		} catch (error: unknown) {
			// Se for erro HTTP e o status não deve fazer retry, lança imediatamente
			if (
				typeof error === "object" &&
				error !== null &&
				"response" in error &&
				typeof error.response === "object" &&
				error.response !== null &&
				"status" in error.response &&
				typeof error.response.status === "number" &&
				!retryOnStatus.includes(error.response.status)
			) {
				throw error;
			}
			throw error;
		}
	}, options);
}
