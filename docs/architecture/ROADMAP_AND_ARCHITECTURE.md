# 🗺️ Development Roadmap - Social Counter API

## 📋 Project Overview

REST API for social media metrics aggregation, allowing other services to query standardized counters from multiple platforms (Instagram, YouTube, TikTok, Twitch, etc.) in a unified way.

### Goal
Provide unified endpoints to fetch social media metrics without the consumer having to deal with multiple external APIs, rate limits, and different authentication methods.

---

## 🏗️ Proposed Architecture

### Technology Stack (Decisions)

| Technology | Choice | Justification |
|------------|---------|---------------|
| **Runtime** | Node.js | ✅ Keep. Mature ecosystem for API integrations |
| **Language** | TypeScript | ✅ Keep. Type-safety essential for multiple integrations |
| **Framework** | Express | ✅ Keep. Simple and sufficient for this API |
| **ORM** | Prisma | ✅ Keep. Excellent for modeling and migrations |
| **Database** | PostgreSQL | ✅ Keep. Robust for relational data and cache |
| **Validation** | **Zod** | ➕ Add. Schema and runtime type validation |
| **HTTP Client** | **Axios** | ➕ Add. Robust HTTP client for external APIs |
| **Cache** | 🔮 Redis (v2) | Postponed. Initial cache via PostgreSQL |
| **Queue** | 🔮 BullMQ (v2) | Postponed. Async jobs in v2 |

### Additional Packages Needed (v1)
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17"
  }
}
```

### Packages for v2 (Future)
```json
{
  "dependencies": {
    "ioredis": "^5.3.0",
    "bullmq": "^5.0.0",
    "rate-limiter-flexible": "^3.0.0"
  }
}
```

---

## 📐 Application Architecture

### Folder Structure
```
src/
├── index.ts                          # Entry point
├── config/
│   └── database.ts                   # Configuração Prisma/PostgreSQL
├── lib/
│   └── prisma.ts                     # Cliente Prisma singleton
├── middlewares/
│   ├── error-handler.middleware.ts   # Global error handler
│   ├── not-found.middleware.ts       # 404 handler
│   ├── rate-limit.middleware.ts      # Simple rate limiting (in-memory)
│   └── validation.middleware.ts      # Validation with Zod
├── modules/
│   ├── auth/                         # Authentication (API Keys) [Optional v1]
│   │   ├── auth.service.ts
│   │   ├── auth.middleware.ts
│   │   └── auth.routes.ts
│   ├── platforms/                    # Platform integrations
│   │   ├── instagram/
│   │   │   ├── instagram.service.ts
│   │   │   ├── instagram.adapter.ts
│   │   │   ├── instagram.types.ts
│   │   │   └── instagram.routes.ts
│   │   ├── youtube/
│   │   ├── tiktok/
│   │   ├── twitch/
│   │   └── base/
│   │       ├── platform.interface.ts
│   │       └── platform.adapter.ts
│   ├── metrics/                      # Metrics management
│   │   ├── metrics.service.ts
│   │   ├── metrics.controller.ts
│   │   ├── metrics.routes.ts
│   │   └── metrics.types.ts
│   └── cache/                        # Cache system (PostgreSQL)
│       ├── cache.service.ts
│       └── cache.types.ts
├── utils/
│   ├── logger.ts                     # Logging system (simple console v1)
│   ├── retry.ts                      # Basic retry logic
│   └── response.ts                   # Response standardization
└── types/
    └── global.d.ts                   # Global types
```

---

## 🎯 Core Features

### 1. API Endpoints

#### 🎉 Implemented Features

**Authentication:**
- ✅ API Key authentication via `X-API-Key` header or `api_key` query parameter
- ✅ Optional authentication (can be disabled in development)
- ✅ 401 UNAUTHORIZED responses for missing/invalid keys

**Query Parameters:**
- ✅ `with-metadata` - Control metadata inclusion in responses (default: true)
  - Values: `true` (default), `false`, `0`, `no`
  - Removes metadata from single and multiple metric responses

**Caching:**
- ✅ PostgreSQL-based caching with TTL
- ✅ BigInt to Number conversion for JSON serialization
- ✅ Cache hit/miss tracking

**Error Handling:**
- ✅ Standardized error responses with error codes
- ✅ Detailed error messages for debugging
- ✅ No stack traces in production

#### Endpoint Structure
```
# Instagram
GET /api/v1/instagram/account?username=<username>&with-metadata=<true|false>
GET /api/v1/instagram/account/:metric?username=<username>&with-metadata=<true|false>
GET /api/v1/instagram/post?url=<post_url>&with-metadata=<true|false>
GET /api/v1/instagram/post/:metric?url=<post_url>&with-metadata=<true|false>

# YouTube
GET /api/v1/youtube/channel?channel=<identifier>&with-metadata=<true|false>
GET /api/v1/youtube/channel/:metric?channel=<identifier>&with-metadata=<true|false>
GET /api/v1/youtube/video?url=<video_url>&with-metadata=<true|false>
GET /api/v1/youtube/video/:metric?url=<video_url>&with-metadata=<true|false>

Examples:
- GET /api/v1/instagram/account/followers?username=instagram
- GET /api/v1/youtube/channel/subscribers?channel=@mkbhd
- GET /api/v1/youtube/video/views?url=https://youtube.com/watch?v=...
- GET /api/v1/instagram/post/likes?url=https://instagram.com/p/ABC123/
```

#### Supported Metrics by Platform

| Platform | Available Metrics | Status |
|------------|---------------------|--------|
| **Instagram** | Account: `followers`, `following`, `posts_count`<br>Post: `likes`, `comments`, `views` | ✅ Implemented |
| **YouTube** | Channel: `subscribers`, `video_count`, `total_views`<br>Video: `views`, `likes`, `comments` | ✅ Implemented |
| **TikTok** | `followers`, `following`, `likes`, `views` (specific) | 🔮 Planned |
| **Twitch** | `followers`, `live_viewers`, `total_views` | 🔮 Planned |

### 2. Cache System (PostgreSQL)

**Simplified Cache Strategy (v1):**

```typescript
// PostgreSQL as single cache with TTL based on expiresAt

Cache TTL by platform:
- Instagram: 5 minutes
- YouTube: 10 minutes (less volatile metrics)
- TikTok: 3 minutes
- Twitch (live_viewers): 1 minute
- Twitch (others): 5 minutes
```

**Flow:**
1. Search in PostgreSQL (WHERE expiresAt > NOW())
2. If found and not expired → return cache
3. If not found or expired → fetch from external API → save to DB

**Benefits:**
- Reduces calls to external APIs (avoids rate limits)
- Metrics history for analysis
- Simplicity (no extra dependencies)

**For v2:**
- Redis for high-performance cache
- BullMQ for async jobs and background refresh

### 3. Rate Limiting

**Simplified Strategy (v1):**
- In-memory rate limiting (Map in Node.js)
- Per IP: 100 requests/minute
- Automatic cleanup every 1 minute

**For v2:**
- Redis with rate-limiter-flexible
- Rate limiting per API Key
- Distributed across multiple instances

### 5. Authentication (API Keys - Optional v1)

**Simple Model:**
- API Keys generation via endpoint `/api/v1/auth/generate-key`
- Validation via header: `X-API-Key`
- Storage in PostgreSQL with custom rate limits

---

## 🗄️ Database Schema

```prisma
// prisma/schema.prisma

model ApiKey {
  id            String   @id @default(cuid())
  key           String   @unique
  name          String
  rateLimit     Int      @default(1000) // Requisições por minuto
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  expiresAt     DateTime?
  lastUsedAt    DateTime?
  
  metrics       Metric[]
  
  @@index([key])
}

model Platform {
  id            String   @id @default(cuid())
  name          String   @unique // instagram, youtube, tiktok, twitch
  baseUrl       String?
  isActive      Boolean  @default(true)
  
  metrics       Metric[]
}

model Metric {
  id            String   @id @default(cuid())
  platformId    String
  platform      Platform @relation(fields: [platformId], references: [id])
  
  username      String
  metricType    String   // followers, subscribers, live_viewers, etc
  value         BigInt
  metadata      Json?    // Extra data (e.g., avatar_url, display_name)
  
  apiKeyId      String?
  apiKey        ApiKey?  @relation(fields: [apiKeyId], references: [id])
  
  fetchedAt     DateTime @default(now())
  expiresAt     DateTime
  
  @@index([platformId, username, metricType])
  @@index([expiresAt])
}

model RateLimit {
  id            String   @id @default(cuid())
  identifier    String   // IP ou API Key
  endpoint      String
  requestCount  Int      @default(0)
  windowStart   DateTime
  
  @@unique([identifier, endpoint, windowStart])
}
```

---

## 🔌 Platform Integrations

### Integration Strategy

**Approach: Web Scraping + Official APIs (Hybrid)**

| Platform | Method | Justification |
|------------|--------|---------------|
| **Instagram** | Scraping (Puppeteer/Unofficial API) | Official API restricted, public scraping works |
| **YouTube** | YouTube Data API v3 | Free official API (daily quota) |
| **TikTok** | Unofficial API / Scraping | Limited official API |
| **Twitch** | Twitch API (Helix) | Robust and free official API |

### Adapter Pattern (Abstraction)

```typescript
// Common interface for all platforms
interface PlatformAdapter {
  getFollowers(username: string): Promise<number>;
  getFollowing(username: string): Promise<number>;
  getMetric(username: string, metric: MetricType): Promise<MetricResult>;
}

// Each platform implements its adapter
class InstagramAdapter implements PlatformAdapter {
  async getFollowers(username: string): Promise<number> {
    // Specific implementation
  }
}
```

**Useful Packages:**
- `instagram-private-api` or lightweight scraping
- `googleapis` (YouTube)
- `tiktok-scraper` or `tiktok-api`
- `twitch-api-v5` or `@twurple/api`

---

## 🚀 Development Phases

### 📦 Phase 5: v2 - Optimizations (Future Roadmap)
- [ ] Add Redis for high-performance cache
- [ ] Implement BullMQ for async jobs
- [ ] Distributed rate limiting with Redis
- [ ] Advanced monitoring (Sentry, APM)
- [ ] Load testing and optimization
- [ ] TikTok adapter integration
- [ ] Twitch adapter integration

---

## 📊 API Response Format

### Success
```json
{
  "success": true,
  "data": {
    "platform": "instagram",
    "username": "cristiano",
    "metric": "followers",
    "value": 643000000,
    "metadata": {
      "display_name": "Cristiano Ronaldo",
      "avatar_url": "https://...",
      "verified": true
    },
    "cached": true,
    "fetched_at": "2026-01-05T10:30:00Z",
    "expires_at": "2026-01-05T10:35:00Z"
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Username not found on Instagram",
    "platform": "instagram",
    "username": "invalid_user"
  }
}
```

---

## 🔒 Security & Best Practices

1. **Rate Limiting**: Protection against abuse (rate-limiter-flexible)
2. **API Keys**: Mandatory authentication for production environments
3. **Helmet.js**: HTTP security headers
4. **Input Validation**: Zod for schema validation
5. **Error Handling**: Never expose stack traces in production
6. **Logs**: Winston with appropriate levels (info, warn, error)
7. **CORS**: Configure allowed origins

---

## 📈 Monitoring & Observability

### Important Metrics
- Cache hit/miss rate
- Latency per platform
- Error rate per platform
- Rate limit usage (external APIs)
- Throughput (req/s)

### Tools
- **Logs**: Winston → CloudWatch/Datadog
- **Errors**: Sentry
- **APM**: New Relic (optional)
- **Health Check**: `/health` endpoint with dependency status

---

## 🎓 Architecture Decisions (Senior Perspective)

### ✅ Why this architecture (simplified v1)?

1. **PostgreSQL as cache**: Simplicity without extra dependencies, integrated history
2. **Adapter Pattern**: Makes it easy to add new platforms without breaking existing code
3. **In-memory rate limiting**: Sufficient for MVP, no Redis needed
4. **No queues initially**: Synchronous requests with simple retry
5. **Optional authentication**: Focus on core functionality first

### ⚖️ Trade-offs Considered

| Decision | Pros | Cons | Choice (v1) |
|---------|------|---------|-------------|
| PostgreSQL vs Redis cache | Simple, no deps | Higher latency | ✅ PostgreSQL (Redis v2) |
| Scraping vs Official APIs | Flexibility | Risk of blocking | ✅ Hybrid |
| Monolith vs Microservices | Initial simplicity | Less scalable | ✅ Modular monolith |
| Queues vs Synchronous | Sync is simple | Less resilient | ✅ Synchronous (Queues v2) |
| Rate limit mem vs Redis | No deps | Not distributed | ✅ Memory (Redis v2) |

### 🚫 What NOT to do (Over-engineering for v1)

- ❌ Premature Redis and BullMQ (leave for v2)
- ❌ Kubernetes at start (use Railway/Render)
- ❌ GraphQL (REST is sufficient)
- ❌ Event sourcing (unnecessary)
- ❌ Premature microservices
- ❌ Complex authentication system at start
- ❌ Heavy structured logger (Winston/Pino can wait)

---

## 🎯 Immediate Next Steps (v1)

1. **Install basic dependencies** (axios, zod, helmet, cors)
2. **Create Prisma schema** (Platform, Metric)
3. **Implement CacheService** (PostgreSQL)
4. **Create InstagramAdapter** (first integration)
5. **Implement metrics endpoints**
6. **In-memory rate limiting**
7. **Deploy MVP**

---

## 📚 Resources & References

### v1 (Current)
- [Instagram Private API](https://github.com/dilame/instagram-private-api)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Twitch API (Helix)](https://dev.twitch.tv/docs/api/)
- [TikTok Unofficial API](https://github.com/drawrowfly/tiktok-scraper)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Zod Validation](https://zod.dev/)

### v2 (Future)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Rate Limiter Flexible](https://github.com/animir/node-rate-limiter-flexible)

---

**Architecture validated by: Copilot (Senior Developer Perspective)**  
**Date: 01/05/2026**
