/**
 * @openapi
 * tags:
 *   - name: Instagram
 *     description: Instagram metrics endpoints
 *   - name: YouTube
 *     description: YouTube metrics endpoints
 *   - name: Health
 *     description: Health check endpoints
 *
 * /api/v1/instagram/post:
 *   get:
 *     summary: Get all Instagram post metrics
 *     tags: [Instagram]
 *     parameters:
 *       - name: url
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Instagram post URL or shortcode
 *       - $ref: '#/components/parameters/WithMetadata'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllMetricsResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/instagram/post/{metric}:
 *   get:
 *     summary: Get specific Instagram post metric
 *     tags: [Instagram]
 *     parameters:
 *       - name: metric
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [likes, comments, views]
 *       - name: url
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/WithMetadata'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMetricResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/instagram/account:
 *   get:
 *     summary: Get all Instagram account metrics
 *     tags: [Instagram]
 *     parameters:
 *       - name: username
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/WithMetadata'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllMetricsResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/instagram/account/{metric}:
 *   get:
 *     summary: Get specific Instagram account metric
 *     tags: [Instagram]
 *     parameters:
 *       - name: metric
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [followers, following, posts_count]
 *       - name: username
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/WithMetadata'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMetricResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export {};
