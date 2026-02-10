import { db } from "./db";
import { 
  users, 
  applications, 
  researchProgress, 
  applicationReviews,
  type User, 
  type InsertUser, 
  type Application, 
  type InsertApplication,
  type ApplicationReview,
  type InsertApplicationReview
} from "@shared/schema";
import { eq, and, desc, inArray, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Applications
  getApplications(scholarId?: number): Promise<Application[]>;
  getApplicationsForSupervisor(supervisorId: number): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByStage(stage: string): Promise<Application[]>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application>;
  
  // Application Reviews
  getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]>;
  createReview(review: InsertApplicationReview): Promise<ApplicationReview>;
  
  // Stats
  getResearchProgress(scholarId: number): Promise<typeof researchProgress.$inferSelect | undefined>;
  createResearchProgress(stats: typeof researchProgress.$inferInsert): Promise<typeof researchProgress.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async getApplications(scholarId?: number): Promise<Application[]> {
    if (scholarId) {
      return db.select().from(applications).where(eq(applications.scholarId, scholarId)).orderBy(desc(applications.submissionDate));
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

  async getApplicationsForSupervisor(supervisorId: number): Promise<Application[]> {
    const supervisor = await this.getUser(supervisorId);
    if (!supervisor) {
      return [];
    }

    const supervisedScholars = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.role, "scholar"),
          or(eq(users.supervisor, supervisor.name), eq(users.coSupervisor, supervisor.name)),
        ),
      );

    const scholarIds = supervisedScholars.map((scholar) => scholar.id);
    if (scholarIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(applications)
      .where(inArray(applications.scholarId, scholarIds))
      .orderBy(desc(applications.submissionDate));
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

  async getResearchProgress(scholarId: number): Promise<typeof researchProgress.$inferSelect | undefined> {
    const [stats] = await db.select().from(researchProgress).where(eq(researchProgress.scholarId, scholarId));
    return stats;
  }

  async createResearchProgress(stats: typeof researchProgress.$inferInsert): Promise<typeof researchProgress.$inferSelect> {
    const [newStats] = await db.insert(researchProgress).values(stats).returning();
    return newStats;
  }
}

export const storage = new DatabaseStorage();
