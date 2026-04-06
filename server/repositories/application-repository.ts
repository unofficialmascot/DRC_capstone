import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import {
  applications,
  applicationDocuments,
  applicationReviews,
  documents,
  scholars,
  users,
  type Document,
  type Application,
  type InsertApplicationDocument,
  type ApplicationReview,
  type InsertApplication,
  type InsertApplicationReview,
} from "@shared/schema";
import { getScholarSelectFields } from "./scholar-compat";

export type AttachedApplicationDocument = Document & {
  requirementCode: string | null;
  attachedBy: string;
  attachedAt: Date | string | null;
};

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
    const scholarFields = await getScholarSelectFields();
    const [result] = await db
      .select({
        applications,
        scholars: scholarFields,
        users,
      })
      .from(applications)
      .leftJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(eq(applications.id, id));

    if (!result) {
      return undefined;
    }

    const attachedDocuments = await this.getApplicationDocuments(result.applications.id);

    const scholarDocuments = attachedDocuments.length > 0
      ? attachedDocuments
      : await db
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
    const scholarFields = await getScholarSelectFields();
    const results = await db
      .select({
        applications,
        scholars: scholarFields,
        users,
      })
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
    const scholarFields = await getScholarSelectFields();
    const results = await db
      .select({
        applications,
        scholars: scholarFields,
      })
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

  async getApplicationsBySupervision(employeeId: string): Promise<Application[]> {
    const scholarFields = await getScholarSelectFields();
    const results = await db
      .select({
        applications,
        scholars: scholarFields,
        users,
      })
      .from(applications)
      .innerJoin(scholars, eq(scholars.scholarId, applications.scholarId))
      .leftJoin(users, eq(users.id, scholars.userId))
      .where(
        or(
          eq(scholars.supervisorId, employeeId),
          eq(scholars.coSupervisorId, employeeId),
        ),
      )
      .orderBy(desc(applications.submissionDate));

    return results.map((result) => {
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
      } as any;
    });
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
    await db.delete(applicationDocuments).where(eq(applicationDocuments.applicationId, id));
    await db.delete(applications).where(eq(applications.id, id));
  }

  async attachDocumentsToApplication(
    applicationId: number,
    attachments: Array<Pick<InsertApplicationDocument, "documentId" | "requirementCode" | "attachedBy">>,
  ): Promise<void> {
    if (attachments.length === 0) {
      return;
    }

    await db.insert(applicationDocuments).values(
      attachments.map((attachment) => ({
        applicationId,
        documentId: attachment.documentId,
        requirementCode: attachment.requirementCode ?? null,
        attachedBy: attachment.attachedBy ?? "scholar",
      })),
    );
  }

  async getApplicationDocuments(applicationId: number): Promise<AttachedApplicationDocument[]> {
    const rows = await db
      .select({
        id: documents.id,
        scholarId: documents.scholarId,
        documentType: documents.documentType,
        category: documents.category,
        fileName: documents.fileName,
        filePath: documents.filePath,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        uploadedAt: documents.uploadedAt,
        isVerified: documents.isVerified,
        verifiedBy: documents.verifiedBy,
        verifiedAt: documents.verifiedAt,
        requirementCode: applicationDocuments.requirementCode,
        attachedBy: applicationDocuments.attachedBy,
        attachedAt: applicationDocuments.attachedAt,
      })
      .from(applicationDocuments)
      .innerJoin(documents, eq(documents.id, applicationDocuments.documentId))
      .where(eq(applicationDocuments.applicationId, applicationId))
      .orderBy(desc(applicationDocuments.attachedAt), desc(documents.uploadedAt));

    return rows;
  }

  async getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]> {
    return db
      .select()
      .from(applicationReviews)
      .where(eq(applicationReviews.applicationId, applicationId))
      .orderBy(applicationReviews.reviewDate);
  }

  async getReviewForApplicationStage(
    applicationId: number,
    reviewerId: string,
    stage: string,
  ): Promise<ApplicationReview | undefined> {
    const [review] = await db
      .select()
      .from(applicationReviews)
      .where(
        and(
          eq(applicationReviews.applicationId, applicationId),
          eq(applicationReviews.reviewerId, reviewerId),
          eq(applicationReviews.stage, stage),
        ),
      )
      .orderBy(desc(applicationReviews.reviewDate), desc(applicationReviews.id))
      .limit(1);

    return review;
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
