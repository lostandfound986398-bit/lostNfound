import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, type QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>("DIRECT_URL") ?? config.get<string>("DATABASE_URL");
    if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: config.get("NODE_ENV") === "production" },
      max: 8,
    });
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
