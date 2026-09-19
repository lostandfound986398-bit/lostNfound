export const userRoles = ["STUDENT", "FACULTY", "STAFF", "ADMIN"] as const;
export type UserRole = (typeof userRoles)[number];

export const reportTypes = ["LOST", "FOUND"] as const;
export type ReportType = (typeof reportTypes)[number];

export const reportStatuses = [
  "DRAFT",
  "OPEN",
  "MATCHED",
  "CLAIM_PENDING",
  "CLAIMED",
  "ARCHIVED",
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const claimStatuses = [
  "PENDING",
  "NEEDS_INFORMATION",
  "APPROVED",
  "REJECTED",
  "RELEASED",
] as const;
export type ClaimStatus = (typeof claimStatuses)[number];

export interface ItemReportSummary {
  id: string;
  type: ReportType;
  title: string;
  category: string;
  color: string;
  location: string;
  occurredAt: string;
  status: ReportStatus;
  imageUrl?: string;
}

export interface MatchExplanation {
  score: number;
  reasons: string[];
  conflictingAttributes: string[];
}

