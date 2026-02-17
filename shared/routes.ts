import { z } from 'zod';
import {
  insertUserSchema,
  insertApplicationSchema,
  insertApplicationReviewSchema,
  insertDrcChairmanDecisionSchema,
  insertNoticeSchema,
  insertDrcMeetingSchema,
  insertDrcAgendaPointSchema,
  insertDrcMeetingMinutesSchema,
  insertDrcMinuteItemSchema,
} from './schema';

export const api = {
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: insertUserSchema,
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: insertUserSchema,
      },
    },
  },
  applications: {
    list: {
      method: 'GET' as const,
      path: '/api/applications',
      input: z.object({
        scholarId: z.coerce.string().optional(),
      }).optional(),
      responses: {
        200: z.array(insertApplicationSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/applications',
      input: insertApplicationSchema.omit({ id: true, submissionDate: true, currentStage: true, status: true, finalOutcome: true }),
      responses: {
        201: insertApplicationSchema,
      },
    },
    getByStage: {
      method: 'GET' as const,
      path: '/api/applications/stage/:stage',
      responses: {
        200: z.array(insertApplicationSchema),
      },
    },
    review: {
      method: 'POST' as const,
      path: '/api/applications/:id/review',
      input: z.object({
        reviewerId: z.string(),
        decision: z.enum(['approved', 'rejected']),
        remarks: z.string().min(1),
      }),
      responses: {
        200: z.object({
          review: insertApplicationReviewSchema,
          application: insertApplicationSchema,
        }),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats/:scholarId',
      responses: {
        200: z.object({
          completedReviews: z.number(),
          pendingReports: z.number(),
          publications: z.number(),
        }),
      },
    },
  },
  drcMeetings: {
    list: {
      method: 'GET' as const,
      path: '/api/drc-meetings',
      responses: {
        200: z.array(insertDrcMeetingSchema),
      },
    },
    notifications: {
      method: 'GET' as const,
      path: '/api/drc-meetings/notifications',
      responses: {
        200: z.array(insertNoticeSchema),
      },
    },
    getOpen: {
      method: 'GET' as const,
      path: '/api/drc-meetings/open',
      responses: {
        200: z.union([
          z.object({
            meeting: insertDrcMeetingSchema,
            applications: z.array(insertApplicationSchema),
            extraPoints: z.array(insertDrcAgendaPointSchema),
          }),
          z.null(),
        ]),
      },
    },
    schedule: {
      method: 'POST' as const,
      path: '/api/drc-meetings/schedule',
      input: z.object({
        meetingDate: z.union([z.string(), z.date()]),
        extraPoints: z.array(z.string().min(1)).optional(),
      }),
      responses: {
        201: z.object({
          meeting: insertDrcMeetingSchema,
          applications: z.array(insertApplicationSchema),
          extraPoints: z.array(insertDrcAgendaPointSchema),
        }),
      },
    },
    getAgenda: {
      method: 'GET' as const,
      path: '/api/drc-meetings/:id/agenda',
      responses: {
        200: z.object({
          meeting: insertDrcMeetingSchema,
          applications: z.array(insertApplicationSchema),
          extraPoints: z.array(insertDrcAgendaPointSchema),
        }),
      },
    },
    close: {
      method: 'POST' as const,
      path: '/api/drc-meetings/:id/close',
      responses: {
        200: z.object({
          meeting: insertDrcMeetingSchema,
          applications: z.array(insertApplicationSchema),
          extraPoints: z.array(insertDrcAgendaPointSchema),
        }),
      },
    },
    downloadAgendaPdf: {
      method: 'GET' as const,
      path: '/api/drc-meetings/:id/agenda.pdf',
      responses: {
        200: z.any(),
      },
    },
  }
  ,
  drcChairman: {
    listMinutes: {
      method: 'GET' as const,
      path: '/api/drc-chairman/minutes',
      responses: {
        200: z.array(
          z.object({
            meeting: insertDrcMeetingSchema,
            minutes: insertDrcMeetingMinutesSchema,
          }),
        ),
      },
    },
    getMinutes: {
      method: 'GET' as const,
      path: '/api/drc-chairman/minutes/:meetingId',
      responses: {
        200: z.object({
          meeting: insertDrcMeetingSchema,
          minutes: insertDrcMeetingMinutesSchema,
          items: z.array(
            insertDrcMinuteItemSchema.extend({
              application: insertApplicationSchema.nullable(),
              chairmanDecision: insertDrcChairmanDecisionSchema.nullable(),
            }),
          ),
        }),
      },
    },
    decide: {
      method: 'POST' as const,
      path: '/api/drc-chairman/minutes/:meetingId/applications/:applicationId/decision',
      input: z.object({
        decision: z.enum(['approved', 'rejected']),
        remarks: z.string().min(1),
      }),
      responses: {
        200: z.object({
          application: insertApplicationSchema,
          chairmanDecision: insertDrcChairmanDecisionSchema,
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
