import { DrcMeetingRepository } from "../repositories/drc-meeting-repository";
import { storage } from "../storage";
import { badRequest, notFound } from "../routes/http";
import type { NotificationType, Notice } from "@shared/schema";

const notificationRepository = new DrcMeetingRepository();

interface EmitRoleNotificationInput {
  title: string;
  content: string;
  targetRoles: string[];
  notificationType: NotificationType;
  relatedApplicationId?: number;
  relatedMeetingId?: number;
}

function getNotificationRolesForUserRole(role: string): string[] {
  return [role, "all"];
}

export async function emitRoleNotification(input: EmitRoleNotificationInput): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const uniqueRoles = Array.from(new Set(input.targetRoles.filter((role) => role.trim().length > 0)));

  await Promise.all(
    uniqueRoles.map((role) =>
      notificationRepository.createRoleNotice({
        title: input.title,
        content: input.content,
        targetRole: role,
        notificationType: input.notificationType,
        relatedApplicationId: input.relatedApplicationId,
        relatedMeetingId: input.relatedMeetingId,
      }),
    ),
  );
}

export async function listNotifications(sessionUserId: number): Promise<Notice[]> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  return notificationRepository.listRoleNoticesForRoles(
    getNotificationRolesForUserRole(user.role),
    sessionUserId,
  );
}

export async function clearNotifications(sessionUserId: number): Promise<{ cleared: number }> {
  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  const cleared = await notificationRepository.clearRoleNoticesForRoles(
    getNotificationRolesForUserRole(user.role),
    sessionUserId,
  );

  return { cleared };
}

export async function clearNotification(
  sessionUserId: number,
  notificationId: number,
): Promise<{ cleared: boolean }> {
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    throw badRequest("Invalid notification id");
  }

  const user = await storage.getUserWithScholar(sessionUserId);
  if (!user) {
    throw notFound("User not found");
  }

  const cleared = await notificationRepository.clearNoticeForRoles({
    noticeId: notificationId,
    targetRoles: getNotificationRolesForUserRole(user.role),
    userId: sessionUserId,
  });

  return { cleared };
}
