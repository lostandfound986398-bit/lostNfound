import { PrismaPg } from "@prisma/adapter-pg";
import { parse } from "csv-parse/sync";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type UserRole } from "../generated/client/client.ts";

const REQUIRED_HEADERS = [
  "school_id",
  "full_name",
  "email",
  "role",
  "course",
  "year_level",
  "section",
  "position",
  "department",
  "is_active",
] as const;

type MasterListCsvRow = Record<(typeof REQUIRED_HEADERS)[number], string>;

interface ValidatedMasterPerson {
  schoolId: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  course: string | null;
  yearLevel: string | null;
  section: string | null;
  position: string | null;
  department: string | null;
  isActive: boolean;
}

function optional(value: string): string | null {
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function requireValue(value: string, field: string, rowNumber: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Row ${rowNumber}: ${field} is required.`);
  return normalized;
}

export function parseMasterList(csv: string): ValidatedMasterPerson[] {
  const records = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as MasterListCsvRow[];

  if (!records.length) throw new Error("The master list contains no data rows.");

  const parsedHeaders = Object.keys(records[0] ?? {});
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !parsedHeaders.includes(header));
  const unexpectedHeaders = parsedHeaders.filter(
    (header) => !REQUIRED_HEADERS.includes(header as (typeof REQUIRED_HEADERS)[number]),
  );
  if (missingHeaders.length || unexpectedHeaders.length) {
    throw new Error(
      `Invalid headers. Missing: ${missingHeaders.join(", ") || "none"}. Unexpected: ${unexpectedHeaders.join(", ") || "none"}.`,
    );
  }

  const ids = new Set<string>();
  const emails = new Set<string>();

  return records.map((record, index) => {
    const rowNumber = index + 2;
    const schoolId = requireValue(record.school_id, "school_id", rowNumber).toUpperCase();
    const fullName = requireValue(record.full_name, "full_name", rowNumber).replace(/\s+/g, " ");
    const email = optional(record.email)?.toLowerCase() ?? null;
    const role = requireValue(record.role, "role", rowNumber).toUpperCase();
    const course = optional(record.course);
    const yearLevel = optional(record.year_level);
    const section = optional(record.section);
    const position = optional(record.position);
    const department = optional(record.department);
    const activeText = requireValue(record.is_active, "is_active", rowNumber).toUpperCase();

    if (!(["STUDENT", "FACULTY", "STAFF"] as const).includes(role as "STUDENT" | "FACULTY" | "STAFF")) {
      throw new Error(`Row ${rowNumber}: role must be STUDENT, FACULTY, or STAFF.`);
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error(`Row ${rowNumber}: a valid email is required.`);
    }
    if (ids.has(schoolId)) throw new Error(`Row ${rowNumber}: duplicate school_id ${schoolId}.`);
    if (emails.has(email)) throw new Error(`Row ${rowNumber}: duplicate email ${email}.`);
    ids.add(schoolId);
    emails.add(email);

    if (role === "STUDENT" && (!course || !yearLevel || !section)) {
      throw new Error(`Row ${rowNumber}: students require course, year_level, and section.`);
    }
    if (role !== "STUDENT" && (!position || !department)) {
      throw new Error(`Row ${rowNumber}: faculty and staff require position and department.`);
    }
    if (!(["TRUE", "FALSE"] as const).includes(activeText as "TRUE" | "FALSE")) {
      throw new Error(`Row ${rowNumber}: is_active must be TRUE or FALSE.`);
    }

    return {
      schoolId,
      fullName,
      email,
      role: role as UserRole,
      course,
      yearLevel,
      section,
      position,
      department,
      isActive: activeText === "TRUE",
    };
  });
}

async function main() {
  config({
    path: fileURLToPath(new URL("../../../apps/api/.env", import.meta.url)),
    quiet: true,
  });

  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const inputArg = args.find((argument) => !argument.startsWith("--"));
  if (!inputArg) throw new Error("Provide a CSV path.");

  const inputPath = resolve(process.cwd(), inputArg);
  const people = parseMasterList(await readFile(inputPath, "utf8"));
  const counts = people.reduce(
    (result, person) => {
      result[person.role] += 1;
      result[person.isActive ? "active" : "inactive"] += 1;
      return result;
    },
    { STUDENT: 0, FACULTY: 0, STAFF: 0, ADMIN: 0, active: 0, inactive: 0 },
  );

  console.log(`Validated ${people.length} records from ${basename(inputPath)}.`);
  console.log(
    `Students: ${counts.STUDENT}; faculty: ${counts.FACULTY}; staff: ${counts.STAFF}; active: ${counts.active}; inactive: ${counts.inactive}.`,
  );

  if (!apply) {
    console.log("Dry run complete. No database records were changed.");
    return;
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const importBatch = `csv:${basename(inputPath)}:${new Date().toISOString()}`;

  try {
    await prisma.$transaction(async (transaction) => {
      for (const person of people) {
        const existing = await transaction.masterPerson.findUnique({
          where: { schoolId: person.schoolId },
          include: { user: { select: { id: true } } },
        });
        if (existing?.user && existing.role !== person.role) {
          throw new Error(
            `Cannot change role for registered account ${person.schoolId}; review it manually.`,
          );
        }

        await transaction.masterPerson.upsert({
          where: { schoolId: person.schoolId },
          create: { ...person, importBatch },
          update: { ...person, importBatch },
        });
      }
    });

    const imported = await prisma.masterPerson.groupBy({
      by: ["role", "isActive"],
      _count: { _all: true },
    });
    console.log(`Imported ${people.length} records in one transaction.`);
    console.log(JSON.stringify(imported, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;
if (isEntryPoint) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
