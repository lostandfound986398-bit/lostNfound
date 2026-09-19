import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// Keep one server-side source of truth for local database credentials. This
// resolves correctly whether Prisma is run from the repository root or through
// the database workspace.
config({
  path: fileURLToPath(new URL("../../apps/api/.env", import.meta.url)),
  quiet: true,
});

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (
  [databaseUrl, directUrl].some(
    (url) => url && /PROJECT_REF|REGION|YOUR_PASSWORD|\[YOUR-PASSWORD\]/i.test(url),
  )
) {
  throw new Error(
    "A database URL still contains sample placeholders. Copy the real connection URLs from Supabase Dashboard → Connect → ORM.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Generation and validation do not need a live database. Runtime and
    // migration commands override this with the real environment value.
    // Prisma CLI operations and migrations prefer the session/direct URL.
    // Application runtime can keep DATABASE_URL on the transaction pooler.
    url:
      directUrl ??
      databaseUrl ??
      "postgresql://postgres:postgres@localhost:5432/lost_found",
  },
});
