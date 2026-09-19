import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
    config: ConfigService,
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

  async options() {
    const [categories, locations] = await Promise.all([
      this.database.query<{ name: string }>("SELECT name FROM categories WHERE is_active = TRUE ORDER BY name"),
      this.database.query<{ name: string }>("SELECT name FROM locations WHERE is_active = TRUE ORDER BY name"),
    ]);
    return {
      categories: categories.rows.map((row) => row.name),
      locations: locations.rows.map((row) => row.name),
    };
  }

  async findAll(filters: SearchFilterOptions = {}): Promise<ItemReportSummary[]> {
    const conditions: string[] = ["r.status IN ('OPEN', 'MATCHED', 'CLAIM_PENDING', 'CLAIMED')"];
    const values: unknown[] = [];

    if (filters.query?.trim()) {
      values.push(filters.query.trim());
      conditions.push(`concat_ws(' ', r.title, r.color, c.name, l.name, coalesce(r.public_description, '')) ILIKE '%' || $${values.length} || '%'`);
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

    if (filters.type?.trim() && (filters.type.toUpperCase() === "LOST" || filters.type.toUpperCase() === "FOUND")) {
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

  async findOne(id: string) {
    const result = await this.database.query<ReportRow & {
      public_description?: string;
      reporter_name?: string;
      reporter_id?: string;
    }>(
      `SELECT r.id, r.type, r.title, c.name AS category, r.color, l.name AS location,
              r.occurred_at, r.status, r.public_description, r.reporter_id,
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

    const imagesResult = await this.database.query<{ storage_key: string; is_primary: boolean }>(
      `SELECT storage_key, is_primary FROM item_images WHERE report_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [id],
    );

    const imageUrls = imagesResult.rows.map(
      (img) => `${this.supabaseUrl}/storage/v1/object/public/report-photos/${img.storage_key}`,
    );

    return {
      ...this.summary(report),
      publicDescription: report.public_description || undefined,
      reporterName: report.reporter_name,
      images: imageUrls,
    };
  }

  async create(reporter: LocalUser, input: CreateReportDto): Promise<ItemReportSummary> {
    const result = await this.database.query<ReportRow>(
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
    if (!report) throw new BadRequestException("Choose an active item category and campus location.");

    if (input.images && input.images.length > 0) {
      for (let i = 0; i < input.images.length; i++) {
        const img = input.images[i];
        if (img) {
          await this.database.query(
            `INSERT INTO item_images (id, report_id, storage_key, mime_type, size_bytes, is_primary, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
            [report.id, img.storageKey, img.mimeType || "image/jpeg", img.sizeBytes || 0, img.isPrimary ?? (i === 0)],
          );
        }
      }
    }

    await this.createMatches(report.id, reporter.id);

    return this.findOne(report.id);
  }

  private async createMatches(reportId: string, reporterId: string) {
    const result = await this.database.query<{
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
      await this.database.query(
        `INSERT INTO item_matches (id, lost_report_id, found_report_id, score, matched_reasons, conflicting_attributes, status, created_at, updated_at)
         SELECT gen_random_uuid(), CASE WHEN r.type = 'LOST' THEN r.id ELSE $2::uuid END,
                CASE WHEN r.type = 'FOUND' THEN r.id ELSE $2::uuid END, $3, $4::jsonb, $5::jsonb, 'SUGGESTED', NOW(), NOW()
           FROM item_reports r WHERE r.id = $1
         ON CONFLICT (lost_report_id, found_report_id) DO NOTHING`,
        [reportId, match.other_report_id, match.score, JSON.stringify(match.reasons), JSON.stringify(match.conflicts)],
      );

      await this.database.query(
        "UPDATE item_reports SET status = 'MATCHED', updated_at = NOW() WHERE id IN ($1, $2) AND status = 'OPEN'",
        [reportId, match.other_report_id],
      );

      await this.database.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
         VALUES (gen_random_uuid(), $1, 'MATCH_FOUND', 'Possible item match found', 'A report may match your item. Review it and submit a claim if it belongs to you.', $2::jsonb, NOW())`,
        [match.other_reporter_id, JSON.stringify({ reportId, matchedReportId: match.other_report_id })],
      );

      if (match.other_reporter_id !== reporterId) {
        await this.database.query(
          `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
           VALUES (gen_random_uuid(), $1, 'MATCH_FOUND', 'Possible item match found', 'A report may match your item. Review it and submit a claim if it belongs to you.', $2::jsonb, NOW())`,
          [reporterId, JSON.stringify({ reportId, matchedReportId: match.other_report_id })],
        );
      }
    }
  }
}
