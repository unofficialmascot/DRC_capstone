import { DrcMeetingRepository } from "../repositories/drc-meeting-repository";
import { storage } from "../storage";
import { evaluateWorkflowDecision, getWorkflowDefinition, type WorkflowStage } from "../workflow";
import { badRequest, forbidden, notFound } from "../routes/http";

const drcMeetingRepository = new DrcMeetingRepository();

export interface ScheduleDrcMeetingInput {
  meetingDate: string | Date;
  extraPoints?: string[];
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

  await drcMeetingRepository.createRoleNotice({
    title: `DRC Meeting Scheduled (ID: ${meeting.id})`,
    content: `A DRC meeting is scheduled for ${meetingDate.toLocaleString("en-IN")}. Open the Meetings tab to download the agenda PDF.`,
    targetRole: "drc",
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
  await assertDrcConvener(sessionUserId);

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
  return drcMeetingRepository.listRoleNotices("drc");
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

  const chairmanDecision = await drcMeetingRepository.upsertChairmanDecision({
    meetingId: input.meetingId,
    applicationId: input.applicationId,
    chairmanId: chairman.employeeId,
    decision: input.decision,
    remarks: input.remarks,
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

  if (user.role !== "drc_convener" && user.role !== "admin") {
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

  if (!["drc", "drc_convener", "drc_chairman", "admin"].includes(user.role)) {
    throw forbidden("Only DRC members can access meeting agendas");
  }
}

async function assertDrcChairman(sessionUserId: number): Promise<{ employeeId: string }> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  if (user.role !== "drc_chairman" && user.role !== "admin") {
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
}
