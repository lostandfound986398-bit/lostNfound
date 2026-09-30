import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import type { LocalUser } from "../auth/auth.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { CaseMessageDto } from "./dto/case-message.dto";

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async reportDetail(user: LocalUser, id: string) {
    this.admin(user);
    const result = await this.database.query(
      `SELECT r.id, r.title, r.type, r.status, r.color,
              r.public_description AS "publicDescription",
              r.private_verification_details AS "privateVerificationDetails",
              r.occurred_at AS "occurredAt", r.created_at AS "createdAt",
              c.name AS category, l.name AS location,
              u.display_name AS "reporterName", u.email AS "reporterEmail",
              mp.school_id AS "schoolId"
       FROM item_reports r
       JOIN categories c ON c.id = r.category_id
       JOIN locations l ON l.id = r.location_id
       JOIN users u ON u.id = r.reporter_id
       JOIN master_people mp ON mp.id = u.master_person_id
       WHERE r.id = $1`, [id],
    );
    if (!result.rows[0]) throw new NotFoundException("Report not found.");
    const images = await this.database.query(
      `SELECT storage_key AS "storageKey" FROM item_images WHERE report_id = $1 ORDER BY is_primary DESC, created_at`, [id],
    );
    const matches = await this.database.query(
      `SELECT other.id, other.title, other.status AS "reportStatus", m.status,
              m.score, m.matched_reasons AS reasons, l.name AS location,
              other.color, c.name AS category, other.occurred_at AS "occurredAt",
              other.public_description AS description,
              (SELECT storage_key FROM item_images WHERE report_id = other.id ORDER BY is_primary DESC, created_at LIMIT 1) AS "storageKey"
       FROM item_matches m
       JOIN item_reports other ON other.id = CASE WHEN m.lost_report_id = $1 THEN m.found_report_id ELSE m.lost_report_id END
       JOIN locations l ON l.id = other.location_id
       JOIN categories c ON c.id = other.category_id
       WHERE (m.lost_report_id = $1 OR m.found_report_id = $1) AND m.status <> 'DISMISSED'
       ORDER BY m.score DESC`, [id],
    );
    const claims = await this.database.query(
      `SELECT cl.id, cl.report_id AS "reportId", cl.status, cl.ownership_answers AS "ownershipAnswers",
              cl.created_at AS "createdAt", cl.review_notes AS "reviewNotes", r.title,
              u.display_name AS "claimantName"
       FROM claims cl JOIN item_reports r ON r.id = cl.report_id JOIN users u ON u.id = cl.claimant_id
       WHERE cl.report_id = $1 OR (cl.claimant_id = (SELECT reporter_id FROM item_reports WHERE id = $1 AND type = 'LOST')
         AND EXISTS (SELECT 1 FROM item_matches m WHERE m.lost_report_id = $1 AND m.found_report_id = cl.report_id))
       ORDER BY cl.created_at DESC`, [id],
    );
    const history = await this.database.query(
      `SELECT action, created_at AS "createdAt", after AS details FROM audit_logs
       WHERE (entity_type = 'REPORT' AND entity_id = $1)
          OR (entity_type = 'CLAIM' AND entity_id = ANY($2::text[]))
       ORDER BY created_at DESC`, [id, claims.rows.map(claim => claim.id)],
    );
    return { ...result.rows[0], images: images.rows, matches: matches.rows, claims: claims.rows, history: history.rows };
  }

  async messageReporter(user: LocalUser, id: string, input: CaseMessageDto) {
    this.admin(user);
    return this.database.transaction(async database => {
      const report = (await database.query("SELECT id, reporter_id, title, type, status FROM item_reports WHERE id = $1 FOR UPDATE", [id])).rows[0];
      if (!report) throw new NotFoundException("Report not found.");
      if (!["OPEN", "MATCHED"].includes(report.status)) throw new BadRequestException("This report is no longer awaiting matching. Review its requests instead.");
      let title = "Please add identifying details";
      let body = `Please open your report for "${report.title}" and use Edit report to add private identifying details so staff can verify it. Do not put sensitive details in the public description.`;
      if (input.kind === "MATCH") {
        if (report.type !== "LOST" || !input.matchId || input.reviewed !== true) throw new BadRequestException("Compare the items and confirm you reviewed the match first.");
        const match = (await database.query(
          `SELECT r.id, r.title, r.status, r.reporter_id FROM item_reports r
           JOIN item_matches m ON m.found_report_id = r.id
           WHERE m.lost_report_id = $1 AND r.id = $2 AND m.status <> 'DISMISSED' AND r.type = 'FOUND' FOR UPDATE OF r`, [id, input.matchId],
        )).rows[0];
        if (!match || !["OPEN", "MATCHED"].includes(match.status) || match.reporter_id === report.reporter_id) throw new BadRequestException("This item is not available for a new ownership request.");
        title = "Staff found a possible match";
        body = `Staff reviewed a possible match for your lost "${report.title}". Open "${match.title}" and compare the details. If it looks like yours, submit an ownership request with proof. This is a suggestion, not approval to collect the item.`;
      }
      const type = input.kind === "MATCH" ? "REPORT_MATCH_INVITATION" : "REPORT_DETAILS_REQUESTED";
      const duplicate = await database.query(
        `SELECT id FROM notifications WHERE user_id = $1 AND type = $2 AND data->>'reportId' = $3
         AND coalesce(data->>'matchedReportId', '') = $4 LIMIT 1`, [report.reporter_id, type, id, input.kind === "MATCH" ? input.matchId : ""],
      );
      if (duplicate.rows.length) return { message: "The student has already been notified. Check the case history." };
      const data = { reportId: id, ...(input.kind === "MATCH" ? { matchedReportId: input.matchId } : {}) };
      await database.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW())`, [report.reporter_id, type, title, body, JSON.stringify(data)],
      );
      await database.query(
        `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, after, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'REPORT', $3, $4::jsonb, NOW())`, [user.id, type, id, JSON.stringify(data)],
      );
      return { message: "Sent to the student's Updates. The action is recorded in this case history." };
    });
  }

  private admin(user: LocalUser) {
    if (user.role !== "ADMIN") throw new ForbiddenException("Administrator access is required.");
  }

  private async audit(user: LocalUser, action: string, entityType: string, entityId: string, payload?: unknown) {
    await this.database.query(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, after, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW())`,
      [user.id, action, entityType, entityId, payload ? JSON.stringify(payload) : null],
    );
  }

  async dashboard(user: LocalUser) {
    this.admin(user);
    const result = await this.database.query<{ lost: string; found: string; claims: string; users: string }>(
      `SELECT
        (SELECT count(*) FROM item_reports WHERE type = 'LOST' AND status <> 'ARCHIVED')::text AS lost,
        (SELECT count(*) FROM item_reports WHERE type = 'FOUND' AND status <> 'ARCHIVED')::text AS found,
        (SELECT count(*) FROM claims WHERE status IN ('PENDING','NEEDS_INFORMATION'))::text AS claims,
        (SELECT count(*) FROM users WHERE status = 'ACTIVE')::text AS users`,
    );

    const recent = await this.database.query(
      `SELECT r.id, r.title, r.type, r.status, r.created_at AS "createdAt", l.name AS location
         FROM item_reports r
         JOIN locations l ON l.id = r.location_id
        ORDER BY r.created_at DESC LIMIT 8`,
    );

    return { ...result.rows[0], recent: recent.rows };
  }

  async users(user: LocalUser) {
    this.admin(user);
    return (
      await this.database.query(
        `SELECT u.id, u.display_name AS "displayName", u.email, u.role, u.status,
                mp.school_id AS "schoolId", coalesce(mp.course, mp.department, '') AS "group"
           FROM users u
           JOIN master_people mp ON mp.id = u.master_person_id
          ORDER BY u.created_at DESC`,
      )
    ).rows;
  }

  async setUserStatus(user: LocalUser, id: string, active: boolean) {
    this.admin(user);
    const status = active ? "ACTIVE" : "DEACTIVATED";
    const result = await this.database.query("UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id", [status, id]);
    if (!result.rows[0]) throw new NotFoundException("User not found.");

    await this.audit(user, "SET_USER_STATUS", "USER", id, { status });
    return { id, status };
  }

  async masterList(user: LocalUser) {
    this.admin(user);
    return (
      await this.database.query(
        `SELECT mp.id, mp.school_id AS "schoolId", mp.full_name AS "fullName", mp.email, mp.role,
                mp.course, mp.year_level AS "yearLevel", mp.section, mp.position, mp.department,
                mp.is_active AS "isActive", u.status AS "accountStatus"
           FROM master_people mp
           LEFT JOIN users u ON u.master_person_id = mp.id
          ORDER BY mp.school_id ASC`,
      )
    ).rows;
  }

  async announcements(user: LocalUser) {
    this.admin(user);
    return (
      await this.database.query(
        `SELECT id, title, body, audience, published_at AS "publishedAt", expires_at AS "expiresAt", created_at AS "createdAt"
           FROM announcements
          ORDER BY created_at DESC`,
      )
    ).rows;
  }

  async createAnnouncement(user: LocalUser, input: CreateAnnouncementDto) {
    this.admin(user);
    const announcement = await this.database.query<{ id: string }>(
      `INSERT INTO announcements (id, title, body, audience, published_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3::"UserRole", NOW(), NOW()) RETURNING id`,
      [input.title.trim(), input.body.trim(), input.audience ?? null],
    );

    const announcementId = announcement.rows[0]?.id;
    if (announcementId) {
      await this.database.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
         SELECT gen_random_uuid(), id, 'ANNOUNCEMENT', $1, $2, $3::jsonb, NOW()
           FROM users
          WHERE status = 'ACTIVE' AND ($4::"UserRole" IS NULL OR role = $4::"UserRole")`,
        [input.title.trim(), input.body.trim(), JSON.stringify({ announcementId }), input.audience ?? null],
      );

      await this.audit(user, "CREATE_ANNOUNCEMENT", "ANNOUNCEMENT", announcementId, { title: input.title, audience: input.audience });
    }

    return announcement.rows[0];
  }

  async getCategories(user: LocalUser) {
    this.admin(user);
    return (await this.database.query(`SELECT id, name, is_active AS "isActive" FROM categories ORDER BY name`)).rows;
  }

  async createCategory(user: LocalUser, name: string) {
    this.admin(user);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException("Category name is required.");
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO categories (id, name, is_active, created_at) VALUES (gen_random_uuid(), $1, TRUE, NOW()) ON CONFLICT (name) DO UPDATE SET is_active = TRUE RETURNING id`,
      [cleanName],
    );
    await this.audit(user, "CREATE_CATEGORY", "CATEGORY", result.rows[0]?.id || cleanName, { name: cleanName });
    return result.rows[0];
  }

  async toggleCategory(user: LocalUser, id: string, active: boolean) {
    this.admin(user);
    await this.database.query(`UPDATE categories SET is_active = $1 WHERE id = $2`, [active, id]);
    await this.audit(user, "TOGGLE_CATEGORY", "CATEGORY", id, { active });
    return { id, active };
  }

  async getLocations(user: LocalUser) {
    this.admin(user);
    return (await this.database.query(`SELECT id, name, is_active AS "isActive" FROM locations ORDER BY name`)).rows;
  }

  async createLocation(user: LocalUser, name: string) {
    this.admin(user);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException("Location name is required.");
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO locations (id, name, is_active, created_at) VALUES (gen_random_uuid(), $1, TRUE, NOW()) ON CONFLICT (name) DO UPDATE SET is_active = TRUE RETURNING id`,
      [cleanName],
    );
    await this.audit(user, "CREATE_LOCATION", "LOCATION", result.rows[0]?.id || cleanName, { name: cleanName });
    return result.rows[0];
  }

  async toggleLocation(user: LocalUser, id: string, active: boolean) {
    this.admin(user);
    await this.database.query(`UPDATE locations SET is_active = $1 WHERE id = $2`, [active, id]);
    await this.audit(user, "TOGGLE_LOCATION", "LOCATION", id, { active });
    return { id, active };
  }

  async exportRows(user: LocalUser, kind: string) {
    this.admin(user);
    await this.audit(user, "EXPORT_DATA", "SYSTEM", kind, { kind });

    let sql = "";

    switch (kind) {
      case "claims":
        sql = `SELECT cl.id, cl.status, r.title AS item, u.display_name AS claimant, u.email AS claimant_email, cl.created_at FROM claims cl JOIN item_reports r ON r.id = cl.report_id JOIN users u ON u.id = cl.claimant_id ORDER BY cl.created_at DESC`;
        break;
      case "lost_summary":
        sql = `SELECT c.name AS category, count(r.id) AS total_lost_reports, count(CASE WHEN r.status = 'CLAIMED' THEN 1 END) AS resolved_count FROM item_reports r JOIN categories c ON c.id = r.category_id WHERE r.type = 'LOST' GROUP BY c.name ORDER BY total_lost_reports DESC`;
        break;
      case "found_summary":
        sql = `SELECT l.name AS location, count(r.id) AS total_found_reports, count(CASE WHEN r.status = 'CLAIMED' THEN 1 END) AS claimed_count FROM item_reports r JOIN locations l ON l.id = r.location_id WHERE r.type = 'FOUND' GROUP BY l.name ORDER BY total_found_reports DESC`;
        break;
      case "resolution_rate":
        sql = `SELECT (SELECT count(*) FROM item_reports WHERE type = 'LOST') AS total_lost, (SELECT count(*) FROM item_reports WHERE type = 'FOUND') AS total_found, (SELECT count(*) FROM claims) AS total_claims, (SELECT count(*) FROM claims WHERE status = 'RELEASED') AS released_claims`;
        break;
      case "location_hotspots":
        sql = `SELECT l.name AS location, count(r.id) AS report_count FROM item_reports r JOIN locations l ON l.id = r.location_id GROUP BY l.name ORDER BY report_count DESC`;
        break;
      case "category_breakdown":
        sql = `SELECT c.name AS category, count(r.id) AS report_count FROM item_reports r JOIN categories c ON c.id = r.category_id GROUP BY c.name ORDER BY report_count DESC`;
        break;
      case "monthly_activity":
        sql = `SELECT to_char(created_at, 'YYYY-MM') AS month, count(id) AS total_reports FROM item_reports GROUP BY month ORDER BY month DESC`;
        break;
      case "audit_logs":
        sql = `SELECT a.id, a.action, a.entity_type, a.entity_id, u.display_name AS actor, a.created_at FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 500`;
        break;
      default:
        sql = `SELECT r.id, r.type, r.status, r.title, c.name AS category, r.color, l.name AS location, r.occurred_at, r.created_at FROM item_reports r JOIN categories c ON c.id = r.category_id JOIN locations l ON l.id = r.location_id ORDER BY r.created_at DESC`;
        break;
    }

    return (await this.database.query(sql)).rows;
  }
}
