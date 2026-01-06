/**
 * @openapi
 * /api/v1/youtube/video:
 *   get:
 *     summary: Get all YouTube video metrics
 *     tags: [YouTube]
 *     parameters:
 *       - name: url
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video URL or ID
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
 * /api/v1/youtube/video/{metric}:
 *   get:
 *     summary: Get specific YouTube video metric
 *     tags: [YouTube]
 *     parameters:
 *       - name: metric
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [views, likes, comments]
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
 * /api/v1/youtube/channel:
 *   get:
 *     summary: Get all YouTube channel metrics
 *     tags: [YouTube]
 *     parameters:
 *       - name: channel
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel handle (@username), ID, or username
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
 * /api/v1/youtube/channel/{metric}:
 *   get:
 *     summary: Get specific YouTube channel metric
 *     tags: [YouTube]
 *     parameters:
 *       - name: metric
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [subscribers, video_count, total_views]
 *       - name: channel
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
