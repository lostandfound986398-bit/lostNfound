import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    // Runtime traffic should use Supabase's pooled connection. DIRECT_URL is
    // reserved for Prisma migrations and other one-off database maintenance.
    const connectionString =
      config.get<string>("DATABASE_URL") ?? config.get<string>("DIRECT_URL");
    if (!connectionString)
      throw new Error("DIRECT_URL or DATABASE_URL is required.");
    this.pool = new Pool({
      connectionString,
      // Supabase's managed pooler can present a certificate chain that is not
      // in Vercel's Node trust store. Keep TLS enabled, but let the pooler
      // terminate it without Node rejecting that managed chain.
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
    // Vercel Fluid compute can reuse a warm NestJS instance. This releases
    // idle pg clients before the function is suspended so deployments and
    // traffic spikes do not exhaust the Supabase connection limit.
    attachDatabasePool(this.pool);
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  async transaction<T>(
    work: (database: Pick<DatabaseService, "query">) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work({
        query: (text, values = []) => client.query(text, values),
      });
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
