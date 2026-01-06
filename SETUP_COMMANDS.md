# 🚀 API Setup - Commands to Execute

Run the commands below in the terminal, in order:

## 1. Install dependencies
```bash
npm install
```

## 2. Create database tables
```bash
npm run db:migrate -- --name init
```

## 3. Seed platforms in database
```bash
npm run db:seed
```

## 4. (Optional) Open Prisma Studio to view database
```bash
npm run db:studio
```

## 5. Start server in development mode
```bash
npm run dev
```

---

## ⚠️ Before executing

Make sure that:
1. PostgreSQL is running
2. The `.env` file has the correct `DATABASE_URL`

`DATABASE_URL` example:
```
DATABASE_URL="postgresql://user:password@localhost:5432/social_counter?schema=public"
```

---

## ✅ After executing

- Tables `platforms` and `metrics` created
- 4 platforms registered (Instagram, YouTube, TikTok, Twitch)
- API ready to receive platform adapters
