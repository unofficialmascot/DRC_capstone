import { db } from "./db";
import {
  applications,
  applicationAttachments,
  applicationRequiredDocuments,
  applicationReviewerChecklist,
  applicationReviews,
  courseCompletion,
  employees,
  feePayments,
  racReviews,
  researchProgress,
  scholarPersonalDetails,
  scholarSupervisors,
  scholars,
  users,
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type {
  Application,
  ApplicationAttachment,
  ApplicationReview,
  CreateApplicationAttachmentInput,
  CreateApplicationInput,
  CreateCourseCompletionInput,
  CreateEmployeeInput,
  CreateFeePaymentInput,
  CreateResearchProgressInput,
  CreateReviewInput,
  CreateScholarFeeDemandInput,
  CreateScholarPersonalDetailsInput,
  CreateScholarProfileInput,
  CreateUserInput,
  Employee,
  RequiredDocument,
  ResearchProgress,
  Scholar,
  ScholarPersonalDetails,
  UpdateApplicationInput,
  UpdateApplicationReviewerChecklistInput,
  UpdateUserInput,
  User,
} from "./domain/types";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserWithScholar(id: number): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByScholarId(scholarId: string): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<(User & Partial<Employee>) | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: CreateUserInput): Promise<User>;
  updateUser(id: number, updates: UpdateUserInput): Promise<User>;
  
  // Employees
  getEmployee(employeeId: string): Promise<Employee | undefined>;
  createEmployee(emp: CreateEmployeeInput): Promise<Employee>;
  
  // Applications
  getApplications(scholarId?: number): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByStage(stage: string): Promise<Application[]>;
  getApplicationsForSupervisor(employeeId: string): Promise<Application[]>;
  createApplication(app: CreateApplicationInput): Promise<Application>;
  updateApplication(id: number, updates: UpdateApplicationInput): Promise<Application>;
  
  // Application Reviews
  getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]>;
  createReview(review: CreateReviewInput): Promise<ApplicationReview>;
  isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean>;
  getScholarsBySupervisor(supervisorId: number | string): Promise<(Scholar & Partial<User>)[]>;
  createScholarProfile(profile: CreateScholarProfileInput): Promise<Scholar>;
  
  // Stats
  getResearchProgress(scholarId: string): Promise<ResearchProgress | undefined>;
  createResearchProgress(stats: CreateResearchProgressInput): Promise<ResearchProgress>;
  getScholarById(id: number): Promise<Scholar | undefined>;
  getScholarByScholarId(scholarId: string): Promise<Scholar | undefined>;
  getScholarPersonalDetails(scholarId: number): Promise<ScholarPersonalDetails | undefined>;
  createScholarPersonalDetails(details: CreateScholarPersonalDetailsInput): Promise<ScholarPersonalDetails>;
  createCourseCompletion(record: CreateCourseCompletionInput): Promise<Record<string, unknown>>;
  createScholarFeeDemand(record: CreateScholarFeeDemandInput): Promise<Record<string, unknown>>;
  createFeePayment(record: CreateFeePaymentInput): Promise<Record<string, unknown>>;
  createApplicationAttachment(attachment: CreateApplicationAttachmentInput): Promise<ApplicationAttachment>;
  getApplicationAttachments(applicationId: number): Promise<ApplicationAttachment[]>;
  getApplicationAttachmentsByType(applicationId: number, documentType: string): Promise<ApplicationAttachment[]>;
  updateApplicationAttachmentVerification(
    attachmentId: number,
    verifiedBy: number,
    isVerified: boolean,
    verificationNotes?: string,
  ): Promise<ApplicationAttachment[]>;
  deleteApplicationAttachment(attachmentId: number, uploadedBy: number): Promise<ApplicationAttachment[]>;
  getApplicationRequiredDocuments(applicationType: string): Promise<RequiredDocument[]>;
  createApplicationRequiredDocument(
    applicationType: string,
    documentType: string,
    displayName: string,
    isMandatory?: boolean,
    description?: string,
  ): Promise<RequiredDocument>;
  updateApplicationReviewerChecklist(
    applicationId: number,
    reviewerId: number,
    reviewStage: string,
    updates: UpdateApplicationReviewerChecklistInput,
  ): Promise<Record<string, unknown>[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .where(eq(users.id, id));

    if (!record) {
      return undefined;
    }

    const { id: _scholarRecordId, ...scholarData } = record.scholars ?? {};
    return { ...scholarData, ...record.users };
  }

  async getUserByScholarId(
    scholarId: string,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .where(eq(scholars.scholarId, scholarId));

    if (!record) {
      return undefined;
    }

    return { ...record.scholars, ...record.users };
  }

  async getUserByEmployeeId(
    employeeId: string,
  ): Promise<(User & Partial<Employee>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(employees, eq(employees.userId, users.id))
      .where(eq(employees.employeeId, employeeId));

    if (!record) {
      return undefined;
    }

    return { ...record.employees, ...record.users };
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: CreateUserInput): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password || "password123", 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword
    }).returning();
    return newUser;
  }

  async updateUser(id: number, updates: UpdateUserInput): Promise<User> {
    // Hash password if being updated
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async getEmployee(employeeId: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return emp;
  }

  async createEmployee(emp: CreateEmployeeInput): Promise<Employee> {
    const [newEmp] = await db.insert(employees).values(emp).returning();
    return newEmp;
  }

  async getApplications(scholarId?: number): Promise<Application[]> {
    if (scholarId) {
      return db.select().from(applications).where(eq(applications.userId, scholarId)).orderBy(desc(applications.submissionDate));
    }
    return db.select().from(applications).orderBy(desc(applications.submissionDate));
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async getApplicationsByStage(stage: string): Promise<Application[]> {
    return db.select().from(applications)
      .where(and(eq(applications.currentStage, stage), eq(applications.status, "Pending")))
      .orderBy(desc(applications.submissionDate));
  }

  async getApplicationsForSupervisor(employeeId: string): Promise<Application[]> {
    // Get the supervisor's user ID from the employee record
    const [supervisor] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId));

    if (!supervisor) return [];

    // Get applications where the supervisor is assigned to the scholar
    const results = await db
      .select()
      .from(applications)
      .innerJoin(
        scholarSupervisors,
        eq(scholarSupervisors.userId, applications.userId),
      )
      .where(
        and(
          eq(applications.currentStage, "supervisor"),
          eq(applications.status, "Pending"),
          eq(scholarSupervisors.supervisorId, supervisor.userId),
        ),
      )
      .orderBy(desc(applications.submissionDate));

    return results.map((result) => result.applications);
  }

  async createApplication(app: CreateApplicationInput): Promise<Application> {
    const userId = app.userId ?? app.scholarId;
    if (!userId) {
      throw new Error("Application requires a userId");
    }
    const [newApp] = await db.insert(applications).values({
      ...app,
      userId,
    }).returning();
    return newApp;
  }

  async updateApplication(id: number, updates: UpdateApplicationInput): Promise<Application> {
    const [updated] = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return updated;
  }

  async getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]> {
    return db.select().from(applicationReviews)
      .where(eq(applicationReviews.applicationId, applicationId))
      .orderBy(applicationReviews.reviewDate);
  }

  async createReview(review: CreateReviewInput): Promise<ApplicationReview> {
    const reviewerId = typeof review.reviewerId === "string"
      ? parseInt(review.reviewerId, 10)
      : review.reviewerId;
    const [newReview] = await db.insert(applicationReviews).values({
      ...review,
      reviewerId,
    }).returning();
    return newReview;
  }

  async isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean> {
    const [supervisorRecord] = await db
      .select()
      .from(scholarSupervisors)
      .innerJoin(scholars, eq(scholars.id, scholarSupervisors.scholarId))
      .where(and(
        eq(scholars.scholarId, scholarId),
        eq(scholarSupervisors.supervisorId, parseInt(employeeId))
      ));

    return !!supervisorRecord;
  }

  async getScholarsBySupervisor(supervisorId: number | string): Promise<(Scholar & Partial<User>)[]> {
    const numericId = typeof supervisorId === 'string' ? parseInt(supervisorId) : supervisorId;
    
    const results = await db
      .select({
        scholar: scholars,
        user: users
      })
      .from(scholars)
      .innerJoin(users, eq(users.id, scholars.userId))
      .innerJoin(scholarSupervisors, eq(scholarSupervisors.userId, scholars.userId))
      .where(eq(scholarSupervisors.supervisorId, numericId));
    
    return results.map(r => ({
      ...r.scholar,
      ...r.user
    }));
  }

  async createScholarProfile(
    profile: CreateScholarProfileInput,
  ): Promise<Scholar> {
    const [newProfile] = await db.insert(scholars).values(profile).returning();
    return newProfile;
  }

  async getResearchProgress(scholarId: string): Promise<ResearchProgress | undefined> {
    // Convert scholarId string to number for lookup
    const numericId = parseInt(scholarId, 10);
    const [stats] = await db.select().from(researchProgress).where(eq(researchProgress.userId, numericId));
    return stats;
  }

  async createResearchProgress(stats: CreateResearchProgressInput): Promise<ResearchProgress> {
    const userId = stats.userId ?? stats.scholarId;
    if (!userId) {
      throw new Error("Research progress requires a userId");
    }
    const [newStats] = await db.insert(researchProgress).values({
      ...stats,
      userId,
    }).returning();
    return newStats;
  }

  // === SCHOLAR HELPER METHODS ===
  async getScholarById(id: number): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.userId, id));
    return scholar;
  }

  async getScholarByScholarId(scholarId: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.scholarId, scholarId));
    return scholar;
  }

  async getScholarPersonalDetails(scholarId: number): Promise<ScholarPersonalDetails | undefined> {
    const [details] = await db.select().from(scholarPersonalDetails).where(eq(scholarPersonalDetails.userId, scholarId));
    return details;
  }

  async createScholarPersonalDetails(details: CreateScholarPersonalDetailsInput): Promise<ScholarPersonalDetails> {
    const [newDetails] = await db.insert(scholarPersonalDetails).values(details).returning();
    return newDetails;
  }

  async createCourseCompletion(record: CreateCourseCompletionInput) {
    const [newRec] = await db.insert(courseCompletion).values(record).returning();
    return newRec;
  }

  async createScholarFeeDemand(record: CreateScholarFeeDemandInput) {
    const [newRec] = await db.insert(scholarFeeDemand).values(record).returning();
    return newRec;
  }

  async createFeePayment(record: CreateFeePaymentInput) {
    const [newRec] = await db.insert(feePayments).values(record).returning();
    return newRec;
  }

  // === APPLICATION ATTACHMENT METHODS ===
  async createApplicationAttachment(attachment: CreateApplicationAttachmentInput): Promise<ApplicationAttachment> {
    const [newAttachment] = await db.insert(applicationAttachments).values(attachment).returning();
    return newAttachment;
  }

  async getApplicationAttachments(applicationId: number): Promise<ApplicationAttachment[]> {
    return db.select().from(applicationAttachments).where(eq(applicationAttachments.applicationId, applicationId)).orderBy(applicationAttachments.uploadedOn);
  }

  async getApplicationAttachmentsByType(applicationId: number, documentType: string): Promise<ApplicationAttachment[]> {
    return db.select().from(applicationAttachments).where(and(eq(applicationAttachments.applicationId, applicationId), eq(applicationAttachments.documentType, documentType)));
  }

  async updateApplicationAttachmentVerification(attachmentId: number, verifiedBy: number, isVerified: boolean, verificationNotes?: string) {
    return db.update(applicationAttachments).set({ isVerified, verifiedBy, verificationNotes, verifiedOn: new Date() }).where(eq(applicationAttachments.id, attachmentId)).returning();
  }

  async deleteApplicationAttachment(attachmentId: number, uploadedBy: number) {
    // Only allow deletion by the uploader
    return db.delete(applicationAttachments).where(and(eq(applicationAttachments.id, attachmentId), eq(applicationAttachments.uploadedBy, uploadedBy))).returning();
  }

  // === REQUIRED DOCUMENTS METHODS ===
  async getApplicationRequiredDocuments(applicationType: string): Promise<RequiredDocument[]> {
    return db.select().from(applicationRequiredDocuments).where(eq(applicationRequiredDocuments.applicationType, applicationType)).orderBy(applicationRequiredDocuments.sortOrder);
  }

  async createApplicationRequiredDocument(applicationType: string, documentType: string, displayName: string, isMandatory: boolean = true, description?: string): Promise<RequiredDocument> {
    const [doc] = await db.insert(applicationRequiredDocuments).values({ applicationType, documentType, displayName, description, isMandatory }).returning();
    return doc;
  }

  // === REVIEWER CHECKLIST METHODS ===
  async updateApplicationReviewerChecklist(applicationId: number, reviewerId: number, reviewStage: string, updates: UpdateApplicationReviewerChecklistInput) {
    const existing = await db.select().from(applicationReviewerChecklist).where(and(eq(applicationReviewerChecklist.applicationId, applicationId), eq(applicationReviewerChecklist.reviewerId, reviewerId), eq(applicationReviewerChecklist.reviewStage, reviewStage)));

    if (existing.length > 0) {
      return db.update(applicationReviewerChecklist).set(updates).where(and(eq(applicationReviewerChecklist.applicationId, applicationId), eq(applicationReviewerChecklist.reviewerId, reviewerId), eq(applicationReviewerChecklist.reviewStage, reviewStage))).returning();
    } else {
      const [newChecklist] = await db.insert(applicationReviewerChecklist).values({ applicationId, reviewerId, reviewStage, ...updates }).returning();
      return [newChecklist];
    }
  }

  // === EXTENSION HELPER METHODS ===
  async countRacMeetings(scholarId: number): Promise<number> {
    const result = await db.select({ count: count() }).from(racReviews).where(eq(racReviews.userId, scholarId));
    return result[0]?.count || 0;
  }


  async checkIfPreTalkDone(scholarId: number): Promise<boolean> {
    // Check if there's a "Pre-Talk" or similar completion record
    // This would depend on your specific tracking
    // For now, returning false as placeholder
    return false;

  }
  async checkCourseCompletion(scholarId: number): Promise<boolean> {
    const [record] = await db.select().from(courseCompletion).where(eq(courseCompletion.userId, scholarId));
    if (!record) return false;
    return Boolean(record.completed);
  }

  async calculateFeeArrears(numericScholarId: number): Promise<number> {
    // Calculate total arrears from scholar_fee_demand and subtract completed payments
    // Accepts numeric scholar ID to avoid nested lookups
    const demands = await db.select().from(scholarFeeDemand).where(eq(scholarFeeDemand.userId, numericScholarId));
    let totalDemand = 0;
    for (const d of demands) {
      totalDemand += Number(d.arrearsAmount || 0) + Number(d.annualFee || 0);
    }

    const payments = await db.select().from(feePayments).where(and(eq(feePayments.userId, numericScholarId), eq(feePayments.paymentStatus, 'COMPLETED')));
    let totalPaid = 0;
    for (const p of payments) {
      totalPaid += Number(p.amountPaid || 0);
    }

    const arrears = totalDemand - totalPaid;
    return arrears > 0 ? arrears : 0;
  }

  async countApprovedExtensions(scholarId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(applications).where(and(eq(applications.userId, scholarId), eq(applications.type, "Extension"), eq(applications.finalOutcome, "Approved")));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
// Helper function to verify password
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
