import type { Express } from "express";
import { z } from "zod";
import {
  closeDrcMeeting,
  clearDrcMeetingNotifications,
  getChairmanDashboardData,
  getDrcMeetingAgenda,
  getChairmanMinutesDetails,
  getOpenDrcMeetingAgenda,
  listDrcMeetingNotifications,
  listDrcMeetings,
  listChairmanMinutesMeetings,
  scheduleDrcMeeting,
  submitChairmanApplicationDecision,
} from "../services/drc-meeting-service";
import {
  buildDrcAgendaPdf,
  buildDrcAgendaPdfFilename,
} from "../services/pdf/drc-agenda-pdf-service";
import {
  generateMeetingMinutesPdf,
  buildMeetingMinutesPdfFilename,
} from "../services/pdf/drc-minutes-pdf-service";
import {
  handleRouteError,
  parsePositiveIntParam,
  unauthorized,
} from "./http";
import { storage } from "../storage";

export function registerDrcMeetingRoutes(app: Express): void {
  app.get("/api/drc-chairman/dashboard", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const category = z
        .enum([
          "total",
          "awarded",
          "thesis_submitted",
          "deregistered",
          "terminated",
          "re_registered",
          "pre_talk_pending",
          "extension_requests",
        ])
        .optional()
        .parse(req.query.category);

      const result = await getChairmanDashboardData(req.session.userId, category);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-meetings", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetings = await listDrcMeetings(req.session.userId);
      res.json(meetings);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-meetings/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const notifications = await listDrcMeetingNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/drc-meetings/notifications/clear", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const result = await clearDrcMeetingNotifications(req.session.userId);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-chairman/minutes", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const result = await listChairmanMinutesMeetings(req.session.userId);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-chairman/minutes/:meetingId", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetingId = parsePositiveIntParam(req.params.meetingId, "meeting id");
      const result = await getChairmanMinutesDetails(req.session.userId, meetingId);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/drc-chairman/minutes/:meetingId/applications/:applicationId/decision", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const input = z
        .object({
          decision: z.enum(["approved", "rejected"]),
          remarks: z.string().min(1, "Remarks are required"),
        })
        .parse(req.body);

      const meetingId = parsePositiveIntParam(req.params.meetingId, "meeting id");
      const applicationId = parsePositiveIntParam(req.params.applicationId, "application id");

      const result = await submitChairmanApplicationDecision(req.session.userId, {
        meetingId,
        applicationId,
        decision: input.decision,
        remarks: input.remarks,
      });

      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/drc-meetings/schedule", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const input = z
        .object({
          meetingDate: z.union([z.string(), z.date()]),
          extraPoints: z.array(z.string().min(1)).optional(),
        })
        .parse(req.body);

      const agenda = await scheduleDrcMeeting(req.session.userId, input);
      res.status(201).json(agenda);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });

  app.get("/api/drc-meetings/:id/agenda", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetingId = parsePositiveIntParam(req.params.id, "meeting id");
      const agenda = await getDrcMeetingAgenda(req.session.userId, meetingId);
      res.json(agenda);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-meetings/open", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const agenda = await getOpenDrcMeetingAgenda(req.session.userId);
      res.json(agenda);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/drc-meetings/:id/close", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetingId = parsePositiveIntParam(req.params.id, "meeting id");
      const agenda = await closeDrcMeeting(req.session.userId, meetingId);
      res.json(agenda);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-chairman/minutes/:meetingId/pdf", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetingId = parsePositiveIntParam(req.params.meetingId, "meeting id");
      const details = await getChairmanMinutesDetails(req.session.userId, meetingId);

      // Resolve chairman name for the footer
      const chairman = await storage.getUserWithScholar(req.session.userId);
      const chairmanName = chairman?.name ?? undefined;

      const pdfBuffer = await generateMeetingMinutesPdf({
        meeting: details.meeting,
        minutes: {
          generatedBy: details.minutes.minutesGeneratedBy || details.meeting.closedBy || "Unknown",
          generatedAt: details.minutes.minutesGeneratedAt,
        },
        items: details.items as Parameters<typeof generateMeetingMinutesPdf>[0]["items"],
        chairmanName,
      });

      const filename = buildMeetingMinutesPdfFilename(
        details.meeting.id,
        details.meeting.meetingDate,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/drc-meetings/:id/agenda.pdf", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const meetingId = parsePositiveIntParam(req.params.id, "meeting id");
      const agenda = await getDrcMeetingAgenda(req.session.userId, meetingId);
      const convener = await storage.getUserByEmployeeId(agenda.meeting.scheduledBy);
      const pdfBuffer = await buildDrcAgendaPdf(agenda, {
        convenerName: convener?.name,
        convenerSignatureImageUrl: convener?.avatarUrl ?? null,
      });
      const filename = buildDrcAgendaPdfFilename(
        agenda.meeting.id,
        new Date(agenda.meeting.meetingDate),
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      res.send(pdfBuffer);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
