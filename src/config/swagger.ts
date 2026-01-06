import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Social Counter API",
			version: "1.0.0",
			description:
				"REST API for aggregating social media metrics from multiple platforms (Instagram, YouTube, TikTok, Twitch, etc.) with built-in caching and authentication.",
			contact: {
				name: "API Support",
				url: "https://github.com/medeiroz/social-counter-api",
			},
			license: {
				name: "ISC",
				url: "https://opensource.org/licenses/ISC",
			},
		},
		servers: [
			{
				url: "http://localhost:3000",
				description: "Development server",
			},
			{
				url: "https://api.example.com",
				description: "Production server",
			},
		],
		components: {
			securitySchemes: {
				ApiKeyHeader: {
					type: "apiKey",
					in: "header",
					name: "X-API-Key",
					description: "API key for authentication (preferred method)",
				},
				ApiKeyQuery: {
					type: "apiKey",
					in: "query",
					name: "api_key",
					description: "API key for authentication (alternative method)",
				},
				AdminKeyHeader: {
					type: "apiKey",
					in: "header",
					name: "X-Admin-Key",
					description: "Admin API key for administrative operations",
				},
				AdminKeyQuery: {
					type: "apiKey",
					in: "query",
					name: "admin_key",
					description:
						"Admin API key for administrative operations (alternative method)",
				},
			},
			responses: {
				ValidationError: {
					description: "Validation error",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
						},
					},
				},
				Unauthorized: {
					description: "Unauthorized - API key required",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
						},
					},
				},
			},
		},
		security: [
			{
				ApiKeyHeader: [],
			},
			{
				ApiKeyQuery: [],
			},
		],
	},
	apis: [
		"./src/modules/**/*.docs.ts",
		"./src/config/swagger.schemas.ts",
		"./src/index.ts",
	],
};

export const swaggerSpec = swaggerJsdoc(options);
