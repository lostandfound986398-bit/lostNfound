import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../../database/database.service";
import type { LocalUser } from "../auth/auth.service";
import { CreateClaimDto, ReviewClaimDto } from "./dto/create-claim.dto";

@Injectable()
export class ClaimsService {
  private readonly collectionOffice: string;

  constructor(
    private readonly database: DatabaseService,
    config: ConfigService,
  ) {
    this.collectionOffice = config.get(
      "LOST_FOUND_OFFICE",
      "CBEA Faculty Office",
    );
  }

  async create(user: LocalUser, input: CreateClaimDto) {
    const statement = input.ownershipAnswers?.claimantStatement;
    if (
      typeof statement !== "string" ||
      !statement.trim() ||
      statement.length > 2000
    )
      throw new BadRequestException(
        "Provide ownership details of up to 2,000 characters.",
      );
    return this.database.transaction(async (database) => {
      const report = await database.query<{ id: string }>(
        `SELECT id FROM item_reports WHERE id = $1 AND type = 'FOUND' AND reporter_id <> $2
         AND status IN ('OPEN','MATCHED') FOR UPDATE`,
        [input.reportId, user.id],
      );
      if (!report.rows[0])
        throw new BadRequestException(
          "This item is already under review, closed, or was reported by you.",
        );
      const result = await database.query<{ id: string }>(
        `INSERT INTO claims (id, report_id, claimant_id, status, ownership_answers, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'PENDING', $3::jsonb, NOW(), NOW()) RETURNING id`,
        [
          input.reportId,
          user.id,
          JSON.stringify({ claimantStatement: statement.trim() }),
        ],
      );
      await database.query(
        "UPDATE item_reports SET status = 'CLAIM_PENDING', updated_at = NOW() WHERE id = $1",
        [input.reportId],
      );
      return result.rows[0];
    });
  }

  async reply(user: LocalUser, id: string, message: string) {
    if (!message.trim())
      throw new BadRequestException("Enter the additional ownership details.");
    const result = await this.database.query(
      `UPDATE claims SET ownership_answers = jsonb_set(ownership_answers, '{additionalInformation}',
        coalesce(ownership_answers->'additionalInformation', '[]'::jsonb) || jsonb_build_array($3::text)),
        status = 'PENDING', updated_at = NOW()
       WHERE id = $1 AND claimant_id = $2 AND status = 'NEEDS_INFORMATION' RETURNING id`,
      [id, user.id, message.trim()],
    );
    if (!result.rows[0])
      throw new BadRequestException(
        "This request is no longer waiting for more information. Refresh the page.",
      );
    return result.rows[0];
  }

  async mine(userId: string) {
    return (
      await this.database.query(
        `SELECT cl.id, cl.status, cl.review_notes AS "reviewNotes", cl.created_at AS "createdAt", r.id AS "reportId", r.title,
                c.name AS category, l.name AS location
           FROM claims cl
           JOIN item_reports r ON r.id = cl.report_id
           JOIN categories c ON c.id = r.category_id
           JOIN locations l ON l.id = r.location_id
          WHERE cl.claimant_id = $1
          ORDER BY cl.created_at DESC`,
        [userId],
      )
    ).rows;
  }

  async all(user: LocalUser) {
    this.requireAdmin(user);
    return (
      await this.database.query(
        `SELECT cl.id, cl.status, cl.ownership_answers AS "ownershipAnswers", cl.review_notes AS "reviewNotes", cl.created_at AS "createdAt",
                r.id AS "reportId", r.title, r.color, c.name AS category, l.name AS location,
                u.display_name AS "claimantName", u.email AS "claimantEmail"
           FROM claims cl
           JOIN item_reports r ON r.id = cl.report_id
           JOIN categories c ON c.id = r.category_id
           JOIN locations l ON l.id = r.location_id
           JOIN users u ON u.id = cl.claimant_id
          ORDER BY cl.created_at DESC`,
      )
    ).rows;
  }

  async review(admin: LocalUser, claimId: string, input: ReviewClaimDto) {
    this.requireAdmin(admin);
    return this.database.transaction(async (database) => {
      const claim = await database.query<{
        claimant_id: string;
        report_id: string;
        title: string;
      }>(
        "SELECT cl.claimant_id, cl.report_id, r.title FROM claims cl JOIN item_reports r ON r.id = cl.report_id WHERE cl.id = $1",
        [claimId],
      );
      if (!claim.rows[0]) throw new NotFoundException("Claim not found.");
      const record = claim.rows[0];
      await database.query(
        "SELECT id FROM item_reports WHERE id = $1 FOR UPDATE",
        [record.report_id],
      );
      const current = await database.query<{ status: string }>(
        "SELECT status FROM claims WHERE id = $1 FOR UPDATE",
        [claimId],
      );
      const status = current.rows[0]?.status;
      const allowed: Record<string, string[]> = {
        PENDING: ["NEEDS_INFORMATION", "APPROVED", "REJECTED"],
        NEEDS_INFORMATION: ["NEEDS_INFORMATION", "APPROVED", "REJECTED"],
        APPROVED: ["RELEASED", "REJECTED"],
      };
      if (!status || !allowed[status]?.includes(input.status))
        throw new BadRequestException(
          "This decision is no longer available. Refresh the request before reviewing it.",
        );
      if (
        ["NEEDS_INFORMATION", "REJECTED"].includes(input.status) &&
        !input.notes.trim()
      )
        throw new BadRequestException(
          "Explain what information is needed or why the request was not approved.",
        );

      if (input.status === "RELEASED") {
        await database.query(
          `INSERT INTO release_transactions (id, claim_id, released_by_id, identity_method, notes, released_at)
         VALUES (gen_random_uuid(), $1, $2, 'SCHOOL_ID', $3, NOW())
         ON CONFLICT (claim_id) DO NOTHING`,
          [claimId, admin.id, input.notes || null],
        );
      }

      await database.query(
        `UPDATE claims SET status = $1, review_notes = $2, reviewed_by_id = $3, reviewed_at = NOW(), updated_at = NOW() WHERE id = $4`,
        [input.status, input.notes || null, admin.id, claimId],
      );

      const reportStatus =
        input.status === "RELEASED"
          ? "CLAIMED"
          : input.status === "REJECTED"
            ? "OPEN"
            : "CLAIM_PENDING";
      await database.query(
        "UPDATE item_reports SET status = $1, updated_at = NOW() WHERE id = $2",
        [reportStatus, record.report_id],
      );

      let notifTitle = `Claim Update: ${input.status}`;
      let notifBody = `Your claim for ${record.title} has been updated to ${input.status}.`;

      if (input.status === "APPROVED") {
        const staffInstructions = input.notes.trim()
          ? ` Staff instructions: ${input.notes.trim()}`
          : "";
        notifTitle = `Claim your item at the ${this.collectionOffice}`;
        notifBody = `Your ownership request for "${record.title}" was approved. Claim your item at the ${this.collectionOffice}. Bring your school ID for verification.${staffInstructions}`;
      } else if (input.status === "RELEASED") {
        notifTitle = `Item Successfully Released`;
        notifBody = `Your item "${record.title}" has been verified and officially RELEASED to you. It is now marked as returned to rightful owner.`;
      } else if (input.status === "NEEDS_INFORMATION") {
        notifTitle = `Claim Requires Additional Details`;
        notifBody = `Your claim for "${record.title}" requires further proof. ${input.notes ? "Note from staff: " + input.notes : "Please contact custody office."}`;
      } else if (input.status === "REJECTED") {
        notifTitle = `Claim Not Approved`;
        notifBody = `Your claim for "${record.title}" was not approved. ${input.notes ? "Reason: " + input.notes : ""}`;
      }

      await database.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW())`,
        [
          record.claimant_id,
          `CLAIM_${input.status}`,
          notifTitle,
          notifBody,
          JSON.stringify({ claimId, reportId: record.report_id }),
        ],
      );

      await database.query(
        `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, after, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'CLAIM', $3, $4::jsonb, NOW())`,
        [
          admin.id,
          `REVIEW_CLAIM_${input.status}`,
          claimId,
          JSON.stringify({ status: input.status, notes: input.notes }),
        ],
      );

      return { id: claimId, status: input.status };
    });
  }

  private requireAdmin(user: LocalUser) {
    if (user.role !== "ADMIN")
      throw new ForbiddenException("Administrator access is required.");
  }
}
