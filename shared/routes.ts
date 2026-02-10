import { z } from 'zod';
import { insertUserSchema, insertApplicationSchema, insertApplicationReviewSchema } from './schema';

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
        scholarId: z.coerce.number().optional(),
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
    listForSupervisor: {
      method: 'GET' as const,
      path: '/api/applications/supervisor',
      responses: {
        200: z.array(insertApplicationSchema),
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
        reviewerId: z.number(),
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
