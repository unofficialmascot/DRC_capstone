import { DrcMeetingRepository } from "../repositories/drc-meeting-repository";
import { storage } from "../storage";
import { evaluateWorkflowDecision, getWorkflowDefinition, type WorkflowStage } from "../workflow";
import { badRequest, forbidden, notFound } from "../routes/http";
import { db } from "../db";
import { applicationReviews, applications, employeeRoles, employees, scholars, users } from "@shared/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { emitRoleNotification } from "./notification-service";
import { applyApprovedChanges } from "./review-workflow-service";

const drcMeetingRepository = new DrcMeetingRepository();

type ChairmanDashboardCategory =
  | "total"
  | "awarded"
  | "thesis_submitted"
  | "deregistered"
  | "terminated"
  | "re_registered"
  | "pre_talk_pending"
  | "extension_requests";

interface ChairmanDashboardRow {
  scholarId: string;
  scholarName: string;
  department: string | null;
  status: string;
}

async function hasAnyRole(userId: number, baseRole: string, roles: string[]): Promise<boolean> {
  const hasRoleMethod = (storage as unknown as { userHasAnyRole?: unknown }).userHasAnyRole;
  if (typeof hasRoleMethod === "function") {
    try {
      return await storage.userHasAnyRole(userId, roles, baseRole);
    } catch {
      return roles.includes(baseRole);
    }
  }

  return roles.includes(baseRole);
}

export interface ScheduleDrcMeetingInput {
  meetingDate: string | Date;
  extraPoints?: string[];
}

export async function getChairmanDashboardData(
  sessionUserId: number,
  category: ChairmanDashboardCategory = "total",
) {
  await assertDrcChairman(sessionUserId);

  const allScholars = await db
    .select({
      scholarId: scholars.scholarId,
      scholarName: users.name,
      department: scholars.department,
      status: scholars.lifecycleStatus,
    })
    .from(scholars)
    .innerJoin(users, eq(users.id, scholars.userId));

  const awardedRows = allScholars.filter((row) => row.status === "Awarded");
  const deregisteredRows = allScholars.filter((row) => row.status === "Deregistered");
  const terminatedRows = allScholars.filter((row) => row.status === "Terminated");
  const reRegisteredRows = allScholars.filter((row) => row.status === "Re-registered");

  const thesisSubmittedRows = await getDistinctScholarRowsByApplication({
    applicationType: "Thesis Submission",
    excludeRejected: true,
    displayStatus: "Thesis Submitted",
  });

  const preTalkPendingRows = await getDistinctScholarRowsByApplication({
    applicationType: "Pre-Talk",
    status: "Pending",
    displayStatus: "Pre-Talk Pending",
  });

  const extensionRequestRows = await getDistinctScholarRowsByApplication({
    applicationType: "Extension",
    status: "Pending",
    displayStatus: "Extension Request",
  });

  const metrics = {
    total: allScholars.length,
    awarded: awardedRows.length,
    thesisSubmitted: thesisSubmittedRows.length,
    deregistered: deregisteredRows.length,
    terminated: terminatedRows.length,
    reRegistered: reRegisteredRows.length,
    preTalkPending: preTalkPendingRows.length,
    extensionRequests: extensionRequestRows.length,
  };

  const rowsByCategory: Record<ChairmanDashboardCategory, ChairmanDashboardRow[]> = {
    total: allScholars,
    awarded: awardedRows,
    thesis_submitted: thesisSubmittedRows,
    deregistered: deregisteredRows,
    terminated: terminatedRows,
    re_registered: reRegisteredRows,
    pre_talk_pending: preTalkPendingRows,
    extension_requests: extensionRequestRows,
  };

  return {
    activeCategory: category,
    metrics,
    rows: rowsByCategory[category],
  };
}

export async function scheduleDrcMeeting(
  sessionUserId: number,
  input: ScheduleDrcMeetingInput,
) {
  const convener = await assertDrcConvener(sessionUserId);

  const openMeeting = await drcMeetingRepository.getOpenMeeting();
  if (openMeeting) {
    throw badRequest("An active DRC meeting already exists. Close it before scheduling a new one.");
  }

  const meetingDate =
    input.meetingDate instanceof Date
      ? input.meetingDate
      : new Date(input.meetingDate);

  if (Number.isNaN(meetingDate.getTime())) {
    throw badRequest("Invalid meeting date");
  }

  const normalizedPoints = (input.extraPoints ?? [])
    .map((point) => point.trim())
    .filter((point) => point.length > 0);

  const pendingApplications = await drcMeetingRepository.getPendingDrcApplications();

  const meeting = await drcMeetingRepository.createMeeting({
    meetingDate,
    scheduledBy: convener.employeeId,
  });

  await drcMeetingRepository.addMeetingApplications(
    meeting.id,
    pendingApplications.map((application) => application.id),
  );

  const createdPoints = await drcMeetingRepository.addAgendaPoints(
    meeting.id,
    normalizedPoints,
  );

  await emitRoleNotification({
    title: `DRC Meeting Scheduled (ID: ${meeting.id})`,
    content: `A DRC meeting is scheduled for ${meetingDate.toLocaleString("en-IN")}. Open the Meetings tab to download the agenda PDF.`,
    targetRoles: ["drc", "drc_convener", "drc_chairman"],
    notificationType: "drc_meeting_scheduled",
    relatedMeetingId: meeting.id,
  });

  return {
    meeting,
    applications: pendingApplications,
    extraPoints: createdPoints,
  };
}

export async function getDrcMeetingAgenda(
  sessionUserId: number,
  meetingId: number,
) {
  await assertDrcMeetingViewer(sessionUserId);

  return getAgendaByMeetingId(meetingId);
}

export async function getOpenDrcMeetingAgenda(sessionUserId: number) {
  await assertDrcMeetingViewer(sessionUserId);

  const openMeeting = await drcMeetingRepository.getOpenMeeting();
  if (!openMeeting) {
    return null;
  }

  return getAgendaByMeetingId(openMeeting.id);
}

export async function listDrcMeetings(sessionUserId: number) {
  await assertDrcMeetingViewer(sessionUserId);
  return drcMeetingRepository.listMeetings();
}

export async function listDrcMeetingNotifications(sessionUserId: number) {
  await assertDrcMeetingViewer(sessionUserId);
  return drcMeetingRepository.listRoleNotices("drc", sessionUserId);
}

export async function clearDrcMeetingNotifications(sessionUserId: number) {
  await assertDrcMeetingViewer(sessionUserId);
  const cleared = await drcMeetingRepository.clearRoleNotices("drc", sessionUserId);
  return { cleared };
}

export async function closeDrcMeeting(
  sessionUserId: number,
  meetingId: number,
) {
  const convener = await assertDrcConvener(sessionUserId);

  const meeting = await drcMeetingRepository.getMeetingById(meetingId);
  if (!meeting) {
    throw notFound("Meeting not found");
  }

  if (meeting.closedAt) {
    throw badRequest("Meeting is already closed");
  }

  await drcMeetingRepository.closeMeeting(meetingId, convener.employeeId);
  await autoApproveMissingDrcVotes(meetingId);
  await generateMinutesForMeeting(meetingId, convener.employeeId);
  return getAgendaByMeetingId(meetingId);
}

export async function listChairmanMinutesMeetings(sessionUserId: number) {
  await assertDrcChairman(sessionUserId);

  const meetings = await drcMeetingRepository.listMeetings();
  const minutesChecks = await Promise.all(
    meetings.map(async (meeting) => ({
      meeting,
      minutes: await drcMeetingRepository.getMeetingMinutesByMeetingId(meeting.id),
    })),
  );

  return minutesChecks
    .filter((item) => Boolean(item.minutes))
    .map((item) => ({
      meeting: item.meeting,
      minutes: item.minutes!,
    }));
}

export async function getChairmanMinutesDetails(
  sessionUserId: number,
  meetingId: number,
) {
  await assertDrcChairman(sessionUserId);

  const meeting = await drcMeetingRepository.getMeetingById(meetingId);
  if (!meeting) {
    throw notFound("Meeting not found");
  }

  const minutes = await drcMeetingRepository.getMeetingMinutesByMeetingId(meetingId);
  if (!minutes) {
    throw notFound("Minutes not found for this meeting");
  }

  const [applications, items, chairmanDecisions] = await Promise.all([
    drcMeetingRepository.getMeetingApplications(meetingId),
    drcMeetingRepository.getMinuteItemsByMeetingId(meetingId),
    drcMeetingRepository.getChairmanDecisionsByMeetingId(meetingId),
  ]);

  const decisionMap = new Map(chairmanDecisions.map((decision) => [decision.applicationId, decision]));

  const minuteItems = items.map((item) => ({
    ...item,
    application: applications.find((application) => application.id === item.applicationId),
    chairmanDecision: decisionMap.get(item.applicationId) ?? null,
  }));

  return {
    meeting,
    minutes,
    items: minuteItems,
  };
}

export async function submitChairmanApplicationDecision(
  sessionUserId: number,
  input: {
    meetingId: number;
    applicationId: number;
    decision: "approved" | "rejected";
    remarks: string;
  },
) {
  const chairman = await assertDrcChairman(sessionUserId);

  const meeting = await drcMeetingRepository.getMeetingById(input.meetingId);
  if (!meeting) {
    throw notFound("Meeting not found");
  }

  const minutes = await drcMeetingRepository.getMeetingMinutesByMeetingId(input.meetingId);
  if (!minutes) {
    throw badRequest("Minutes not available for this meeting");
  }

  const application = await storage.getApplicationById(input.applicationId);
  if (!application) {
    throw notFound("Application not found");
  }

  if (application.currentStage !== "drc" || application.status !== "Pending") {
    throw badRequest("Application is not pending at DRC stage");
  }

  const meetingApplications = await drcMeetingRepository.getMeetingApplications(input.meetingId);
  const belongsToMeeting = meetingApplications.some((item) => item.id === input.applicationId);
  if (!belongsToMeeting) {
    throw badRequest("Application is not part of this meeting minutes");
  }

  const workflow = getWorkflowDefinition(application.type);
  const workflowResult = evaluateWorkflowDecision(workflow, {
    currentStage: application.currentStage as WorkflowStage,
    decision: input.decision,
  });

  const updatedApplication = await storage.updateApplication(input.applicationId, {
    currentStage: workflowResult.nextStage,
    status: workflowResult.status,
    finalOutcome: workflowResult.finalOutcome,
  });

  // Apply business logic changes when application is fully approved
  if (workflowResult.isTerminal && workflowResult.finalOutcome === "Approved") {
    await applyApprovedChanges(updatedApplication);
  }

  const chairmanDecision = await drcMeetingRepository.upsertChairmanDecision({
    meetingId: input.meetingId,
    applicationId: input.applicationId,
    chairmanId: chairman.employeeId,
    decision: input.decision,
    remarks: input.remarks,
  });

  await emitRoleNotification({
    title: `Chairman ${input.decision === "approved" ? "approved" : "rejected"} application #${input.applicationId}`,
    content: `Application #${input.applicationId} received a chairman ${input.decision} decision in meeting #${input.meetingId}.`,
    targetRoles: ["scholar", "supervisor"],
    notificationType: "chairman_decision",
    relatedApplicationId: input.applicationId,
    relatedMeetingId: input.meetingId,
  });

  return {
    application: updatedApplication,
    chairmanDecision,
  };
}

async function getAgendaByMeetingId(meetingId: number) {
  const meeting = await drcMeetingRepository.getMeetingById(meetingId);
  if (!meeting) {
    throw notFound("Meeting not found");
  }

  const [applications, extraPoints] = await Promise.all([
    drcMeetingRepository.getMeetingApplications(meetingId),
    drcMeetingRepository.getAgendaPoints(meetingId),
  ]);

  return {
    meeting,
    applications,
    extraPoints,
  };
}

async function assertDrcConvener(sessionUserId: number): Promise<{ employeeId: string }> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  const canManageMeetings = await hasAnyRole(user.id, user.role, ["drc_convener", "admin"]);

  if (!canManageMeetings) {
    throw forbidden("Only DRC convener can schedule DRC meetings");
  }

  if (!user.employeeId) {
    throw badRequest("DRC convener account is missing employee profile");
  }

  return { employeeId: user.employeeId };
}

async function assertDrcMeetingViewer(sessionUserId: number): Promise<void> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  const canViewMeetings = await hasAnyRole(user.id, user.role, ["drc", "drc_convener", "drc_chairman", "admin"]);

  if (!canViewMeetings) {
    throw forbidden("Only DRC members can access meeting agendas");
  }
}

async function assertDrcChairman(sessionUserId: number): Promise<{ employeeId: string }> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  const canApproveMinutes = await hasAnyRole(user.id, user.role, ["drc_chairman", "admin"]);

  if (!canApproveMinutes) {
    throw forbidden("Only DRC chairman can approve meeting minutes");
  }

  if (!user.employeeId) {
    throw badRequest("DRC chairman account is missing employee profile");
  }

  return { employeeId: user.employeeId };
}

async function generateMinutesForMeeting(meetingId: number, generatedBy: string): Promise<void> {
  const applications = await drcMeetingRepository.getMeetingApplications(meetingId);
  const applicationIds = applications.map((application) => application.id);
  const reviews = await drcMeetingRepository.getDrcReviewsByApplicationIds(applicationIds);

  const reviewsByApplication = new Map<number, typeof reviews>();
  for (const review of reviews) {
    const group = reviewsByApplication.get(review.applicationId) ?? [];
    group.push(review);
    reviewsByApplication.set(review.applicationId, group);
  }

  const minuteItems = applications.map((application) => {
    const appReviews = reviewsByApplication.get(application.id) ?? [];
    const approvalCount = appReviews.filter((review) => review.decision === "approved").length;
    const rejectionCount = appReviews.filter((review) => review.decision === "rejected").length;

    const memberSummary = appReviews.map((review) => ({
      reviewerId: review.reviewerId,
      decision: review.decision,
      remarks: review.remarks,
      reviewDate: review.reviewDate,
    }));

    return {
      applicationId: application.id,
      approvalCount,
      rejectionCount,
      memberSummary,
    };
  });

  await drcMeetingRepository.createMeetingMinutes({
    meetingId,
    generatedBy,
  });
  await drcMeetingRepository.replaceMinuteItems(meetingId, minuteItems);

  await emitRoleNotification({
    title: `Minutes Ready for Meeting #${meetingId}`,
    content: `Minutes were generated for meeting #${meetingId}. Chairman can now review and submit final decisions.`,
    targetRoles: ["drc_chairman"],
    notificationType: "minutes_generated",
    relatedMeetingId: meetingId,
  });
}

async function autoApproveMissingDrcVotes(meetingId: number): Promise<void> {
  const meetingApplications = await drcMeetingRepository.getMeetingApplications(meetingId);
  if (meetingApplications.length === 0) {
    return;
  }

  const applicationIds = meetingApplications.map((application) => application.id);
  const reviews = await drcMeetingRepository.getDrcReviewsByApplicationIds(applicationIds);

  const reviewedByApplication = new Map<number, Set<string>>();
  for (const review of reviews) {
    const reviewerSet = reviewedByApplication.get(review.applicationId) ?? new Set<string>();
    reviewerSet.add(review.reviewerId);
    reviewedByApplication.set(review.applicationId, reviewerSet);
  }

  const drcMembers = await db
    .select({
      employeeId: employees.employeeId,
    })
    .from(employees)
    .innerJoin(employeeRoles, eq(employeeRoles.userId, employees.userId))
    .where(inArray(employeeRoles.role, ["drc", "drc_convener"]));

  if (drcMembers.length === 0) {
    return;
  }

  const autoApprovals: Array<typeof applicationReviews.$inferInsert> = [];
  for (const applicationId of applicationIds) {
    const reviewerSet = reviewedByApplication.get(applicationId) ?? new Set<string>();

    for (const member of drcMembers) {
      if (!member.employeeId || reviewerSet.has(member.employeeId)) {
        continue;
      }

      autoApprovals.push({
        applicationId,
        reviewerId: member.employeeId,
        stage: "drc",
        decision: "approved",
        remarks: "Auto-approved on meeting close",
        reviewDate: new Date(),
      });
    }
  }

  if (autoApprovals.length === 0) {
    return;
  }

  await db.insert(applicationReviews).values(autoApprovals);
}

async function getDistinctScholarRowsByApplication(input: {
  applicationType: string;
  status?: string;
  excludeRejected?: boolean;
  displayStatus: string;
}): Promise<ChairmanDashboardRow[]> {
  const conditions = [eq(applications.type, input.applicationType)];

  if (input.status) {
    conditions.push(eq(applications.status, input.status));
  }

  if (input.excludeRejected) {
    conditions.push(ne(applications.status, "Rejected"));
  }

  const result = await db
    .select({
      scholarId: scholars.scholarId,
      scholarName: users.name,
      department: scholars.department,
    })
    .from(applications)
    .innerJoin(scholars, eq(scholars.scholarId, applications.scholarId))
    .innerJoin(users, eq(users.id, scholars.userId))
    .where(and(...conditions));

  const dedupe = new Map<string, ChairmanDashboardRow>();
  for (const row of result) {
    if (!dedupe.has(row.scholarId)) {
      dedupe.set(row.scholarId, {
        scholarId: row.scholarId,
        scholarName: row.scholarName,
        department: row.department,
        status: input.displayStatus,
      });
    }
  }

  return Array.from(dedupe.values());
}
