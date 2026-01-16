import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Configuração do adapter PostgreSQL (necessário no Prisma 7)
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

async function main() {
	console.log("🌱 Seeding database...");

	// Seed platforms
	const platforms = [
		{
			name: "Instagram",
			slug: "instagram",
			base_url: "https://www.instagram.com",
			is_active: true,
		},
		{
			name: "YouTube",
			slug: "youtube",
			base_url: "https://www.youtube.com",
			is_active: true,
		},
		{
			name: "TikTok",
			slug: "tiktok",
			base_url: "https://www.tiktok.com",
			is_active: true,
		},
		{
			name: "Twitch",
			slug: "twitch",
			base_url: "https://www.twitch.tv",
			is_active: true,
		},
	];

	for (const platform of platforms) {
		const existing = await prisma.platform.findUnique({
			where: { slug: platform.slug },
		});

		if (!existing) {
			await prisma.platform.create({
				data: platform,
			});
			console.log(`✅ Created platform: ${platform.name}`);
		} else {
			console.log(`⏭️  Platform already exists: ${platform.name}`);
		}
	}

	console.log("🎉 Seeding completed!");
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
