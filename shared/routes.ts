import { z } from "zod";
import { insertApplicationReviewSchema, insertApplicationSchema, insertUserSchema } from "./schema";

export const api = {
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users",
      responses: {
        200: z.array(insertUserSchema),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/users/:id",
      responses: {
        200: insertUserSchema,
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/users/:id",
      input: insertUserSchema.partial(),
      responses: {
        200: insertUserSchema,
      },
    },
  },
  applications: {
    list: {
      method: "GET" as const,
      path: "/api/applications",
      input: z
        .object({
          userId: z.coerce.string().optional(),
          scholarId: z.coerce.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(insertApplicationSchema),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/applications",
      input: insertApplicationSchema.omit({
        id: true,
        submissionDate: true,
        currentStage: true,
        status: true,
        finalOutcome: true,
      }),
      responses: {
        201: insertApplicationSchema,
      },
    },
    getByStage: {
      method: "GET" as const,
      path: "/api/applications/stage/:stage",
      responses: {
        200: z.array(insertApplicationSchema),
      },
    },
    getReviews: {
      method: "GET" as const,
      path: "/api/applications/:id/reviews",
      responses: {
        200: z.array(insertApplicationReviewSchema),
      },
    },
    documents: {
      list: {
        method: "GET" as const,
        path: "/api/applications/:id/documents",
        responses: {
          200: z.array(z.object({}).passthrough()),
        },
      },
      checklist: {
        method: "GET" as const,
        path: "/api/applications/:id/document-checklist",
        responses: {
          200: z.array(z.object({}).passthrough()),
        },
      },
      uploadUrl: {
        method: "POST" as const,
        path: "/api/applications/:id/upload-url",
        input: z.object({
          documentType: z.string().min(1),
          fileName: z.string().min(1),
          mimeType: z.string().min(1),
          fileSize: z.number().positive(),
        }),
        responses: {
          200: z
            .object({
              uploadUrl: z.string().url(),
              downloadUrl: z.string().url(),
              objectKey: z.string(),
            })
            .passthrough(),
        },
      },
      upload: {
        method: "POST" as const,
        path: "/api/applications/:id/upload-document",
        input: z.object({
          documentType: z.string().min(1),
          fileName: z.string().min(1),
          fileUrl: z.string().url(),
          fileSize: z.number().positive(),
          mimeType: z.string().min(1),
          objectKey: z.string().min(1),
        }),
      },
    },
    review: {
      method: "POST" as const,
      path: "/api/applications/:id/review",
      input: z.object({
        reviewerId: z.number(),
        decision: z.enum(["approved", "rejected"]),
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
  extensions: {
    checkEligibility: {
      method: "GET" as const,
      path: "/api/extensions/check-eligibility/:scholarIdentifier",
      responses: {
        200: z.object({}).passthrough(),
      },
    },
  },
  supervisors: {
    scholars: {
      method: "GET" as const,
      path: "/api/supervisors/scholars",
      responses: {
        200: z.array(z.object({}).passthrough()),
      },
    },
    applications: {
      method: "GET" as const,
      path: "/api/supervisors/applications",
      responses: {
        200: z.array(z.object({}).passthrough()),
      },
    },
  },
  thesisSubmissions: {
    list: {
      method: "GET" as const,
      path: "/api/thesis-submissions",
      responses: {
        200: z.array(z.unknown()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/thesis-submissions",
      input: z.object({}).passthrough(),
      responses: {
        201: z.object({ message: z.string() }),
      },
    },
  },
  stats: {
    get: {
      method: "GET" as const,
      path: "/api/stats/:userId",
      responses: {
        200: z.object({
          completedReviews: z.number(),
          pendingReports: z.number(),
          publications: z.number(),
        }),
      },
    },
  },
  fees: {
    list: {
      method: "GET" as const,
      path: "/api/fees/structure",
      responses: {
        200: z.array(
          z.object({
            feeId: z.number(),
            academicYear: z.string(),
            phase: z.string(),
            batch: z.string(),
            year1Fee: z.union([z.string(), z.number()]).nullable().optional(),
            year2Fee: z.union([z.string(), z.number()]).nullable().optional(),
            year3Fee: z.union([z.string(), z.number()]).nullable().optional(),
            year4Fee: z.union([z.string(), z.number()]).nullable().optional(),
          }),
        ),
      },
    },
  },
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

export function appendQuery(path: string, query?: Record<string, string | number | undefined | null>) {
  if (!query) return path;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}
