import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
config({
  path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
  quiet: true,
});
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!connectionString || !url || !secret)
  throw new Error("Database and Supabase server configuration is required.");
const apply = process.argv.includes("--apply");
const database = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: process.env.NODE_ENV === "production" },
});
const storage = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
}).storage;
try {
  // Wait a full day so an interrupted submission has time to finish or be retried.
  const candidates = await database.query<{
    name: string;
  }>(`SELECT o.name FROM storage.objects o
    WHERE o.bucket_id = 'report-photos' AND o.created_at < NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (SELECT 1 FROM public.item_images i WHERE i.storage_key = o.name)
    ORDER BY o.created_at LIMIT 500`);
  console.log(
    `${candidates.rows.length} old, unreferenced photos found. ${apply ? "Applying cleanup." : "Dry run; pass --apply to delete."}`,
  );
  let removed = 0;
  for (const { name } of candidates.rows) {
    if (!apply) continue;
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      // Same lock as photo attachment and per-user cleanup in the API.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [name]);
      const used = await client.query(
        "SELECT id FROM public.item_images WHERE storage_key = $1",
        [name],
      );
      if (!used.rows.length) {
        const { error } = await storage.from("report-photos").remove([name]);
        if (error)
          throw new Error(
            "Storage cleanup failed. Retry the maintenance task.",
          );
        removed++;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  if (apply) console.log(`Removed ${removed} unreferenced photos.`);
} finally {
  await database.end();
}
