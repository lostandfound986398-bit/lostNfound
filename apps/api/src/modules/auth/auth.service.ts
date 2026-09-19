import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DatabaseService } from "../../database/database.service";
import { RegisterDto } from "./dto/register.dto";

export interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  role: "STUDENT" | "FACULTY" | "STAFF" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "DEACTIVATED";
}

interface DirectoryRow {
  id: string;
  school_id: string;
  full_name: string;
  email: string | null;
  role: LocalUser["role"];
  is_active: boolean;
  user_id: string | null;
}

@Injectable()
export class AuthService {
  private readonly publicClient: SupabaseClient;
  private readonly adminClient: SupabaseClient;
  private readonly siteUrl: string;

  constructor(config: ConfigService, private readonly database: DatabaseService) {
    const url = config.getOrThrow<string>("SUPABASE_URL");
    this.publicClient = createClient(url, config.getOrThrow<string>("SUPABASE_PUBLISHABLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.adminClient = createClient(url, config.getOrThrow<string>("SUPABASE_SECRET_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.siteUrl = config.get("SITE_URL", "http://localhost:3000");
  }

  private normalizeName(value: string) {
    return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  async findDirectoryRecord(role: string, schoolId: string, fullName: string) {
    const result = await this.database.query<DirectoryRow>(
      `SELECT mp.id, mp.school_id, mp.full_name, mp.email, mp.role,
              mp.is_active, u.id AS user_id
         FROM master_people mp
         LEFT JOIN users u ON u.master_person_id = mp.id
        WHERE mp.school_id = $1`,
      [schoolId.trim().toUpperCase()],
    );
    const record = result.rows[0];
    if (
      !record ||
      !record.is_active ||
      record.role !== role ||
      this.normalizeName(record.full_name) !== this.normalizeName(fullName)
    ) {
      throw new UnauthorizedException("The supplied school record could not be verified.");
    }
    if (record.user_id) throw new ConflictException("This school record is already registered.");
    return record;
  }

  async register(input: RegisterDto) {
    const record = await this.findDirectoryRecord(input.role, input.schoolId, input.fullName);
    if (!record.email || record.email.toLowerCase() !== input.email.trim().toLowerCase()) {
      throw new UnauthorizedException("The supplied school record could not be verified.");
    }

    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: record.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        school_id: record.school_id,
        role: record.role,
        display_name: record.full_name,
      },
    });
    if (error || !data.user) throw new ConflictException(error?.message ?? "Account creation failed.");

    try {
      await this.database.query(
        `INSERT INTO users (id, master_person_id, role, status, display_name, email, created_at, updated_at)
         VALUES ($1, $2, $3, 'ACTIVE', $4, $5, NOW(), NOW())`,
        [data.user.id, record.id, record.role, record.full_name, record.email],
      );
    } catch (databaseError) {
      await this.adminClient.auth.admin.deleteUser(data.user.id);
      throw databaseError;
    }

    return { message: "Registration received. Check your email to confirm the account." };
  }

  async authenticate(accessToken: string): Promise<LocalUser> {
    const { data, error } = await this.publicClient.auth.getUser(accessToken);
    if (error || !data.user) throw new UnauthorizedException("Invalid or expired session.");
    const result = await this.database.query<LocalUser & { display_name: string }>(
      `SELECT id, email, display_name, role, status FROM users WHERE id = $1`,
      [data.user.id],
    );
    const user = result.rows[0];
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Account is not active.");
    return { ...user, displayName: user.display_name };
  }
}

