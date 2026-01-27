import { cleanup } from "../modules/cache/cache.service";
import { logger } from "../utils/logger";

export class CacheCleanupJob {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;
	private cleanupIntervalMs = 5 * 60 * 1000; // 5 minutos
	private isCleanupRunning = false;

	start() {
		if (this.isRunning) {
			logger.warn("[CacheCleanupJob] Already running");
			return;
		}
		logger.info("[CacheCleanupJob] Starting cache cleanup job...");
		this.isRunning = true;
		this.runCleanup();
		this.intervalId = setInterval(() => {
			this.runCleanup();
		}, this.cleanupIntervalMs);
		logger.info(
			`[CacheCleanupJob] Cache cleanup job started (interval: ${this.cleanupIntervalMs / 1000}s)`,
		);
	}

	stop() {
		if (!this.isRunning) return;
		logger.info("[CacheCleanupJob] Stopping cache cleanup job...");
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
		logger.info("[CacheCleanupJob] Cache cleanup job stopped");
	}

	private async runCleanup() {
		if (this.isCleanupRunning) {
			logger.warn(
				"[CacheCleanupJob] Cleanup already in progress, skipping this run",
			);
			return;
		}
		this.isCleanupRunning = true;
		try {
			const removed = await cleanup();
			logger.info(`[CacheCleanupJob] Removed ${removed} expired cache entries`);
		} catch (error) {
			logger.error("[CacheCleanupJob] Error during cleanup", error);
		} finally {
			this.isCleanupRunning = false;
		}
	}
}

export const cacheCleanupJob = new CacheCleanupJob();
