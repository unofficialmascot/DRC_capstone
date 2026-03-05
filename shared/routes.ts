import { z } from 'zod';
import {
  insertUserSchema,
  insertApplicationSchema,
  insertApplicationReviewSchema,
  insertDocumentSchema,
  insertDrcChairmanDecisionSchema,
  insertNoticeSchema,
  insertDrcMeetingSchema,
  insertDrcAgendaPointSchema,
  insertDrcMeetingMinutesSchema,
  insertDrcMinuteItemSchema,
} from './schema';

const userResponseSchema = insertUserSchema.extend({
  createdAt: z.union([z.string(), z.date(), z.null()]).optional(),
  updatedAt: z.union([z.string(), z.date(), z.null()]).optional(),
});

const publicUserSchema = userResponseSchema.omit({ password: true }).extend({
  username: z.string().optional(),
  scholarId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
}).passthrough();

const documentResponseSchema = insertDocumentSchema.extend({
  id: z.number(),
  uploadedAt: z.union([z.string(), z.date(), z.null()]),
  isVerified: z.boolean(),
  verifiedBy: z.union([z.string(), z.null()]),
  verifiedAt: z.union([z.string(), z.date(), z.null()]),
});

const applicationReviewResponseSchema = insertApplicationReviewSchema.extend({
  reviewDate: z.union([z.string(), z.date(), z.null()]).optional(),
});

const chairmanDashboardCategorySchema = z.enum([
  "total",
  "awarded",
  "thesis_submitted",
  "deregistered",
  "terminated",
  "re_registered",
  "pre_talk_pending",
  "extension_requests",
]);

const chairmanDashboardRowSchema = z.object({
  scholarId: z.string(),
  scholarName: z.string(),
  department: z.string().nullable(),
  status: z.string(),
});

const chairmanDashboardMetricsSchema = z.object({
  total: z.number(),
  awarded: z.number(),
  thesisSubmitted: z.number(),
  deregistered: z.number(),
  terminated: z.number(),
  reRegistered: z.number(),
  preTalkPending: z.number(),
  extensionRequests: z.number(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z
        .object({
          scholarId: z.string().optional(),
          employeeId: z.string().optional(),
          password: z.string(),
        })
        .refine((data) => data.scholarId || data.employeeId, {
          message: 'Either scholarId or employeeId is required',
        }),
      responses: {
        200: publicUserSchema,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: publicUserSchema,
      },
    },
  },
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: userResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: userResponseSchema,
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
    get: {
      method: 'GET' as const,
      path: '/api/applications/:id',
      responses: {
        200: insertApplicationSchema,
      },
    },
    getByStage: {
      method: 'GET' as const,
      path: '/api/applications/stage/:stage',
      responses: {
        200: z.array(insertApplicationSchema),
      },
    },
    reviews: {
      method: 'GET' as const,
      path: '/api/applications/:id/reviews',
      responses: {
        200: z.array(applicationReviewResponseSchema),
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
          review: applicationReviewResponseSchema,
          application: insertApplicationSchema,
        }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/applications/:id',
      responses: {
        200: z.object({
          message: z.string(),
        }),
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      input: z.object({
        scholarId: z.string(),
      }),
      responses: {
        200: z.array(documentResponseSchema),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/documents/upload',
      responses: {
        201: documentResponseSchema,
      },
    },
    view: {
      method: 'GET' as const,
      path: '/api/documents/:id/view',
      responses: {
        200: z.any(),
      },
    },
    download: {
      method: 'GET' as const,
      path: '/api/documents/:id/download',
      responses: {
        200: z.any(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.object({
          message: z.string(),
        }),
      },
    },
    verify: {
      method: 'PATCH' as const,
      path: '/api/documents/:id/verify',
      input: z.object({
        verifiedBy: z.string(),
      }),
      responses: {
        200: documentResponseSchema,
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
    clearNotifications: {
      method: 'POST' as const,
      path: '/api/drc-meetings/notifications/clear',
      responses: {
        200: z.object({
          cleared: z.number(),
        }),
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
    dashboard: {
      method: 'GET' as const,
      path: '/api/drc-chairman/dashboard',
      input: z.object({
        category: chairmanDashboardCategorySchema.optional(),
      }).optional(),
      responses: {
        200: z.object({
          activeCategory: chairmanDashboardCategorySchema,
          metrics: chairmanDashboardMetricsSchema,
          rows: z.array(chairmanDashboardRowSchema),
        }),
      },
    },
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
  ,
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(insertNoticeSchema),
      },
    },
    clearAll: {
      method: 'POST' as const,
      path: '/api/notifications/clear',
      responses: {
        200: z.object({
          cleared: z.number(),
        }),
      },
    },
    clearOne: {
      method: 'POST' as const,
      path: '/api/notifications/:id/clear',
      responses: {
        200: z.object({
          cleared: z.boolean(),
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
