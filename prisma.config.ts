import { defineConfig, env } from "prisma/config";
import "dotenv/config"; // Optional: ensures .env is loaded if not handled by your runtime/framework

export default defineConfig({
	// The schema location is now configured here instead of implicitly
	schema: "prisma/schema.prisma",

	datasource: {
		url: env("DATABASE_URL"), // Reads the URL from the environment variable
	},

	// Other configurations like migrations path can also be set here
	migrations: {
		path: "prisma/migrations",
	},

	// Note: In Prisma v7, the 'engine' key is no longer required as it defaults to 'classic'
});
