import bcrypt from "bcryptjs";
import {
  employees,
  scholars,
  researchProgress,
  type Scholar,
  type User,
  type InsertUser,
  type Application,
  type InsertApplication,
  type ApplicationReview,
  type InsertApplicationReview,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { UserRepository } from "./repositories/user-repository";
import type { AssignedScholarSummary } from "./repositories/user-repository";
import { ApplicationRepository } from "./repositories/application-repository";
import { DocumentRepository } from "./repositories/document-repository";
import { ResearchRepository } from "./repositories/research-repository";

export interface SupervisorOption {
  employeeId: string;
  name: string;
  department: string | null;
  designation: string | null;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserWithScholar(id: number): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined>;
  getUserByScholarId(scholarId: string): Promise<(User & Partial<Scholar>) | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<(User & Partial<typeof employees.$inferSelect>) | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  getEmployee(employeeId: string): Promise<typeof employees.$inferSelect | undefined>;
  createEmployee(emp: typeof employees.$inferInsert): Promise<typeof employees.$inferSelect>;
  listSupervisors(): Promise<SupervisorOption[]>;
  countAssignedScholars(employeeId: string): Promise<number>;
  listAssignedScholars(employeeId: string): Promise<AssignedScholarSummary[]>;
  createSupervisorChangeHistory(entry: {
    scholarId: string;
    applicationId: number;
    previousSupervisorId?: string | null;
    newSupervisorId: string;
  }): Promise<unknown>;

  getApplications(scholarId?: string): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByStage(stage: string): Promise<Application[]>;
  getApplicationsForSupervisor(employeeId: string): Promise<Application[]>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application>;
  deleteApplication(id: number): Promise<void>;

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

  getDocuments(scholarId: string): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  getResearchProgress(scholarId: string): Promise<typeof researchProgress.$inferSelect | undefined>;
  createResearchProgress(stats: typeof researchProgress.$inferInsert): Promise<typeof researchProgress.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  private readonly users = new UserRepository();
  private readonly applications = new ApplicationRepository();
  private readonly documents = new DocumentRepository();
  private readonly research = new ResearchRepository();

  async getUser(id: number): Promise<User | undefined> {
    return this.users.getUser(id);
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar> & Partial<typeof employees.$inferSelect>) | undefined> {
    return this.users.getUserWithScholar(id);
  }

  async getUserByScholarId(
    scholarId: string,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    return this.users.getUserByScholarId(scholarId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.getUserByEmail(email);
  }

  async getUserByEmployeeId(
    employeeId: string,
  ): Promise<(User & Partial<typeof employees.$inferSelect>) | undefined> {
    return this.users.getUserByEmployeeId(employeeId);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users.getAllUsers();
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.users.createUser(user);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    return this.users.updateUser(id, updates);
  }

  async getEmployee(employeeId: string): Promise<typeof employees.$inferSelect | undefined> {
    return this.users.getEmployee(employeeId);
  }

  async createEmployee(emp: typeof employees.$inferInsert): Promise<typeof employees.$inferSelect> {
    return this.users.createEmployee(emp);
  }

  async listSupervisors(): Promise<SupervisorOption[]> {
    return this.users.listSupervisors();
  }

  async countAssignedScholars(employeeId: string): Promise<number> {
    return this.users.countAssignedScholars(employeeId);
  }

  async listAssignedScholars(employeeId: string): Promise<AssignedScholarSummary[]> {
    return this.users.listAssignedScholars(employeeId);
  }

  async createSupervisorChangeHistory(entry: {
    scholarId: string;
    applicationId: number;
    previousSupervisorId?: string | null;
    newSupervisorId: string;
  }): Promise<unknown> {
    return this.users.createSupervisorChangeHistory(entry);
  }

  async getApplications(scholarId?: string): Promise<Application[]> {
    return this.applications.getApplications(scholarId);
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    return this.applications.getApplicationById(id);
  }

  async getApplicationsByStage(stage: string): Promise<Application[]> {
    return this.applications.getApplicationsByStage(stage);
  }

  async getApplicationsForSupervisor(employeeId: string): Promise<Application[]> {
    return this.applications.getApplicationsForSupervisor(employeeId);
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    return this.applications.createApplication(app);
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application> {
    return this.applications.updateApplication(id, updates);
  }

  async deleteApplication(id: number): Promise<void> {
    return this.applications.deleteApplication(id);
  }

  async getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]> {
    return this.applications.getReviewsForApplication(applicationId);
  }

  async createReview(review: InsertApplicationReview): Promise<ApplicationReview> {
    return this.applications.createReview(review);
  }

  async isSupervisorForScholar(employeeId: string, scholarId: string): Promise<boolean> {
    return this.users.isSupervisorForScholar(employeeId, scholarId);
  }

  async createScholarProfile(
    profile: typeof scholars.$inferInsert,
  ): Promise<typeof scholars.$inferSelect> {
    return this.users.createScholarProfile(profile);
  }

  async updateScholarProfile(
    scholarId: string,
    updates: Partial<typeof scholars.$inferInsert>,
  ): Promise<typeof scholars.$inferSelect> {
    return this.users.updateScholarProfile(scholarId, updates);
  }

  async getDocuments(scholarId: string): Promise<Document[]> {
    return this.documents.getDocuments(scholarId);
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documents.getDocumentById(id);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    return this.documents.createDocument(doc);
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document> {
    return this.documents.updateDocument(id, updates);
  }

  async deleteDocument(id: number): Promise<void> {
    return this.documents.deleteDocument(id);
  }

  async getResearchProgress(
    scholarId: string,
  ): Promise<typeof researchProgress.$inferSelect | undefined> {
    return this.research.getResearchProgress(scholarId);
  }

  async createResearchProgress(
    stats: typeof researchProgress.$inferInsert,
  ): Promise<typeof researchProgress.$inferSelect> {
    return this.research.createResearchProgress(stats);
  }
}

export const storage = new DatabaseStorage();

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
