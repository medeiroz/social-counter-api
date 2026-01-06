# 📊 Social Counter API

REST API for aggregating social media metrics from multiple platforms (Instagram, YouTube, TikTok, Twitch, etc.) with built-in caching and authentication.

[![GitHub](https://img.shields.io/badge/GitHub-medeiroz%2Fsocial--counter--api-blue?logo=github)](https://github.com/medeiroz/social-counter-api)

## 🚀 Features

- **Multi-platform support**: Instagram, YouTube (TikTok and Twitch coming soon)
- **PostgreSQL caching**: TTL-based cache to reduce external API calls
- **API Key authentication**: Secure endpoints with simple API key validation
- **Flexible metadata control**: `with-metadata` query parameter to control response format
- **Interactive API documentation**: Swagger/OpenAPI documentation available at `/api-docs`
- **TypeScript**: Full type safety across the codebase
- **Adapter pattern**: Easy to extend with new platforms
- **Docker support**: Ready for containerized deployment
- **Rate limiting ready**: Built-in middleware structure for rate limiting

## 📋 Supported Platforms & Metrics

### Instagram
- **Account metrics**: `followers`, `following`, `posts_count`
- **Post metrics**: `likes`, `comments`, `views`

### YouTube
- **Channel metrics**: `subscribers`, `video_count`, `total_views`
- **Video metrics**: `views`, `likes`, `comments`

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript 5.9.3
- **Framework**: Express 5.2.1
- **Database**: PostgreSQL with Prisma ORM 7.2.0
- **Validation**: Zod
- **HTTP Client**: Axios
- **Security**: Helmet, CORS
- **Code Quality**: Biome (linting + formatting)

## 📦 Installation

1. **Clone the repository**
```bash
git clone git@github.com:medeiroz/social-counter-api.git
cd social-counter-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/social_counter?schema=public"
YOUTUBE_API_KEY="your_youtube_api_key_here"
API_KEY="your_secure_api_key_here"
```

**Generate a secure API key:**
```bash
openssl rand -hex 32
```

4. **Run database migrations**
```bash
npm run db:migrate -- --name init
```

5. **Generate Prisma client**
```bash
npm run db:generate
```

## 🚦 Usage

### Development mode
```bash
npm run dev
```

### Production build
```bash
npm run build
npm start
```

### Other commands
```bash
npm run typecheck        # Check TypeScript types
npm run lint            # Lint code with Biome
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Biome
npm run format:fix      # Format and fix code
npm run db:studio       # Open Prisma Studio
```

## 🔑 Authentication

All `/api/*` endpoints require authentication. The `/health` endpoint remains public.

**Two authentication methods:**

1. **Header-based** (recommended):
```bash
curl -H "X-API-Key: your_api_key_here" http://localhost:3000/api/v1/instagram/account?username=instagram
```

2. **Query parameter**:
```bash
curl http://localhost:3000/api/v1/instagram/account?username=instagram&api_key=your_api_key_here
```

**Development mode**: If `API_KEY` is not set in `.env`, authentication is disabled.

## 📖 Interactive API Documentation

Swagger UI is available at `/api-docs` for interactive API exploration and testing.

**Access the documentation:**
```bash
http://localhost:3000/api-docs
```

The Swagger interface allows you to:
- ✅ View all available endpoints and their parameters
- ✅ Test API requests directly from the browser
- ✅ See request/response schemas and examples
- ✅ Authenticate using your API key

## 📚 API Endpoints

### Query Parameters

All endpoints support the following optional query parameter:

- **`with-metadata`** (boolean, default: `true`): Controls whether metadata is included in the response
  - `true` or `1`: Include metadata (platform, identifier, fetchedAt, cached)
  - `false`, `0`, or `"no"`: Return only the metrics data

**Example:**
```bash
# With metadata (default)
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/account?username=instagram"

# Without metadata
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/account?username=instagram&with-metadata=false"
```

### Health Check
```
GET /health
```

Returns API status and uptime.

### Instagram

#### Account Metrics
```
GET /api/v1/instagram/account?username=<username>
GET /api/v1/instagram/account/:metric?username=<username>
```

**Supported metrics**: `followers`, `following`, `posts_count`

**Example:**
```bash
# All metrics
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/account?username=instagram"

# Specific metric
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/account/followers?username=instagram"
```

#### Post Metrics
```
GET /api/v1/instagram/post?url=<post_url>
GET /api/v1/instagram/post/:metric?url=<post_url>
```

**Supported metrics**: `likes`, `comments`, `views`

**Example:**
```bash
# All post metrics
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/post?url=https://www.instagram.com/p/SHORTCODE/"

# Specific metric
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/instagram/post/likes?url=https://www.instagram.com/p/SHORTCODE/"
```

### YouTube

#### Channel Metrics
```
GET /api/v1/youtube/channel?channel=<channel_identifier>
GET /api/v1/youtube/channel/:metric?channel=<channel_identifier>
```

**Supported metrics**: `subscribers`, `video_count`, `total_views`

**Channel identifier can be**: `@handle`, channel ID, or username

**Example:**
```bash
# All metrics
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/youtube/channel?channel=@mkbhd"

# Specific metric
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/youtube/channel/subscribers?channel=@mkbhd"
```

#### Video Metrics
```
GET /api/v1/youtube/video?url=<video_url>
GET /api/v1/youtube/video/:metric?url=<video_url>
```

**Supported metrics**: `views`, `likes`, `comments`

**Example:**
```bash
# All video metrics
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/youtube/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Specific metric
curl -H "X-API-Key: your_key" "http://localhost:3000/api/v1/youtube/video/views?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## 📊 Response Format

### Success Response (with metadata - default)
```json
{
  "metrics": {
    "followers": {
      "value": 672000000,
      "cached": true,
      "fetchedAt": "2026-01-05T10:30:00.000Z",
      "expiresAt": "2026-01-05T10:35:00.000Z"
    },
    "following": {
      "value": 123,
      "cached": true,
      "fetchedAt": "2026-01-05T10:30:00.000Z",
      "expiresAt": "2026-01-05T10:35:00.000Z"
    },
    "posts_count": {
      "value": 7456,
      "cached": true,
      "fetchedAt": "2026-01-05T10:30:00.000Z",
      "expiresAt": "2026-01-05T10:35:00.000Z"
    }
  }
}
```

### Success Response (without metadata - `with-metadata=false`)
```json
{
  "followers": 672000000,
  "following": 123,
  "posts_count": 7456
}
```
```

### Error Response
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Instagram user not found"
  }
}
```

### Authentication Error
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key is required. Provide it via X-API-Key header or api_key query parameter."
  }
}
```

## 🗄️ Cache System

The API uses PostgreSQL as a caching layer to reduce external API calls and improve response times.

**Cache TTL by platform:**
- Instagram: 5 minutes
- YouTube: 10 minutes

Cache is automatically managed and expired entries are cleaned up periodically.

## 🏗️ Project Structure

```
src/
├── index.ts                    # Application entry point
├── apis/
│   ├── index.ts               # API routes aggregator
│   └── social-counter/
│       ├── instagram.ts       # Instagram endpoints
│       └── youtube.ts         # YouTube endpoints
├── lib/
│   └── prisma.ts              # Prisma client singleton
├── middlewares/
│   ├── auth.middleware.ts     # API key authentication
│   ├── error-handler.middleware.ts
│   └── not-found.middleware.ts
├── modules/
│   ├── cache/
│   │   └── cache.service.ts   # Cache management
│   └── platforms/
│       ├── base/              # Base interfaces
│       ├── instagram/         # Instagram adapter + routes
│       └── youtube/           # YouTube adapter + routes
├── types/                     # TypeScript type definitions
└── utils/
    ├── logger.ts              # Logging utilities
    ├── query-params.ts        # Query parameter utilities
    └── response.ts            # Response standardization
```

## 🔒 Security

- **Helmet**: Security headers enabled
- **CORS**: Configurable CORS policies
- **API Keys**: Simple authentication for all endpoints
- **Input Validation**: Zod schemas for request validation
- **Error Handling**: No stack traces exposed in production

## 🐳 Docker Deployment

### Local Development with Docker Compose

Docker Compose is configured for **local development only** with hot reload:

1. **Configure environment variables**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set your credentials:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@db:5432/social_counter?schema=public"
YOUTUBE_API_KEY="your_youtube_api_key_here"
API_KEY="your_secure_api_key_here"
```

2. **Start development environment**
```bash
docker-compose up
```

This will:
- Start PostgreSQL database
- Install dependencies automatically
- Run `npm run dev` with hot reload
- Mount your code as a volume (changes reflect immediately)

3. **Run migrations** (in another terminal)
```bash
docker-compose exec api npm run db:migrate -- --name init
```

4. **Stop development environment**
```bash
docker-compose down
```

**Development features:**
- ✅ Hot reload (file changes auto-restart)
- ✅ Local code mounted as volume
- ✅ No need to rebuild on code changes
- ✅ PostgreSQL with persistent data
- ✅ Environment variables from `.env` file

### Production Deployment

For production, use the **Dockerfile** directly (not docker-compose):

#### Build and Run with Docker

**Build the production image:**
```bash
docker build -t social-counter-api:latest .
```

**Run in production:**
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/social_counter" \
  -e YOUTUBE_API_KEY="your_youtube_api_key" \
  -e API_KEY="your_api_key" \
  --name social-counter-api \
  social-counter-api:latest
```

#### Deploy to Cloud Platforms

Set environment variables directly in your hosting platform:

**Railway / Render / Fly.io:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
YOUTUBE_API_KEY=your_youtube_api_key
API_KEY=your_secure_api_key
```

**Docker Hub / Container Registry:**
```bash
# Tag and push
docker tag social-counter-api:latest yourusername/social-counter-api:latest
docker push yourusername/social-counter-api:latest
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: social-counter-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: yourusername/social-counter-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: social-counter-secrets
              key: database-url
        - name: YOUTUBE_API_KEY
          valueFrom:
            secretKeyRef:
              name: social-counter-secrets
              key: youtube-api-key
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: social-counter-secrets
              key: api-key
```

### Useful Docker Commands

**Development (docker-compose):**
```bash
# View logs
docker-compose logs -f api

# Restart API service
docker-compose restart api

# Run commands inside container
docker-compose exec api npm run db:studio
docker-compose exec api sh

# Clean up
docker-compose down -v  # Remove volumes too
```

**Production (docker):**
```bash
# View logs
docker logs -f social-counter-api

# Check health
docker inspect --format='{{.State.Health.Status}}' social-counter-api

# Access container
docker exec -it social-counter-api sh
```

## 🚧 Roadmap

### ✅ Completed
- [x] Instagram adapter (account + post metrics)
- [x] YouTube adapter (channel + video metrics)
- [x] API key authentication
- [x] PostgreSQL caching with TTL
- [x] Docker support (development + production)
- [x] `with-metadata` query parameter
- [x] Error handling middleware
- [x] Health check endpoint
- [x] Swagger/OpenAPI documentation

### 🔄 In Progress
- [ ] Rate limiting middleware
- [ ] Zod validation for query parameters

### 📋 Planned
- [ ] TikTok adapter
- [ ] Twitch adapter
- [ ] Redis for high-performance caching (v2)
- [ ] Background jobs with BullMQ (v2)
- [ ] Advanced monitoring and logging (v2)

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using TypeScript, Express, and Prisma**
