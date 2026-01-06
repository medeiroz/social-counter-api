/**
 * Logger simples para v1 (console)
 * Na v2 pode ser substituído por Winston ou Pino
 */

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
	private isDevelopment = process.env.NODE_ENV !== "production";

	private log(level: LogLevel, message: string, meta?: unknown): void {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

		if (level === "error") {
			console.error(prefix, message, meta || "");
		} else if (level === "warn") {
			console.warn(prefix, message, meta || "");
		} else if (level === "debug" && this.isDevelopment) {
			console.debug(prefix, message, meta || "");
		} else {
			console.log(prefix, message, meta || "");
		}
	}

	info(message: string, meta?: unknown): void {
		this.log("info", message, meta);
	}

	warn(message: string, meta?: unknown): void {
		this.log("warn", message, meta);
	}

	error(message: string, meta?: unknown): void {
		this.log("error", message, meta);
	}

	debug(message: string, meta?: unknown): void {
		this.log("debug", message, meta);
	}
}

export const logger = new Logger();
