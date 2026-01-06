/**
 * @openapi
 * /api/admin/health:
 *   get:
 *     summary: Admin health check
 *     description: Verifica se o módulo administrativo está funcionando
 *     tags:
 *       - Admin
 *     security:
 *       - AdminKeyHeader: []
 *       - AdminKeyQuery: []
 *     responses:
 *       200:
 *         description: Admin module is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Admin API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/admin/instagram/token-status:
 *   get:
 *     summary: Check Instagram token status
 *     description: Verifica o status atual do token do Instagram (se existe, se está expirando)
 *     tags:
 *       - Admin
 *     security:
 *       - AdminKeyHeader: []
 *       - AdminKeyQuery: []
 *     responses:
 *       200:
 *         description: Token status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 has_token:
 *                   type: boolean
 *                   description: Se existe um token configurado
 *                   example: true
 *                 is_expiring_soon:
 *                   type: boolean
 *                   description: Se o token está próximo de expirar (menos de 15 dias)
 *                   example: false
 *                 needs_refresh:
 *                   type: boolean
 *                   description: Se o token precisa ser renovado
 *                   example: false
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Data de expiração do token
 *                   example: "2026-03-07T10:00:00.000Z"
 *                 days_until_expiry:
 *                   type: number
 *                   nullable: true
 *                   description: Número de dias até o token expirar
 *                   example: 60
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Data de criação do token
 *                   example: "2026-01-06T10:00:00.000Z"
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Data da última atualização do token
 *                   example: "2026-01-06T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/admin/instagram/refresh-token:
 *   post:
 *     summary: Refresh Instagram access token
 *     description: Força a renovação imediata do token do Instagram Graph API
 *     tags:
 *       - Admin
 *     security:
 *       - AdminKeyHeader: []
 *       - AdminKeyQuery: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Instagram token refreshed successfully
 *                 refreshed_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-06T19:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: TOKEN_REFRESH_FAILED
 *                     message:
 *                       type: string
 *                       example: Failed to refresh Instagram token
 *                     details:
 *                       type: string
 *                       example: Instagram App ID and Secret are required for token refresh
 */

export {};
