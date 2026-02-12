import { db } from "./db";
import { 
  users, 
  scholars,
  employees,
  racMembers,
  applications, 
  researchProgress, 
  applicationReviews,
  documents,
  type Scholar,
  type User, 
  type InsertUser, 
  type Application, 
  type InsertApplication,
  type ApplicationReview,
  type InsertApplicationReview,
  type Document,
  type InsertDocument
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserWithScholar(id: number): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined>;
  getUserByScholarId(scholarId: string): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<(User & Partial<typeof employees.$inferSelect>) | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Employees
  getEmployee(employeeId: string): Promise<typeof employees.$inferSelect | undefined>;
  createEmployee(emp: typeof employees.$inferInsert): Promise<typeof employees.$inferSelect>;
  
  // Applications
  getApplications(scholarId?: string): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByStage(stage: string): Promise<Application[]>;
  getApplicationsForSupervisor(employeeId: string): Promise<Application[]>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application>;
  
  // Application Reviews
  getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]>;
  createReview(review: InsertApplicationReview): Promise<ApplicationReview>;
  isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean>;
  createScholarProfile(
    profile: typeof scholars.$inferInsert,
  ): Promise<typeof scholars.$inferSelect>;
  updateScholarProfile(
    scholarId: string,
    updates: Partial<typeof scholars.$inferInsert>,
  ): Promise<typeof scholars.$inferSelect>;
  
  // Documents
  getDocuments(scholarId: string): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Stats
  getResearchProgress(scholarId: string): Promise<typeof researchProgress.$inferSelect | undefined>;
  createResearchProgress(stats: typeof researchProgress.$inferInsert): Promise<typeof researchProgress.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined> {
    const [record] = await db
      .select()
      .from(users)
      .leftJoin(scholars, eq(scholars.userId, users.id))
      .leftJoin(employees, eq(employees.userId, users.id))
      .where(eq(users.id, id));

    if (!record) {
      return undefined;
    }

    // Merge all parts of the record
    const result = { ...record.users };
    if (record.scholars) {
      Object.assign(result, record.scholars);
    }
    if (record.employees) {
      Object.assign(result, record.employees);
    }

    return result;
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
  ): Promise<(User & Partial<typeof employees.$inferSelect>) | undefined> {
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

  async createUser(user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password || "password123", 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword
    }).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    // Hash password if being updated
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async getEmployee(employeeId: string): Promise<typeof employees.$inferSelect | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return emp;
  }

  async createEmployee(emp: typeof employees.$inferInsert): Promise<typeof employees.$inferSelect> {
    const [newEmp] = await db.insert(employees).values(emp).returning();
    return newEmp;
  }

  async getApplications(scholarId?: string): Promise<Application[]> {
    if (scholarId) {
      return db.select().from(applications).where(eq(applications.scholarId, scholarId)).orderBy(desc(applications.submissionDate));
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

    // Get documents for this scholar
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.scholarId, result.applications.scholarId))
      .orderBy(desc(documents.uploadedAt));

    // Merge scholar and user data
    const scholarData = result.scholars && result.users ? {
      ...result.scholars,
      name: result.users.name,
      email: result.users.email,
      phone: result.users.phone,
    } : undefined;

    return {
      ...result.applications,
      scholar: scholarData,
      documents: docs,
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

    return results.map(result => {
      const scholarData = result.scholars && result.users ? {
        scholarId: result.scholars.scholarId,
        name: result.users.name,
        email: result.users.email,
        phone: result.users.phone,
        department: result.scholars.department,
        researchArea: result.scholars.researchArea,
        researchTitle: result.scholars.researchTitle,
      } : undefined;

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
      .innerJoin(
        scholars,
        and(
          eq(scholars.scholarId, applications.scholarId)
        ),
      )
      .where(
        and(
          eq(applications.currentStage, "supervisor"),
          eq(applications.status, "Pending"),
          // Supervisor is either primary or co-supervisor
        ),
      )
      .orderBy(desc(applications.submissionDate));

    // Filter for this specific supervisor
    return results
      .filter(result => 
        result.scholars.supervisorId === employeeId || 
        result.scholars.coSupervisorId === employeeId
      )
      .map((result) => result.applications);
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [newApp] = await db.insert(applications).values(app).returning();
    return newApp;
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application> {
    const [updated] = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return updated;
  }

  async getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]> {
    return db.select().from(applicationReviews)
      .where(eq(applicationReviews.applicationId, applicationId))
      .orderBy(applicationReviews.reviewDate);
  }

  async createReview(review: InsertApplicationReview): Promise<ApplicationReview> {
    const [newReview] = await db.insert(applicationReviews).values(review).returning();
    return newReview;
  }

  async isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean> {
    const [scholar] = await db
      .select()
      .from(scholars)
      .where(eq(scholars.scholarId, scholarId));

    if (!scholar) return false;
    return scholar.supervisorId === employeeId || scholar.coSupervisorId === employeeId;
  }

  async createScholarProfile(
    profile: typeof scholars.$inferInsert,
  ): Promise<typeof scholars.$inferSelect> {
    const [newProfile] = await db.insert(scholars).values(profile).returning();
    return newProfile;
  }

  async updateScholarProfile(
    scholarId: string,
    updates: Partial<typeof scholars.$inferInsert>,
  ): Promise<typeof scholars.$inferSelect> {
    const [updatedProfile] = await db
      .update(scholars)
      .set(updates)
      .where(eq(scholars.scholarId, scholarId))
      .returning();
    return updatedProfile;
  }

  async getResearchProgress(scholarId: string): Promise<typeof researchProgress.$inferSelect | undefined> {
    const [stats] = await db.select().from(researchProgress).where(eq(researchProgress.scholarId, scholarId));
    return stats;
  }

  async createResearchProgress(stats: typeof researchProgress.$inferInsert): Promise<typeof researchProgress.$inferSelect> {
    const [newStats] = await db.insert(researchProgress).values(stats).returning();
    return newStats;
  }

  // Documents
  async getDocuments(scholarId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.scholarId, scholarId));
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document> {
    const [updated] = await db.update(documents).set(updates).where(eq(documents.id, id)).returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();

// Helper function to verify password
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
