import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  applicationReviews,
  drcChairmanDecisions,
  drcMeetingApplications,
  drcMeetingMinutes,
  type DocumentSignature,
  type InsertDocumentSignature,
} from "@shared/schema";

export type SignatureEntityType = "application" | "drc_meeting_agenda";

export interface NormalizedSignature {
  signerId: string;
  signerName: string;
  signerRole: string;
  label: string;
  signedAt: Date | null;
  assetPath: string | null;
  metadata: unknown;
  isPending: boolean;
}

const APPLICATION_STAGE_SIGNATURES: Array<{ stage: string; label: string; role: string }> = [
  { stage: "drc", label: "DRC Review", role: "DRC Member" },
  { stage: "irc", label: "IRC Review", role: "IRC Member" },
  { stage: "doaa", label: "DoAA Review", role: "DoAA Member" },
];

export class SignatureResolverService {
  async getSignaturesForApplication(applicationId: number): Promise<NormalizedSignature[]> {
    const reviewRows = await db
      .select()
      .from(applicationReviews)
      .where(eq(applicationReviews.applicationId, applicationId))
      .orderBy(asc(applicationReviews.reviewDate));

    const latestByStage = new Map<string, typeof reviewRows[number]>();
    for (const row of reviewRows) {
      latestByStage.set(row.stage, row);
    }

    const resolved: InsertDocumentSignature[] = [];

    for (const stageDef of APPLICATION_STAGE_SIGNATURES) {
      const review = latestByStage.get(stageDef.stage);
      if (!review) {
        continue;
      }

      const signer = await storage.getUserByEmployeeId(review.reviewerId);

      resolved.push({
        entityType: "application",
        entityId: applicationId,
        signerId: review.reviewerId,
        signerName: signer?.name ?? review.reviewerId,
        signerRole: stageDef.role,
        label: stageDef.label,
        signedAt: review.reviewDate ?? null,
        assetPath: null,
        metadata: {
          stage: review.stage,
          decision: review.decision,
          remarks: review.remarks,
        },
      });
    }

    const chairmanDecision = await db
      .select()
      .from(drcChairmanDecisions)
      .where(eq(drcChairmanDecisions.applicationId, applicationId))
      .orderBy(desc(drcChairmanDecisions.decidedAt))
      .limit(1);

    if (chairmanDecision[0]) {
      const signer = await storage.getUserByEmployeeId(chairmanDecision[0].chairmanId);
      resolved.push({
        entityType: "application",
        entityId: applicationId,
        signerId: chairmanDecision[0].chairmanId,
        signerName: signer?.name ?? chairmanDecision[0].chairmanId,
        signerRole: "DRC Chairman",
        label: "Chairman Decision",
        signedAt: chairmanDecision[0].decidedAt ?? null,
        assetPath: null,
        metadata: {
          decision: chairmanDecision[0].decision,
          remarks: chairmanDecision[0].remarks,
          meetingId: chairmanDecision[0].meetingId,
        },
      });
    }

    if (resolved.length > 0) {
      await storage.upsertSignatures(resolved);
    }

    const persisted = await storage.getSignaturesByEntity("application", applicationId);

    return toNormalizedWithPending(persisted, [
      { signerRole: "DRC Member", label: "DRC Review" },
      { signerRole: "IRC Member", label: "IRC Review" },
      { signerRole: "DoAA Member", label: "DoAA Review" },
      { signerRole: "DRC Chairman", label: "Chairman Decision" },
    ]);
  }

  async getSignaturesForMeetingAgenda(meetingId: number): Promise<NormalizedSignature[]> {
    const [minutes] = await db
      .select()
      .from(drcMeetingMinutes)
      .where(eq(drcMeetingMinutes.meetingId, meetingId))
      .limit(1);

    const [chairmanDecision] = await db
      .select()
      .from(drcChairmanDecisions)
      .where(eq(drcChairmanDecisions.meetingId, meetingId))
      .orderBy(desc(drcChairmanDecisions.decidedAt))
      .limit(1);

    const resolved: InsertDocumentSignature[] = [];

    if (minutes?.generatedBy) {
      const signer = await storage.getUserByEmployeeId(minutes.generatedBy);
      resolved.push({
        entityType: "drc_meeting_agenda",
        entityId: meetingId,
        signerId: minutes.generatedBy,
        signerName: signer?.name ?? minutes.generatedBy,
        signerRole: "DRC Convener",
        label: "Agenda Prepared By",
        signedAt: minutes.generatedAt ?? null,
        assetPath: null,
        metadata: {
          source: "drc_meeting_minutes",
        },
      });
    }

    if (chairmanDecision?.chairmanId) {
      const signer = await storage.getUserByEmployeeId(chairmanDecision.chairmanId);
      resolved.push({
        entityType: "drc_meeting_agenda",
        entityId: meetingId,
        signerId: chairmanDecision.chairmanId,
        signerName: signer?.name ?? chairmanDecision.chairmanId,
        signerRole: "DRC Chairman",
        label: "Agenda Approved By",
        signedAt: chairmanDecision.decidedAt ?? null,
        assetPath: null,
        metadata: {
          source: "drc_chairman_decisions",
          decision: chairmanDecision.decision,
        },
      });
    }

    if (resolved.length > 0) {
      await storage.upsertSignatures(resolved);
    }

    const persisted = await storage.getSignaturesByEntity("drc_meeting_agenda", meetingId);

    return toNormalizedWithPending(persisted, [
      { signerRole: "DRC Convener", label: "Agenda Prepared By" },
      { signerRole: "DRC Chairman", label: "Agenda Approved By" },
    ]);
  }
}

function toNormalizedWithPending(
  signatures: DocumentSignature[],
  expected: Array<{ signerRole: string; label: string }>,
): NormalizedSignature[] {
  const resolved = signatures.map((signature) => ({
    signerId: signature.signerId,
    signerName: signature.signerName,
    signerRole: signature.signerRole,
    label: signature.label,
    signedAt: signature.signedAt ?? null,
    assetPath: signature.assetPath ?? null,
    metadata: signature.metadata ?? null,
    isPending: !signature.signedAt,
  }));

  for (const entry of expected) {
    const has = resolved.some((item) => item.label === entry.label);
    if (!has) {
      resolved.push({
        signerId: `pending:${entry.signerRole}`,
        signerName: "Pending signature",
        signerRole: entry.signerRole,
        label: entry.label,
        signedAt: null,
        assetPath: null,
        metadata: null,
        isPending: true,
      });
    }
  }

  return resolved;
}

export const signatureResolverService = new SignatureResolverService();
