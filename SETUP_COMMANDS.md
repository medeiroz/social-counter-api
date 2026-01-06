# 🚀 API Setup - Commands to Execute

Run the commands below in the terminal, in order:

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and configure:
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

## 3. Create database tables
```bash
npm run db:migrate -- --name init
```

## 4. Generate Prisma Client
```bash
npm run db:generate
```

## 5. (Optional) Open Prisma Studio to view database
```bash
npm run db:studio
```

## 6. Start server in development mode
```bash
npm run dev
```

---

## ⚠️ Before executing

Make sure that:
1. PostgreSQL is running
2. The `.env` file has the correct `DATABASE_URL`
3. You have a YouTube API key (get it at: https://console.cloud.google.com/apis/credentials)

---

## ✅ After executing

- Database tables created
- Prisma client generated
- API running on `http://localhost:3000`
- Health check available at `http://localhost:3000/health`
- Swagger documentation available at `http://localhost:3000/api-docs`

---

## 🐳 Docker Setup (Alternative)

If you prefer to use Docker:

1. **Configure `.env` file** (same as step 2 above)

2. **Start with Docker Compose:**
```bash
docker-compose up -d
```

3. **Run migrations:**
```bash
docker-compose exec api npm run db:migrate -- --name init
```

4. **View logs:**
```bash
docker-compose logs -f api
```

5. **Stop containers:**
```bash
docker-compose down
```

---

## 📊 Available Endpoints

### Health Check (Public)
```bash
curl http://localhost:3000/health
```

### Instagram (Requires API Key)
```bash
# All account metrics
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/instagram/account?username=instagram"

# Specific metric
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/instagram/account/followers?username=instagram"

# Post metrics
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/instagram/post?url=https://instagram.com/p/SHORTCODE/"
```

### YouTube (Requires API Key)
```bash
# All channel metrics
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/youtube/channel?channel=@mkbhd"

# Specific metric
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/youtube/channel/subscribers?channel=@mkbhd"

# Video metrics
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/v1/youtube/video?url=https://youtube.com/watch?v=VIDEO_ID"
```

### Query Parameters
- `with-metadata=false` - Exclude metadata from response (default: true)

---

## 🔧 Useful Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:fix

# Build for production
npm run build

# Run production build
npm start
```
