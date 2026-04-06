import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
  applications,
  applicationReviews,
  drcChairmanDecisions,
  drcMeetingApplications,
  drcMeetings,
  drcMinuteItems,
  noticeDismissals,
  notices,
  scholars,
  users,
  type Application,
  type ApplicationReview,
  type DrcChairmanDecision,
  type DrcMeeting,
  type DrcMinuteItem,
  type Notice,
  type NotificationType,
} from "@shared/schema";
import { getScholarSelectFields } from "./scholar-compat";

export class DrcMeetingRepository {
  async createMeeting(input: {
    meetingDate: Date;
    scheduledBy: string;
  }): Promise<DrcMeeting> {
    const [meeting] = await db
      .insert(drcMeetings)
      .values({
        meetingDate: input.meetingDate,
        scheduledBy: input.scheduledBy,
      })
      .returning();

    return meeting;
  }

  async addMeetingApplications(
    meetingId: number,
    applicationIds: number[],
  ): Promise<void> {
    if (applicationIds.length === 0) {
      return;
    }

    await db.insert(drcMeetingApplications).values(
      applicationIds.map((applicationId) => ({
        meetingId,
        applicationId,
      })),
    );
  }

  async addAgendaPoints(
    meetingId: number,
    points: string[],
  ): Promise<Array<{ point: string; createdAt: string }>> {
    if (points.length === 0) {
      return [];
    }

    const newItems = points.map((point) => ({
      point,
      createdAt: new Date().toISOString(),
    }));

    const [meeting] = await db
      .update(drcMeetings)
      .set({
        agendaPoints: sql`agenda_points || ${JSON.stringify(newItems)}::jsonb`,
      })
      .where(eq(drcMeetings.id, meetingId))
      .returning();

    return (meeting.agendaPoints as typeof newItems) || [];
  }

  async getPendingDrcApplications(): Promise<Application[]> {
    const scholarFields = await getScholarSelectFields();
    const rows = await db
      .select({
        applications,
        scholars: scholarFields,
        users,
      })
      .from(applications)
      .leftJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(and(eq(applications.currentStage, "drc"), eq(applications.status, "Pending")))
      .orderBy(desc(applications.submissionDate));

    return rows.map((row) => {
      const scholarData =
        row.scholars && row.users
          ? {
              scholarId: row.scholars.scholarId,
              name: row.users.name,
              email: row.users.email,
              phone: row.users.phone,
              department: row.scholars.department,
              researchArea: row.scholars.researchArea,
              researchTitle: row.scholars.researchTitle,
            }
          : undefined;

      return {
        ...row.applications,
        scholar: scholarData,
      } as any;
    });
  }

  async countRacMeetingsForScholar(scholarId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(distinct ${drcMeetingApplications.meetingId})` })
      .from(drcMeetingApplications)
      .innerJoin(applications, eq(applications.id, drcMeetingApplications.applicationId))
      .where(eq(applications.scholarId, scholarId));

    return Number(result?.count ?? 0);
  }

  async getMeetingById(id: number): Promise<DrcMeeting | undefined> {
    const [meeting] = await db
      .select()
      .from(drcMeetings)
      .where(eq(drcMeetings.id, id));

    return meeting;
  }

  async getOpenMeeting(): Promise<DrcMeeting | undefined> {
    const [meeting] = await db
      .select()
      .from(drcMeetings)
      .where(isNull(drcMeetings.closedAt))
      .orderBy(desc(drcMeetings.id))
      .limit(1);

    return meeting;
  }

  async listMeetings(): Promise<DrcMeeting[]> {
    return db.select().from(drcMeetings).orderBy(desc(drcMeetings.id));
  }

  async closeMeeting(meetingId: number, closedBy: string): Promise<DrcMeeting> {
    const [meeting] = await db
      .update(drcMeetings)
      .set({
        closedAt: new Date(),
        closedBy,
      })
      .where(eq(drcMeetings.id, meetingId))
      .returning();

    return meeting;
  }

  async getMeetingApplications(meetingId: number): Promise<Application[]> {
    const scholarFields = await getScholarSelectFields();
    const rows = await db
      .select({
        drcMeetingApplications,
        applications,
        scholars: scholarFields,
        users,
      })
      .from(drcMeetingApplications)
      .innerJoin(applications, eq(applications.id, drcMeetingApplications.applicationId))
      .leftJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(eq(drcMeetingApplications.meetingId, meetingId))
      .orderBy(desc(applications.submissionDate));

    return rows.map((row) => {
      const scholarData =
        row.scholars && row.users
          ? {
              scholarId: row.scholars.scholarId,
              name: row.users.name,
              email: row.users.email,
              phone: row.users.phone,
              department: row.scholars.department,
              researchArea: row.scholars.researchArea,
              researchTitle: row.scholars.researchTitle,
            }
          : undefined;

      return {
        ...row.applications,
        scholar: scholarData,
      } as any;
    });
  }

  async getAgendaPoints(meetingId: number): Promise<Array<{ point: string; createdAt: string }>> {
    const [meeting] = await db
      .select()
      .from(drcMeetings)
      .where(eq(drcMeetings.id, meetingId));

    return (meeting?.agendaPoints as Array<{ point: string; createdAt: string }>) || [];
  }

  async getDrcReviewsByApplicationIds(applicationIds: number[]): Promise<ApplicationReview[]> {
    if (applicationIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(applicationReviews)
      .where(
        and(
          inArray(applicationReviews.applicationId, applicationIds),
          eq(applicationReviews.stage, "drc"),
        ),
      )
      .orderBy(asc(applicationReviews.reviewDate));
  }

  async createMeetingMinutes(input: {
    meetingId: number;
    generatedBy: string;
  }): Promise<{
    meetingId: number;
    minutesGeneratedAt: Date | null;
    minutesGeneratedBy: string | null;
  }> {
    const [meeting] = await db
      .update(drcMeetings)
      .set({
        minutesGeneratedAt: new Date(),
        minutesGeneratedBy: input.generatedBy,
      })
      .where(eq(drcMeetings.id, input.meetingId))
      .returning({
        meetingId: drcMeetings.id,
        minutesGeneratedAt: drcMeetings.minutesGeneratedAt,
        minutesGeneratedBy: drcMeetings.minutesGeneratedBy,
      });

    return meeting;
  }

  async replaceMinuteItems(
    meetingId: number,
    items: Array<{
      applicationId: number;
      approvalCount: number;
      rejectionCount: number;
      memberSummary: unknown;
    }>,
  ): Promise<void> {
    await db.delete(drcMinuteItems).where(eq(drcMinuteItems.meetingId, meetingId));

    if (items.length === 0) {
      return;
    }

    await db.insert(drcMinuteItems).values(
      items.map((item) => ({
        meetingId,
        applicationId: item.applicationId,
        approvalCount: item.approvalCount,
        rejectionCount: item.rejectionCount,
        memberSummary: item.memberSummary,
      })),
    );
  }

  async getMeetingMinutesByMeetingId(
    meetingId: number,
  ): Promise<{
    meetingId: number;
    minutesGeneratedAt: Date | null;
    minutesGeneratedBy: string | null;
  } | undefined> {
    const [meeting] = await db
      .select({
        meetingId: drcMeetings.id,
        minutesGeneratedAt: drcMeetings.minutesGeneratedAt,
        minutesGeneratedBy: drcMeetings.minutesGeneratedBy,
      })
      .from(drcMeetings)
      .where(eq(drcMeetings.id, meetingId));

    return meeting;
  }

  async getMinuteItemsByMeetingId(meetingId: number): Promise<DrcMinuteItem[]> {
    return db
      .select()
      .from(drcMinuteItems)
      .where(eq(drcMinuteItems.meetingId, meetingId))
      .orderBy(asc(drcMinuteItems.id));
  }

  async getChairmanDecisionsByMeetingId(meetingId: number): Promise<DrcChairmanDecision[]> {
    return db
      .select()
      .from(drcChairmanDecisions)
      .where(eq(drcChairmanDecisions.meetingId, meetingId))
      .orderBy(asc(drcChairmanDecisions.id));
  }

  async upsertChairmanDecision(input: {
    meetingId: number;
    applicationId: number;
    chairmanId: string;
    decision: "approved" | "rejected";
    remarks: string;
  }): Promise<DrcChairmanDecision> {
    const [result] = await db
      .insert(drcChairmanDecisions)
      .values(input)
      .onConflictDoUpdate({
        target: [drcChairmanDecisions.meetingId, drcChairmanDecisions.applicationId],
        set: {
          chairmanId: input.chairmanId,
          decision: input.decision,
          remarks: input.remarks,
          decidedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  async createRoleNotice(input: {
    title: string;
    content: string;
    targetRole: string;
    notificationType?: NotificationType;
    relatedApplicationId?: number;
    relatedMeetingId?: number;
  }): Promise<Notice> {
    try {
      const [notice] = await db
        .insert(notices)
        .values({
          title: input.title,
          content: input.content,
          targetRole: input.targetRole,
          notificationType: input.notificationType ?? "general",
          relatedApplicationId: input.relatedApplicationId,
          relatedMeetingId: input.relatedMeetingId,
        })
        .returning();

      return notice;
    } catch (error) {
      if (!isMissingNoticeMetadataColumns(error)) {
        throw error;
      }

      await ensureNoticeMetadataColumns();

      const [notice] = await db
        .insert(notices)
        .values({
          title: input.title,
          content: input.content,
          targetRole: input.targetRole,
          notificationType: input.notificationType ?? "general",
          relatedApplicationId: input.relatedApplicationId,
          relatedMeetingId: input.relatedMeetingId,
        })
        .returning();

      return notice;
    }
  }

  async listRoleNotices(targetRole: string, userId: number): Promise<Notice[]> {
    return this.listRoleNoticesForRoles([targetRole], userId);
  }

  async listRoleNoticesForRoles(targetRoles: string[], userId: number): Promise<Notice[]> {
    try {
      const rows = await listRoleNoticesWithDismissalsForRoles(targetRoles, userId);

      return rows.map((row) => row.notices);
    } catch (error) {
      if (isMissingNoticeMetadataColumns(error)) {
        await ensureNoticeMetadataColumns();
        const rows = await listRoleNoticesWithDismissalsForRoles(targetRoles, userId);
        return rows.map((row) => row.notices);
      }

      if (!isMissingNoticeDismissalsTable(error)) {
        throw error;
      }

      await ensureNoticeDismissalsTable();
      const rows = await listRoleNoticesWithDismissalsForRoles(targetRoles, userId);
      return rows.map((row) => row.notices);
    }
  }

  async clearRoleNotices(targetRole: string, userId: number): Promise<number> {
    return this.clearRoleNoticesForRoles([targetRole], userId);
  }

  async clearRoleNoticesForRoles(targetRoles: string[], userId: number): Promise<number> {
    try {
      const pendingNotices = await listPendingRoleNoticesForRoles(targetRoles, userId);

      if (pendingNotices.length === 0) {
        return 0;
      }

      await db
        .insert(noticeDismissals)
        .values(
          pendingNotices.map((notice) => ({
            userId,
            noticeId: notice.id,
          })),
        )
        .onConflictDoNothing();

      return pendingNotices.length;
    } catch (error) {
      if (!isMissingNoticeDismissalsTable(error)) {
        throw error;
      }

      await ensureNoticeDismissalsTable();
      const pendingNotices = await listPendingRoleNoticesForRoles(targetRoles, userId);

      if (pendingNotices.length === 0) {
        return 0;
      }

      await db
        .insert(noticeDismissals)
        .values(
          pendingNotices.map((notice) => ({
            userId,
            noticeId: notice.id,
          })),
        )
        .onConflictDoNothing();

      return pendingNotices.length;
    }
  }

  async clearNoticeForRoles(input: {
    noticeId: number;
    targetRoles: string[];
    userId: number;
  }): Promise<boolean> {
    try {
      const allowed = await isNoticeVisibleForRoles(input.noticeId, input.targetRoles, input.userId);
      if (!allowed) {
        return false;
      }

      await db
        .insert(noticeDismissals)
        .values({
          userId: input.userId,
          noticeId: input.noticeId,
        })
        .onConflictDoNothing();

      return true;
    } catch (error) {
      if (!isMissingNoticeDismissalsTable(error)) {
        throw error;
      }

      await ensureNoticeDismissalsTable();

      const allowed = await isNoticeVisibleForRoles(input.noticeId, input.targetRoles, input.userId);
      if (!allowed) {
        return false;
      }

      await db
        .insert(noticeDismissals)
        .values({
          userId: input.userId,
          noticeId: input.noticeId,
        })
        .onConflictDoNothing();

      return true;
    }
  }
}

async function listRoleNoticesWithDismissalsForRoles(targetRoles: string[], userId: number) {
  const roles = targetRoles.length > 0 ? targetRoles : ["all"];

  return db
    .select()
    .from(notices)
    .leftJoin(
      noticeDismissals,
      and(
        eq(noticeDismissals.noticeId, notices.id),
        eq(noticeDismissals.userId, userId),
      ),
    )
    .where(and(inArray(notices.targetRole, roles), isNull(noticeDismissals.id)))
    .orderBy(desc(notices.date));
}

async function listPendingRoleNoticesForRoles(targetRoles: string[], userId: number) {
  const roles = targetRoles.length > 0 ? targetRoles : ["all"];

  return db
    .select({ id: notices.id })
    .from(notices)
    .leftJoin(
      noticeDismissals,
      and(
        eq(noticeDismissals.noticeId, notices.id),
        eq(noticeDismissals.userId, userId),
      ),
    )
    .where(and(inArray(notices.targetRole, roles), isNull(noticeDismissals.id)));
}

async function isNoticeVisibleForRoles(noticeId: number, targetRoles: string[], userId: number) {
  const roles = targetRoles.length > 0 ? targetRoles : ["all"];
  const rows = await db
    .select({ id: notices.id })
    .from(notices)
    .leftJoin(
      noticeDismissals,
      and(
        eq(noticeDismissals.noticeId, notices.id),
        eq(noticeDismissals.userId, userId),
      ),
    )
    .where(
      and(
        eq(notices.id, noticeId),
        inArray(notices.targetRole, roles),
        isNull(noticeDismissals.id),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

async function ensureNoticeDismissalsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notice_dismissals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      notice_id INTEGER NOT NULL,
      dismissed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notice_dismissals_user_notice_idx
    ON notice_dismissals (user_id, notice_id)
  `);
}

async function ensureNoticeMetadataColumns(): Promise<void> {
  await db.execute(sql`
    ALTER TABLE notices
      ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS related_application_id INTEGER,
      ADD COLUMN IF NOT EXISTS related_meeting_id INTEGER
  `);
}

function isMissingNoticeDismissalsTable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  const maybeMessage = "message" in error ? (error as { message?: unknown }).message : undefined;

  return (
    maybeCode === "42P01" &&
    typeof maybeMessage === "string" &&
    maybeMessage.includes("notice_dismissals")
  );
}

function isMissingNoticeMetadataColumns(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  const maybeMessage = "message" in error ? (error as { message?: unknown }).message : undefined;

  return (
    maybeCode === "42703" &&
    typeof maybeMessage === "string" &&
    (
      maybeMessage.includes("notification_type") ||
      maybeMessage.includes("related_application_id") ||
      maybeMessage.includes("related_meeting_id")
    )
  );
}
