import { sql } from "drizzle-orm";
import { scholars } from "@shared/schema";
import { pool } from "../db";

let hasFeesDueColumnPromise: Promise<boolean> | undefined;

async function scholarHasFeesDueColumn(): Promise<boolean> {
  if (!hasFeesDueColumnPromise) {
    hasFeesDueColumnPromise = pool
      .query<{ column_exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = $1
              AND table_name = $2
              AND column_name = $3
          ) AS column_exists
        `,
        ["public", "scholars", "has_fees_due"],
      )
      .then((result) => Boolean(result.rows[0]?.column_exists))
      .catch(() => false);
  }

  return hasFeesDueColumnPromise;
}

function buildScholarSelect(includeFeesDue: boolean) {
  return {
    scholarId: scholars.scholarId,
    userId: scholars.userId,
    batch: scholars.batch,
    status: scholars.status,
    lifecycleStatus: scholars.lifecycleStatus,
    department: scholars.department,
    researchArea: scholars.researchArea,
    researchTitle: scholars.researchTitle,
    joiningDate: scholars.joiningDate,
    phase: scholars.phase,
    programme: scholars.programme,
    location: scholars.location,
    supervisorId: scholars.supervisorId,
    coSupervisorId: scholars.coSupervisorId,
    extensionMonthsGranted: scholars.extensionMonthsGranted,
    lastExtensionApprovedAt: scholars.lastExtensionApprovedAt,
    fatherName: scholars.fatherName,
    parentMobile: scholars.parentMobile,
    aadhaar: scholars.aadhaar,
    nationality: scholars.nationality,
    address: scholars.address,
    tenthBoard: scholars.tenthBoard,
    tenthPercentage: scholars.tenthPercentage,
    interBoard: scholars.interBoard,
    interPercentage: scholars.interPercentage,
    hasFeesDue: includeFeesDue ? scholars.hasFeesDue : sql<boolean>`false`,
    createdAt: scholars.createdAt,
    updatedAt: scholars.updatedAt,
  };
}

export async function getScholarSelectFields() {
  return buildScholarSelect(await scholarHasFeesDueColumn());
}

export async function sanitizeScholarWrite<T extends Record<string, unknown>>(
  values: T,
): Promise<T> {
  if ((await scholarHasFeesDueColumn()) || !("hasFeesDue" in values)) {
    return values;
  }

  const { hasFeesDue: _ignored, ...rest } = values as T & {
    hasFeesDue?: unknown;
  };

  return rest as T;
}