import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import type { LocalUser } from "../auth/auth.service";
import { CreateClaimDto, ReviewClaimDto } from "./dto/create-claim.dto";

@Injectable()
export class ClaimsService {
  constructor(private readonly database: DatabaseService) {}

  async create(user: LocalUser, input: CreateClaimDto) {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO claims (id, report_id, claimant_id, status, ownership_answers, created_at, updated_at)
       SELECT gen_random_uuid(), r.id, $1, 'PENDING', $2::jsonb, NOW(), NOW() FROM item_reports r
        WHERE r.id = $3 AND r.type = 'FOUND' AND r.reporter_id <> $1 AND r.status IN ('OPEN','MATCHED')
       RETURNING id`,
      [user.id, JSON.stringify(input.ownershipAnswers), input.reportId],
    );
    if (!result.rows[0]) throw new BadRequestException("This found item is not available to claim.");
    await this.database.query("UPDATE item_reports SET status = 'CLAIM_PENDING', updated_at = NOW() WHERE id = $1", [input.reportId]);
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
    const claim = await this.database.query<{ claimant_id: string; report_id: string; title: string }>(
      "SELECT cl.claimant_id, cl.report_id, r.title FROM claims cl JOIN item_reports r ON r.id = cl.report_id WHERE cl.id = $1",
      [claimId],
    );
    if (!claim.rows[0]) throw new NotFoundException("Claim not found.");
    const record = claim.rows[0];

    if (input.status === "RELEASED") {
      await this.database.query(
        `INSERT INTO release_transactions (id, claim_id, released_by_id, identity_method, notes, released_at)
         VALUES (gen_random_uuid(), $1, $2, 'SCHOOL_ID', $3, NOW())
         ON CONFLICT (claim_id) DO NOTHING`,
        [claimId, admin.id, input.notes || null],
      );
    }

    await this.database.query(
      `UPDATE claims SET status = $1, review_notes = $2, reviewed_by_id = $3, reviewed_at = NOW(), updated_at = NOW() WHERE id = $4`,
      [input.status, input.notes || null, admin.id, claimId],
    );

    const reportStatus = input.status === "RELEASED" ? "CLAIMED" : input.status === "REJECTED" ? "OPEN" : "CLAIM_PENDING";
    await this.database.query("UPDATE item_reports SET status = $1, updated_at = NOW() WHERE id = $2", [reportStatus, record.report_id]);

    let notifTitle = `Claim Update: ${input.status}`;
    let notifBody = `Your claim for ${record.title} has been updated to ${input.status}.`;

    if (input.status === "APPROVED") {
      notifTitle = `Claim Approved - Pick Up Item at CBEA Building`;
      notifBody = `Your claim for "${record.title}" has been APPROVED! Please bring your official School ID to the CBEA Building (Custody Office) so staff can verify your identity and release the item to you.`;
    } else if (input.status === "RELEASED") {
      notifTitle = `Item Successfully Released`;
      notifBody = `Your item "${record.title}" has been verified and officially RELEASED to you. It is now marked as returned to rightful owner.`;
    } else if (input.status === "NEEDS_INFORMATION") {
      notifTitle = `Claim Requires Additional Details`;
      notifBody = `Your claim for "${record.title}" requires further proof. ${input.notes ? 'Note from staff: ' + input.notes : 'Please contact custody office.'}`;
    } else if (input.status === "REJECTED") {
      notifTitle = `Claim Not Approved`;
      notifBody = `Your claim for "${record.title}" was not approved. ${input.notes ? 'Reason: ' + input.notes : ''}`;
    }

    await this.database.query(
      `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW())`,
      [record.claimant_id, `CLAIM_${input.status}`, notifTitle, notifBody, JSON.stringify({ claimId, reportId: record.report_id })],
    );

    await this.database.query(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, after, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'CLAIM', $3, $4::jsonb, NOW())`,
      [admin.id, `REVIEW_CLAIM_${input.status}`, claimId, JSON.stringify({ status: input.status, notes: input.notes })],
    );

    return { id: claimId, status: input.status };
  }

  private requireAdmin(user: LocalUser) {
    if (user.role !== "ADMIN") throw new ForbiddenException("Administrator access is required.");
  }
}
