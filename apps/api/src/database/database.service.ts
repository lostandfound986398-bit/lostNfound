import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, type QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString =
      config.get<string>("DIRECT_URL") ?? config.get<string>("DATABASE_URL");
    if (!connectionString)
      throw new Error("DIRECT_URL or DATABASE_URL is required.");
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: config.get("NODE_ENV") === "production" },
      max: 8,
    });
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
