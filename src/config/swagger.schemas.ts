/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: VALIDATION_ERROR
 *             message:
 *               type: string
 *               example: Invalid request parameters
 *             details:
 *               type: object
 *
 *     SingleMetricResponse:
 *       type: object
 *       description: Response for a single metric
 *       properties:
 *         value:
 *           type: number
 *           example: 672000000
 *         metadata:
 *           type: object
 *           properties:
 *             display_name:
 *               type: string
 *             avatar_url:
 *               type: string
 *             verified:
 *               type: boolean
 *         cached:
 *           type: boolean
 *           example: true
 *         fetchedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *
 *     AllMetricsResponse:
 *       type: object
 *       description: Response containing multiple metrics
 *       properties:
 *         metrics:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/SingleMetricResponse'
 *           example:
 *             followers:
 *               value: 672000000
 *               cached: true
 *               fetchedAt: "2026-01-06T10:30:00.000Z"
 *             following:
 *               value: 123
 *               cached: true
 *               fetchedAt: "2026-01-06T10:30:00.000Z"
 *         partial_errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               metric:
 *                 type: string
 *               error:
 *                 type: string
 *
 *   parameters:
 *     WithMetadata:
 *       name: with-metadata
 *       in: query
 *       description: Controls whether metadata is included in the response
 *       required: false
 *       schema:
 *         type: boolean
 *         default: true
 *
 *   securitySchemes:
 *     ApiKeyHeader:
 *       type: apiKey
 *       in: header
 *       name: X-API-Key
 *       description: API key for authentication (preferred method)
 *     ApiKeyQuery:
 *       type: apiKey
 *       in: query
 *       name: api_key
 *       description: API key for authentication (alternative method)
 */

// This file only contains OpenAPI documentation
export {};
