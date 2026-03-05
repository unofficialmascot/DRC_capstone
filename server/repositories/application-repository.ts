import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  applications,
  applicationReviews,
  documents,
  scholars,
  users,
  type Application,
  type ApplicationReview,
  type InsertApplication,
  type InsertApplicationReview,
} from "@shared/schema";

export class ApplicationRepository {
  async getApplications(scholarId?: string): Promise<Application[]> {
    if (scholarId) {
      return db
        .select()
        .from(applications)
        .where(eq(applications.scholarId, scholarId))
        .orderBy(desc(applications.submissionDate));
    }

    return db.select().from(applications).orderBy(desc(applications.submissionDate));
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const [result] = await db
      .select()
      .from(applications)
      .leftJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(eq(applications.id, id));

    if (!result) {
      return undefined;
    }

    const scholarDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.scholarId, result.applications.scholarId))
      .orderBy(desc(documents.uploadedAt));

    const scholarData =
      result.scholars && result.users
        ? {
            ...result.scholars,
            name: result.users.name,
            email: result.users.email,
            phone: result.users.phone,
          }
        : undefined;

    return {
      ...result.applications,
      scholar: scholarData,
      documents: scholarDocuments,
    } as any;
  }

  async getApplicationsByStage(stage: string): Promise<Application[]> {
    const results = await db
      .select()
      .from(applications)
      .leftJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(and(eq(applications.currentStage, stage), eq(applications.status, "Pending")))
      .orderBy(desc(applications.submissionDate));

    return results.map((result) => {
      const scholarData =
        result.scholars && result.users
          ? {
              scholarId: result.scholars.scholarId,
              name: result.users.name,
              email: result.users.email,
              phone: result.users.phone,
              department: result.scholars.department,
              researchArea: result.scholars.researchArea,
              researchTitle: result.scholars.researchTitle,
            }
          : undefined;

      return {
        ...result.applications,
        scholar: scholarData,
      } as any;
    });
  }

  async getApplicationsForSupervisor(employeeId: string): Promise<Application[]> {
    const results = await db
      .select()
      .from(applications)
      .innerJoin(scholars, and(eq(scholars.scholarId, applications.scholarId)))
      .where(
        and(
          eq(applications.currentStage, "supervisor"),
          eq(applications.status, "Pending"),
        ),
      )
      .orderBy(desc(applications.submissionDate));

    return results
      .filter(
        (result) =>
          result.scholars.supervisorId === employeeId ||
          result.scholars.coSupervisorId === employeeId,
      )
      .map((result) => result.applications);
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [newApp] = await db
      .insert(applications)
      .values(normalizeApplicationInsert(app))
      .returning();
    return newApp;
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application> {
    const normalizedUpdates = normalizeApplicationUpdates(updates);
    const [updated] = await db
      .update(applications)
      .set(normalizedUpdates)
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async deleteApplication(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]> {
    return db
      .select()
      .from(applicationReviews)
      .where(eq(applicationReviews.applicationId, applicationId))
      .orderBy(applicationReviews.reviewDate);
  }

  async createReview(review: InsertApplicationReview): Promise<ApplicationReview> {
    const [newReview] = await db.insert(applicationReviews).values(review).returning();
    return newReview;
  }
}

function normalizeApplicationInsert(
  app: InsertApplication,
): typeof applications.$inferInsert {
  const submissionDate =
    !app.submissionDate || app.submissionDate instanceof Date
      ? app.submissionDate
      : new Date(app.submissionDate);

  return {
    ...app,
    submissionDate,
  } as typeof applications.$inferInsert;
}

function normalizeApplicationUpdates(
  updates: Partial<InsertApplication>,
): Partial<typeof applications.$inferInsert> {
  const submissionDate =
    !updates.submissionDate || updates.submissionDate instanceof Date
      ? updates.submissionDate
      : new Date(updates.submissionDate);

  return {
    ...updates,
    submissionDate,
  } as Partial<typeof applications.$inferInsert>;
}
