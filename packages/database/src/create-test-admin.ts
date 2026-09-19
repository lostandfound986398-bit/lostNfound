import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/client.ts";

config({
  path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
  quiet: true,
});

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const email = required("TEST_ADMIN_EMAIL").toLowerCase();
  const password = required("TEST_ADMIN_PASSWORD");
  const displayName = process.env.TEST_ADMIN_NAME?.trim() || "CBEA System Administrator";
  const schoolId = (process.env.TEST_ADMIN_SCHOOL_ID?.trim() || "TEST-ADM-0001").toUpperCase();
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
  if (password.length < 12) throw new Error("TEST_ADMIN_PASSWORD must contain at least 12 characters.");

  const supabaseUrl = required("SUPABASE_URL");
  const secretKey = required("SUPABASE_SECRET_KEY");
  const publishableKey = required("SUPABASE_PUBLISHABLE_KEY");
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listed, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let authUser = listed.users.find((user) => user.email?.toLowerCase() === email);

  if (authUser) {
    const { data, error } = await adminClient.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { school_id: schoolId, role: "ADMIN" },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { school_id: schoolId, role: "ADMIN" },
    });
    if (error) throw error;
    authUser = data.user;
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  try {
    await prisma.$transaction(async (transaction) => {
      const conflictingUser = await transaction.user.findUnique({ where: { email } });
      if (conflictingUser && conflictingUser.id !== authUser.id) {
        throw new Error(`A database user with ${email} is linked to another authentication identity.`);
      }
      const masterPerson = await transaction.masterPerson.upsert({
        where: { schoolId },
        create: {
          schoolId,
          fullName: displayName,
          email,
          role: "ADMIN",
          position: "System Administrator",
          department: "CBEA Administration",
          isActive: true,
          importBatch: "development:test-admin",
        },
        update: {
          fullName: displayName,
          email,
          role: "ADMIN",
          position: "System Administrator",
          department: "CBEA Administration",
          isActive: true,
        },
      });
      await transaction.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          masterPersonId: masterPerson.id,
          role: "ADMIN",
          status: "ACTIVE",
          displayName,
          email,
        },
        update: {
          masterPersonId: masterPerson.id,
          role: "ADMIN",
          status: "ACTIVE",
          displayName,
          email,
        },
      });
    });

    const publicClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: login, error: loginError } = await publicClient.auth.signInWithPassword({ email, password });
    if (loginError || !login.user) throw loginError ?? new Error("Administrator login verification failed.");
    const localUser = await prisma.user.findUnique({ where: { id: login.user.id } });
    if (localUser?.role !== "ADMIN" || localUser.status !== "ACTIVE") {
      throw new Error("Administrator database role verification failed.");
    }
    await publicClient.auth.signOut();
    console.log(`Administrator ready: ${email}`);
    console.log(`School ID: ${schoolId}; role: ${localUser.role}; status: ${localUser.status}.`);
    console.log("Supabase password login verified.");
  } finally {
    await prisma.$disconnect();
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;
if (isEntryPoint) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
