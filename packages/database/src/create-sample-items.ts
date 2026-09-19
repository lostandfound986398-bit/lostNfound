import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/client.ts";

config({
  path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
  quiet: true,
});

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Finding admin user...");
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    throw new Error("No admin user found. Run npm run admin:create-test first.");
  }

  const getCategory = async (name: string) => {
    const cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) throw new Error(`Category ${name} not found.`);
    return cat.id;
  };

  const getLocation = async (name: string) => {
    const loc = await prisma.location.findUnique({ where: { name } });
    if (!loc) throw new Error(`Location ${name} not found.`);
    return loc.id;
  };

  console.log("Creating test lost & found items...");

  const sampleItems = [
    {
      type: "LOST" as const,
      title: "Blue Anker Power Bank 20000mAh",
      category: "Others",
      color: "Blue",
      location: "Main Library",
      publicDescription: "Left on a study table near the computer area on the 2nd floor.",
      privateVerificationDetails: "Has a small scratch near the USB-C port.",
      occurredAt: new Date("2026-08-10T14:30:00Z"),
    },
    {
      type: "LOST" as const,
      title: "Student Identification Card - Alex Rivera",
      category: "IDs",
      color: "Green",
      location: "CBEA Building",
      publicDescription: "CBEA Student ID card inside a transparent lanyard case.",
      privateVerificationDetails: "ID Number TEST-STU-0001.",
      occurredAt: new Date("2026-08-11T09:15:00Z"),
    },
    {
      type: "FOUND" as const,
      title: "Brown Leather Bifold Wallet",
      category: "Wallets",
      color: "Brown",
      location: "Student Center",
      publicDescription: "Found near the vending machines on the 1st floor lobby.",
      privateVerificationDetails: "Contains a student card and a grocery store receipt.",
      occurredAt: new Date("2026-08-11T16:00:00Z"),
    },
    {
      type: "FOUND" as const,
      title: "Set of 3 House Keys with Brass Ring",
      category: "Keys",
      color: "Brass",
      location: "Cafeteria",
      publicDescription: "Found left on a dining table during lunch.",
      privateVerificationDetails: "One key has a distinctive red rubber head cover.",
      occurredAt: new Date("2026-08-12T12:00:00Z"),
    },
    {
      type: "FOUND" as const,
      title: "Black HP 65W Laptop Charger",
      category: "Others",
      color: "Black",
      location: "Main Library",
      publicDescription: "Discovered plugged into the wall near study carrel #14.",
      privateVerificationDetails: "Serial sticker ends with digits 8842.",
      occurredAt: new Date("2026-08-12T15:45:00Z"),
    },
  ];

  for (const item of sampleItems) {
    const categoryId = await getCategory(item.category);
    const locationId = await getLocation(item.location);

    const report = await prisma.itemReport.create({
      data: {
        reporterId: adminUser.id,
        categoryId,
        locationId,
        type: item.type,
        status: "OPEN",
        title: item.title,
        color: item.color,
        publicDescription: item.publicDescription,
        privateVerificationDetails: item.privateVerificationDetails,
        occurredAt: item.occurredAt,
      },
    });

    console.log(`Created [${report.type}] ${report.title} (ID: ${report.id})`);
  }

  await prisma.$disconnect();
  console.log("Sample items created successfully.");
}

main().catch((err) => {
  console.error("Error creating sample items:", err);
  process.exit(1);
});
