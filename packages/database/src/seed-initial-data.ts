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
  if (!connectionString)
    throw new Error("DIRECT_URL or DATABASE_URL is required.");

  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });
  const prisma = new PrismaClient({ adapter });

  try {
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

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SECRET_KEY are required for storage setup.",
      );
    }
    const adminClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: existingBuckets, error: listError } =
      await adminClient.storage.listBuckets();
    if (listError)
      throw new Error(`Storage setup failed: ${listError.message}`);
    const existingNames = new Set(existingBuckets.map((bucket) => bucket.name));
    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const bucket of [
      { name: "report-photos", public: true, allowedMimeTypes: imageTypes },
      {
        name: "proof-files",
        public: false,
        allowedMimeTypes: [...imageTypes, "application/pdf"],
      },
    ]) {
      const options = {
        public: bucket.public,
        fileSizeLimit: 10485760,
        allowedMimeTypes: bucket.allowedMimeTypes,
      };
      const { error } = existingNames.has(bucket.name)
        ? await adminClient.storage.updateBucket(bucket.name, options)
        : await adminClient.storage.createBucket(bucket.name, options);
      if (error)
        throw new Error(`Could not configure ${bucket.name}: ${error.message}`);
      console.log(
        `Configured ${bucket.name} (${bucket.public ? "public" : "private"}, 10 MB limit).`,
      );
    }

    console.log("Seeding completed successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error(
    "Seeding failed:",
    err instanceof Error ? err.message : "Unknown error",
  );
  process.exit(1);
});
