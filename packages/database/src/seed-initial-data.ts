import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/client.ts";

config({
  path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
  quiet: true,
});

const CATEGORIES = [
  "IDs",
  "Wallets",
  "Phones",
  "Bags",
  "Keys",
  "School Supplies",
  "Others",
];

const LOCATIONS = [
  "CBEA Building",
  "Main Library",
  "Student Center",
  "Cafeteria",
  "Quadrangle",
  "Campus Security",
  "Gymnasium",
  "Others",
];

async function seed() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding categories...");
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      create: { name, isActive: true },
      update: { isActive: true },
    });
  }

  console.log("Seeding locations...");
  for (const name of LOCATIONS) {
    await prisma.location.upsert({
      where: { name },
      create: { name, isActive: true },
      update: { isActive: true },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseSecretKey) {
    console.log("Ensuring Supabase Storage buckets exist...");
    const adminClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const buckets = ["report-photos", "proof-files"];
    const { data: existingBuckets } = await adminClient.storage.listBuckets();
    const existingNames = new Set(existingBuckets?.map((b) => b.name) ?? []);

    for (const bucketName of buckets) {
      if (!existingNames.has(bucketName)) {
        const { error } = await adminClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        if (error) {
          console.warn(`Could not create bucket ${bucketName}:`, error.message);
        } else {
          console.log(`Created bucket ${bucketName}.`);
        }
      } else {
        console.log(`Bucket ${bucketName} already exists.`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("Seeding completed successfully.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
