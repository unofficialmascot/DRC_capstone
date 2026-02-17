import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import {
  applications,
  applicationReviews,
  drcAgendaPoints,
  drcChairmanDecisions,
  drcMeetingApplications,
  drcMeetingMinutes,
  drcMeetings,
  drcMinuteItems,
  notices,
  scholars,
  users,
  type Application,
  type ApplicationReview,
  type DrcAgendaPoint,
  type DrcChairmanDecision,
  type DrcMeeting,
  type DrcMeetingMinutes,
  type DrcMinuteItem,
  type Notice,
} from "@shared/schema";

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
  ): Promise<DrcAgendaPoint[]> {
    if (points.length === 0) {
      return [];
    }

    return db
      .insert(drcAgendaPoints)
      .values(
        points.map((point) => ({
          meetingId,
          point,
        })),
      )
      .returning();
  }

  async getPendingDrcApplications(): Promise<Application[]> {
    const rows = await db
      .select()
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
    const rows = await db
      .select()
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

  async getAgendaPoints(meetingId: number): Promise<DrcAgendaPoint[]> {
    return db
      .select()
      .from(drcAgendaPoints)
      .where(eq(drcAgendaPoints.meetingId, meetingId))
      .orderBy(drcAgendaPoints.id);
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
  }): Promise<DrcMeetingMinutes> {
    const [minutes] = await db
      .insert(drcMeetingMinutes)
      .values(input)
      .onConflictDoUpdate({
        target: drcMeetingMinutes.meetingId,
        set: {
          generatedBy: input.generatedBy,
          generatedAt: new Date(),
        },
      })
      .returning();

    return minutes;
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

  async getMeetingMinutesByMeetingId(meetingId: number): Promise<DrcMeetingMinutes | undefined> {
    const [minutes] = await db
      .select()
      .from(drcMeetingMinutes)
      .where(eq(drcMeetingMinutes.meetingId, meetingId));

    return minutes;
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
  }): Promise<Notice> {
    const [notice] = await db
      .insert(notices)
      .values({
        title: input.title,
        content: input.content,
        targetRole: input.targetRole,
      })
      .returning();

    return notice;
  }

  async listRoleNotices(targetRole: string): Promise<Notice[]> {
    return db
      .select()
      .from(notices)
      .where(eq(notices.targetRole, targetRole))
      .orderBy(desc(notices.date));
  }
}
