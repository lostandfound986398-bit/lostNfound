import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import type { ItemReportSummary } from "@lost-found/contracts";
import { DatabaseService } from "../../database/database.service";
import type { LocalUser } from "../auth/auth.service";
import { CreateReportDto } from "./dto/create-report.dto";

interface ReportRow {
  id: string;
  type: ItemReportSummary["type"];
  title: string;
  category: string;
  color: string;
  location: string;
  occurred_at: Date;
  status: ItemReportSummary["status"];
  primary_image_key?: string | null;
  public_description?: string | null;
}

export interface SearchFilterOptions {
  query?: string;
  category?: string;
  location?: string;
  color?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ReportsService {
  private readonly supabaseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
  ) {
    this.supabaseUrl = config.get<string>("SUPABASE_URL") || "";
  }

  private summary(row: ReportRow): ItemReportSummary {
    const imageUrl = row.primary_image_key
      ? `${this.supabaseUrl}/storage/v1/object/public/report-photos/${row.primary_image_key}`
      : undefined;

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      category: row.category,
      color: row.color,
      location: row.location,
      occurredAt: row.occurred_at.toISOString(),
      status: row.status,
      imageUrl,
    };
  }

  private validateInput(input: CreateReportDto) {
    if (!input.title.trim() || !input.color.trim())
      throw new BadRequestException("Enter an item name and color.");
    const date = new Date(input.occurredAt);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    if (Number.isNaN(date.getTime()) || input.occurredAt.slice(0, 10) > today)
      throw new BadRequestException("Choose a valid date on or before today.");
  }

  async options() {
    const [categories, locations] = await Promise.all([
      this.database.query<{ name: string }>(
        "SELECT name FROM categories WHERE is_active = TRUE ORDER BY name",
      ),
      this.database.query<{ name: string }>(
        "SELECT name FROM locations WHERE is_active = TRUE ORDER BY name",
      ),
    ]);
    return {
      categories: categories.rows.map((row) => row.name),
      locations: locations.rows.map((row) => row.name),
    };
  }

  async findAll(
    filters: SearchFilterOptions = {},
  ): Promise<ItemReportSummary[]> {
    const conditions: string[] = [
      "r.status IN ('OPEN', 'MATCHED', 'CLAIM_PENDING', 'CLAIMED')",
    ];
    const values: unknown[] = [];

    if (filters.query?.trim()) {
      values.push(filters.query.trim());
      conditions.push(
        `concat_ws(' ', r.title, r.color, c.name, l.name, coalesce(r.public_description, '')) ILIKE '%' || $${values.length} || '%'`,
      );
    }

    if (filters.category?.trim()) {
      values.push(filters.category.trim());
      conditions.push(`c.name = $${values.length}`);
    }

    if (filters.location?.trim()) {
      values.push(filters.location.trim());
      conditions.push(`l.name = $${values.length}`);
    }

    if (filters.color?.trim()) {
      values.push(filters.color.trim());
      conditions.push(`r.color ILIKE $${values.length}`);
    }

    if (
      filters.type?.trim() &&
      (filters.type.toUpperCase() === "LOST" ||
        filters.type.toUpperCase() === "FOUND")
    ) {
      values.push(filters.type.toUpperCase());
      conditions.push(`r.type = $${values.length}::"ReportType"`);
    }

    if (filters.dateFrom) {
      values.push(filters.dateFrom);
      conditions.push(`r.occurred_at >= $${values.length}::timestamp`);
    }

    if (filters.dateTo) {
      values.push(filters.dateTo);
      conditions.push(`r.occurred_at <= $${values.length}::timestamp`);
    }

    const whereClause = conditions.join(" AND ");

    const result = await this.database.query<ReportRow>(
      `SELECT r.id, r.type, r.title, c.name AS category, r.color, l.name AS location,
              r.occurred_at, r.status, r.public_description,
              (SELECT storage_key FROM item_images WHERE report_id = r.id ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS primary_image_key
         FROM item_reports r
         JOIN categories c ON c.id = r.category_id
         JOIN locations l ON l.id = r.location_id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC`,
      values,
    );
    return result.rows.map((row) => this.summary(row));
  }

  async discardPhoto(user: LocalUser, key: string) {
    if (
      typeof key !== "string" ||
      !key.startsWith(`${user.id}/`) ||
      !/^[0-9a-f-]+\/[0-9a-f-]+\.(jpeg|png|webp)$/.test(key)
    )
      throw new BadRequestException("Invalid photo.");
    return this.database.transaction(async (database) => {
      await database.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
      const owned = await database.query(
        "SELECT id FROM storage.objects WHERE bucket_id = 'report-photos' AND name = $1 AND owner_id = $2",
        [key, user.id],
      );
      if (!owned.rows[0]) throw new BadRequestException("Photo not found.");
      const used = await database.query(
        "SELECT id FROM item_images WHERE storage_key = $1",
        [key],
      );
      if (used.rows.length) return { removed: false };
      const client = createClient(
        this.supabaseUrl,
        this.config.getOrThrow<string>("SUPABASE_SECRET_KEY"),
      );
      const { error } = await client.storage
        .from("report-photos")
        .remove([key]);
      if (error)
        throw new BadRequestException("Photo cleanup could not be completed.");
      return { removed: true };
    });
  }

  async updates(userId: string) {
    return (
      await this.database.query(
        `SELECT n.id, n.type, n.title, n.body, n.data, n.created_at AS "createdAt", n.read_at AS "readAt",
          (SELECT r.id::text FROM item_reports r WHERE r.reporter_id = $1
            AND r.id::text IN (n.data->>'reportId', n.data->>'matchedReportId')
            ORDER BY r.created_at DESC LIMIT 1) AS "targetReportId"
       FROM notifications n WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 100`,
        [userId],
      )
    ).rows;
  }

  async unreadUpdates(userId: string) {
    const result = await this.database.query<{ unread: number }>(
      "SELECT count(*)::int AS unread FROM notifications WHERE user_id = $1 AND read_at IS NULL",
      [userId],
    );
    return result.rows[0] ?? { unread: 0 };
  }

  async readUpdate(userId: string, id: string) {
    const result = await this.database.query(
      "UPDATE notifications SET read_at = coalesce(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    if (!result.rows[0]) throw new NotFoundException("Update not found.");
    return { id };
  }

  async close(user: LocalUser, id: string) {
    return this.database.transaction(async (database) => {
      const result = await database.query(
        `UPDATE item_reports SET status = 'ARCHIVED', archived_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND reporter_id = $2 AND status IN ('OPEN', 'MATCHED') RETURNING id`,
        [id, user.id],
      );
      if (!result.rows[0])
        throw new BadRequestException(
          "Only your active reports without an ownership review can be closed.",
        );
      await database.query(
        "UPDATE item_matches SET status = 'DISMISSED', updated_at = NOW() WHERE lost_report_id = $1 OR found_report_id = $1",
        [id],
      );
      await this.refreshMatchStatuses(database);
      return { id };
    });
  }

  async update(user: LocalUser, id: string, input: CreateReportDto) {
    this.validateInput(input);
    return this.database.transaction(async (database) => {
      const result = await database.query(
        `UPDATE item_reports r SET title = $3, color = $4, category_id = c.id, location_id = l.id,
          public_description = $5, private_verification_details = $6, occurred_at = $7, status = 'OPEN', updated_at = NOW()
         FROM categories c, locations l WHERE r.id = $1 AND r.reporter_id = $2
          AND r.status IN ('OPEN','MATCHED') AND r.type = $10::"ReportType"
          AND c.name = $8 AND c.is_active AND l.name = $9 AND l.is_active RETURNING r.id`,
        [
          id,
          user.id,
          input.title.trim(),
          input.color.trim(),
          input.publicDescription?.trim() || null,
          input.privateVerificationDetails?.trim() || null,
          input.occurredAt,
          input.category,
          input.location,
          input.type,
        ],
      );
      if (!result.rows[0])
        throw new BadRequestException(
          "This report cannot be edited. Check its status, category and location.",
        );
      await database.query(
        "DELETE FROM item_matches WHERE lost_report_id = $1 OR found_report_id = $1",
        [id],
      );
      await this.refreshMatchStatuses(database);
      await this.createMatches(id, user.id, database);
      return { id };
    });
  }

  private async refreshMatchStatuses(database: Pick<DatabaseService, "query">) {
    await database.query(`UPDATE item_reports r SET status = 'OPEN', updated_at = NOW()
      WHERE r.status = 'MATCHED' AND NOT EXISTS (
        SELECT 1 FROM item_matches m JOIN item_reports other
        ON other.id = CASE WHEN m.lost_report_id = r.id THEN m.found_report_id ELSE m.lost_report_id END
        WHERE (m.lost_report_id = r.id OR m.found_report_id = r.id) AND m.status <> 'DISMISSED'
        AND other.status IN ('OPEN','MATCHED','CLAIM_PENDING'))`);
  }

  async findMine(userId: string): Promise<ItemReportSummary[]> {
    const result = await this.database.query<ReportRow>(
      `SELECT r.id, r.type, r.title, c.name AS category, r.color, l.name AS location,
              r.occurred_at, r.status, r.public_description,
              (SELECT storage_key FROM item_images WHERE report_id = r.id ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS primary_image_key
         FROM item_reports r
         JOIN categories c ON c.id = r.category_id
         JOIN locations l ON l.id = r.location_id
        WHERE r.reporter_id = $1
        ORDER BY r.created_at DESC`,
      [userId],
    );
    return result.rows.map((row) => this.summary(row));
  }

  async findOne(
    id: string,
    viewer?: LocalUser,
    database: Pick<DatabaseService, "query"> = this.database,
  ) {
    const result = await database.query<
      ReportRow & {
        public_description?: string;
        reporter_name?: string;
        reporter_id?: string;
        private_verification_details?: string;
      }
    >(
      `SELECT r.id, r.type, r.title, c.name AS category, r.color, l.name AS location,
              r.occurred_at, r.status, r.public_description, r.reporter_id, r.private_verification_details,
              u.display_name AS reporter_name,
              (SELECT storage_key FROM item_images WHERE report_id = r.id ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS primary_image_key
         FROM item_reports r
         JOIN categories c ON c.id = r.category_id
         JOIN locations l ON l.id = r.location_id
         JOIN users u ON u.id = r.reporter_id
        WHERE r.id = $1`,
      [id],
    );

    const report = result.rows[0];
    if (!report) throw new NotFoundException("Report not found.");

    const isOwner = !!viewer && viewer.id === report.reporter_id;
    if (
      ["DRAFT", "ARCHIVED"].includes(report.status) &&
      !isOwner &&
      viewer?.role !== "ADMIN"
    )
      throw new NotFoundException("Report not found.");
    const matches = isOwner
      ? await database.query<{
          id: string;
          title: string;
          status: string;
          reasons: string[];
        }>(
          `SELECT other.id, other.title, other.status, m.matched_reasons AS reasons
       FROM item_matches m JOIN item_reports other
       ON other.id = CASE WHEN m.lost_report_id = $1 THEN m.found_report_id ELSE m.lost_report_id END
       WHERE (m.lost_report_id = $1 OR m.found_report_id = $1) AND m.status <> 'DISMISSED'
       AND other.status IN ('OPEN', 'MATCHED', 'CLAIM_PENDING') ORDER BY m.score DESC`,
          [id],
        )
      : { rows: [] };

    const imagesResult = await database.query<{
      storage_key: string;
      is_primary: boolean;
    }>(
      `SELECT storage_key, is_primary FROM item_images WHERE report_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [id],
    );

    const imageUrls = imagesResult.rows.map(
      (img) =>
        `${this.supabaseUrl}/storage/v1/object/public/report-photos/${img.storage_key}`,
    );

    return {
      ...this.summary(report),
      publicDescription: report.public_description || undefined,
      isOwner,
      canRequest:
        !!viewer &&
        !isOwner &&
        report.type === "FOUND" &&
        ["OPEN", "MATCHED"].includes(report.status),
      ...(isOwner
        ? {
            privateVerificationDetails:
              report.private_verification_details || "",
          }
        : {}),
      matches: matches.rows,
      images: imageUrls,
    };
  }

  async create(
    reporter: LocalUser,
    input: CreateReportDto,
  ): Promise<ItemReportSummary> {
    this.validateInput(input);
    for (const image of input.images ?? []) {
      if (
        !image.storageKey.startsWith(`${reporter.id}/`) ||
        image.storageKey.includes("..")
      )
        throw new BadRequestException(
          "Upload your own photo before submitting.",
        );
    }
    return this.database.transaction(async (database) => {
      for (const image of input.images ?? []) {
        await database.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
          image.storageKey,
        ]);
        const owned = await database.query(
          "SELECT id FROM storage.objects WHERE bucket_id = 'report-photos' AND name = $1 AND owner_id = $2",
          [image.storageKey, reporter.id],
        );
        if (!owned.rows[0])
          throw new BadRequestException(
            "The photo is unavailable. Select it again and retry.",
          );
      }
      const result = await database.query<ReportRow>(
        `INSERT INTO item_reports (
          id, reporter_id, category_id, location_id, type, status, title, color,
          public_description, private_verification_details, occurred_at, created_at, updated_at
        )
       SELECT gen_random_uuid(), $1, c.id, l.id, $2, 'OPEN', $3, $4, $5, $6, $7, NOW(), NOW()
         FROM categories c CROSS JOIN locations l
        WHERE c.name = $8 AND c.is_active = TRUE AND l.name = $9 AND l.is_active = TRUE
       RETURNING id, type, title,
         (SELECT name FROM categories WHERE id = category_id) AS category,
         color,
         (SELECT name FROM locations WHERE id = location_id) AS location,
         occurred_at, status`,
        [
          reporter.id,
          input.type,
          input.title.trim(),
          input.color.trim(),
          input.publicDescription?.trim() || null,
          input.privateVerificationDetails?.trim() || null,
          input.occurredAt,
          input.category,
          input.location,
        ],
      );

      const report = result.rows[0];
      if (!report)
        throw new BadRequestException(
          "Choose an active item category and campus location.",
        );

      if (input.images && input.images.length > 0) {
        for (let i = 0; i < input.images.length; i++) {
          const img = input.images[i];
          if (img) {
            await database.query(
              `INSERT INTO item_images (id, report_id, storage_key, mime_type, size_bytes, is_primary, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
              [
                report.id,
                img.storageKey,
                img.mimeType || "image/jpeg",
                img.sizeBytes || 0,
                img.isPrimary ?? i === 0,
              ],
            );
          }
        }
      }

      await this.createMatches(report.id, reporter.id, database);

      return this.findOne(report.id, undefined, database);
    });
  }

  private async createMatches(
    reportId: string,
    reporterId: string,
    database: Pick<DatabaseService, "query"> = this.database,
  ) {
    const result = await database.query<{
      other_report_id: string;
      other_reporter_id: string;
      score: string;
      reasons: string[];
      conflicts: string[];
    }>(
      `WITH source AS (
         SELECT r.*, c.name AS category_name, l.name AS location_name FROM item_reports r
         JOIN categories c ON c.id = r.category_id JOIN locations l ON l.id = r.location_id WHERE r.id = $1
       ), candidates AS (
         SELECT o.id AS other_report_id, o.reporter_id AS other_reporter_id,
           40 + CASE WHEN lower(o.color) = lower(s.color) THEN 20 ELSE 0 END +
           CASE WHEN o.location_id = s.location_id THEN 15 ELSE 0 END +
           CASE WHEN abs(extract(epoch FROM (o.occurred_at - s.occurred_at))) <= 1209600 THEN 15 ELSE 0 END +
           CASE WHEN (lower(o.title) LIKE '%' || lower(s.title) || '%' OR lower(s.title) LIKE '%' || lower(o.title) || '%') THEN 10 ELSE 0 END AS score,
           array_remove(ARRAY[
             'same category',
             CASE WHEN lower(o.color) = lower(s.color) THEN 'same color' END,
             CASE WHEN o.location_id = s.location_id THEN 'same location' END,
             CASE WHEN abs(extract(epoch FROM (o.occurred_at - s.occurred_at))) <= 1209600 THEN 'nearby date' END,
             CASE WHEN (lower(o.title) LIKE '%' || lower(s.title) || '%' OR lower(s.title) LIKE '%' || lower(o.title) || '%') THEN 'similar title' END
           ], NULL) AS reasons,
           array_remove(ARRAY[
             CASE WHEN lower(o.color) <> lower(s.color) THEN 'different color' END,
             CASE WHEN o.location_id <> s.location_id THEN 'different location' END
           ], NULL) AS conflicts
         FROM item_reports o CROSS JOIN source s
         WHERE o.id <> s.id AND o.type <> s.type AND o.category_id = s.category_id
           AND o.status IN ('OPEN','MATCHED') AND s.status IN ('OPEN','MATCHED')
       ) SELECT * FROM candidates WHERE score >= 55`,
      [reportId],
    );

    for (const match of result.rows) {
      await database.query(
        `INSERT INTO item_matches (id, lost_report_id, found_report_id, score, matched_reasons, conflicting_attributes, status, created_at, updated_at)
         SELECT gen_random_uuid(), CASE WHEN r.type = 'LOST' THEN r.id ELSE $2::uuid END,
                CASE WHEN r.type = 'FOUND' THEN r.id ELSE $2::uuid END, $3, $4::jsonb, $5::jsonb, 'SUGGESTED', NOW(), NOW()
           FROM item_reports r WHERE r.id = $1
         ON CONFLICT (lost_report_id, found_report_id) DO NOTHING`,
        [
          reportId,
          match.other_report_id,
          match.score,
          JSON.stringify(match.reasons),
          JSON.stringify(match.conflicts),
        ],
      );

      await database.query(
        "UPDATE item_reports SET status = 'MATCHED', updated_at = NOW() WHERE id IN ($1, $2) AND status = 'OPEN'",
        [reportId, match.other_report_id],
      );

      await database.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
         VALUES (gen_random_uuid(), $1, 'MATCH_FOUND', 'Possible item match found', 'A report may match your item. Review it and submit a claim if it belongs to you.', $2::jsonb, NOW())`,
        [
          match.other_reporter_id,
          JSON.stringify({ reportId, matchedReportId: match.other_report_id }),
        ],
      );

      if (match.other_reporter_id !== reporterId) {
        await database.query(
          `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
           VALUES (gen_random_uuid(), $1, 'MATCH_FOUND', 'Possible item match found', 'A report may match your item. Review it and submit a claim if it belongs to you.', $2::jsonb, NOW())`,
          [
            reporterId,
            JSON.stringify({
              reportId,
              matchedReportId: match.other_report_id,
            }),
          ],
        );
      }
    }
  }
}
