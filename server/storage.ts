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
  feeStructure,
  racReviews,
  researchProgress,
  scholarPersonalDetails,
  scholarSupervisors,
  scholars,
  users,
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
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
  FeeStructure,
  RequiredDocument,
  ResearchProgress,
  Scholar,
  ScholarSupervisor,
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
  getUserByName(name: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: CreateUserInput): Promise<User>;
  updateUser(id: number, updates: UpdateUserInput): Promise<User>;
  
  // Employees
  getEmployee(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
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
  isSupervisorForScholar(supervisorUserId: number, scholarId: string): Promise<boolean>;
  getScholarsBySupervisor(supervisorId: number | string): Promise<(Scholar & Partial<User>)[]>;
  createScholarProfile(profile: CreateScholarProfileInput): Promise<Scholar>;
  updateScholarPhase(userId: number, phase: string): Promise<Scholar>;
  updateScholarSupervisorAssignment(
    userId: number,
    supervisorId: number,
  ): Promise<ScholarSupervisor>;
  
  // Stats
  getResearchProgress(userId: number): Promise<ResearchProgress | undefined>;
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
  getFeeStructure(): Promise<FeeStructure[]>;
  updateApplicationReviewerChecklist(
    applicationId: number,
    reviewerId: number,
    reviewStage: string,
    updates: UpdateApplicationReviewerChecklistInput,
  ): Promise<Record<string, unknown>[]>;
}

type DemoDataFile = {
  users: User[];
  employees: Employee[];
  scholars: Scholar[];
  scholarSupervisors: ScholarSupervisor[];
  applications: Application[];
  applicationReviews: ApplicationReview[];
  researchProgress: ResearchProgress[];
  scholarPersonalDetails: ScholarPersonalDetails[];
  courseCompletion: Record<string, unknown>[];
  scholarFeeDemand: Record<string, unknown>[];
  feePayments: Record<string, unknown>[];
  feeStructure: FeeStructure[];
  applicationAttachments: ApplicationAttachment[];
  applicationRequiredDocuments: RequiredDocument[];
  applicationReviewerChecklist: Record<string, unknown>[];
  racReviews: Record<string, unknown>[];
};

const emptyDemoData = (): DemoDataFile => ({
  users: [],
  employees: [],
  scholars: [],
  scholarSupervisors: [],
  applications: [],
  applicationReviews: [],
  researchProgress: [],
  scholarPersonalDetails: [],
  courseCompletion: [],
  scholarFeeDemand: [],
  feePayments: [],
  feeStructure: [],
  applicationAttachments: [],
  applicationRequiredDocuments: [],
  applicationReviewerChecklist: [],
  racReviews: [],
});

const resolveDemoDataPath = () =>
  process.env.DEMO_DATA_FILE
    ? path.resolve(process.env.DEMO_DATA_FILE)
    : path.resolve("server", "data", "demo-data.json");

const nextId = <T extends Record<string, unknown>>(
  items: T[],
  idField: keyof T = "id" as keyof T,
): number => {
  const max = items.reduce((acc, item) => {
    const value = Number(item[idField] ?? 0);
    return Number.isNaN(value) ? acc : Math.max(acc, value);
  }, 0);
  return max + 1;
};

export class FileStorage implements IStorage {
  private data: DemoDataFile = emptyDemoData();
  private readonly filePath: string;
  private readonly ready: Promise<void>;

  constructor(filePath = resolveDemoDataPath()) {
    this.filePath = filePath;
    this.ready = this.load();
  }

  private async load() {
    try {
      const contents = await fs.readFile(this.filePath, "utf-8");
      this.data = JSON.parse(contents) as DemoDataFile;
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        throw err;
      }
      await this.persist();
    }
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  private async ensureReady() {
    await this.ready;
  }

  private nowIso() {
    return new Date().toISOString();
  }

  async getUser(id: number): Promise<User | undefined> {
    await this.ensureReady();
    return this.data.users.find((user) => user.id === id);
  }

  async getUserWithScholar(
    id: number,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    await this.ensureReady();
    const user = this.data.users.find((entry) => entry.id === id);
    if (!user) return undefined;
    const scholar = this.data.scholars.find((entry) => entry.userId === id);
    return { ...user, ...(scholar ?? {}) };
  }

  async getUserByScholarId(
    scholarId: string,
  ): Promise<(User & Partial<Scholar>) | undefined> {
    await this.ensureReady();
    const scholar = this.data.scholars.find(
      (entry) => entry.scholarId === scholarId,
    );
    if (!scholar) return undefined;
    const user = this.data.users.find((entry) => entry.id === scholar.userId);
    return user ? { ...scholar, ...user } : undefined;
  }

  async getUserByEmployeeId(
    employeeId: string,
  ): Promise<(User & Partial<Employee>) | undefined> {
    await this.ensureReady();
    const employee = this.data.employees.find(
      (entry) => entry.employeeId === employeeId,
    );
    if (!employee) return undefined;
    const user = this.data.users.find((entry) => entry.id === employee.userId);
    return user ? { ...employee, ...user } : undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    await this.ensureReady();
    return this.data.users.find((user) => user.name === name);
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureReady();
    return [...this.data.users];
  }

  async createUser(user: CreateUserInput): Promise<User> {
    await this.ensureReady();
    const id = (user as User).id ?? nextId(this.data.users);
    const existingById = this.data.users.find((entry) => entry.id === id);
    const existingByEmail = (user as User).email
      ? this.data.users.find((entry) => entry.email === (user as User).email)
      : undefined;
    const existing = existingById ?? existingByEmail;

    if (existing) {
      const updated = { ...existing, ...user, id, updatedAt: this.nowIso() };
      this.data.users = this.data.users.map((entry) =>
        entry.id === existing.id ? updated : entry,
      );
      await this.persist();
      return updated;
    }

    const newUser: User = {
      ...(user as User),
      id,
      password: user.password ?? "password123",
      createdAt: this.nowIso(),
      updatedAt: this.nowIso(),
    };
    this.data.users.push(newUser);
    await this.persist();
    return newUser;
  }

  async updateUser(id: number, updates: UpdateUserInput): Promise<User> {
    await this.ensureReady();
    const user = this.data.users.find((entry) => entry.id === id);
    if (!user) {
      throw new Error("User not found");
    }
    const updated: User = {
      ...user,
      ...updates,
      updatedAt: this.nowIso(),
    };
    this.data.users = this.data.users.map((entry) =>
      entry.id === id ? updated : entry,
    );
    await this.persist();
    return updated;
  }

  async getEmployee(employeeId: string): Promise<Employee | undefined> {
    await this.ensureReady();
    return this.data.employees.find((entry) => entry.employeeId === employeeId);
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    await this.ensureReady();
    return this.data.employees.find((entry) => entry.userId === userId);
  }

  async createEmployee(emp: CreateEmployeeInput): Promise<Employee> {
    await this.ensureReady();
    const existing = this.data.employees.find(
      (entry) => entry.userId === emp.userId,
    );
    if (existing) {
      const updated = { ...existing, ...emp };
      this.data.employees = this.data.employees.map((entry) =>
        entry.userId === emp.userId ? updated : entry,
      );
      await this.persist();
      return updated;
    }
    const newEmp: Employee = { ...emp };
    this.data.employees.push(newEmp);
    await this.persist();
    return newEmp;
  }

  async getApplications(scholarId?: number): Promise<Application[]> {
    await this.ensureReady();
    const apps = scholarId
      ? this.data.applications.filter((entry) => entry.userId === scholarId)
      : this.data.applications;
    return [...apps].sort((a, b) => {
      const aDate = a.submissionDate
        ? new Date(a.submissionDate as string).getTime()
        : 0;
      const bDate = b.submissionDate
        ? new Date(b.submissionDate as string).getTime()
        : 0;
      return bDate - aDate;
    });
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    await this.ensureReady();
    return this.data.applications.find((entry) => entry.id === id);
  }

  async getApplicationsByStage(stage: string): Promise<Application[]> {
    await this.ensureReady();
    return this.data.applications
      .filter(
        (entry) => entry.currentStage === stage && entry.status === "Pending",
      )
      .sort((a, b) => {
        const aDate = a.submissionDate
          ? new Date(a.submissionDate as string).getTime()
          : 0;
        const bDate = b.submissionDate
          ? new Date(b.submissionDate as string).getTime()
          : 0;
        return bDate - aDate;
      });
  }

  async getApplicationsForSupervisor(employeeId: string): Promise<Application[]> {
    await this.ensureReady();
    const supervisor = this.data.employees.find(
      (entry) => entry.employeeId === employeeId,
    );
    if (!supervisor) return [];
    const supervisedIds = new Set(
      this.data.scholarSupervisors
        .filter((entry) => entry.supervisorId === supervisor.userId)
        .map((entry) => entry.userId),
    );
    return this.data.applications
      .filter(
        (entry) =>
          supervisedIds.has(entry.userId as number) &&
          entry.currentStage === "supervisor" &&
          entry.status === "Pending",
      )
      .sort((a, b) => {
        const aDate = a.submissionDate
          ? new Date(a.submissionDate as string).getTime()
          : 0;
        const bDate = b.submissionDate
          ? new Date(b.submissionDate as string).getTime()
          : 0;
        return bDate - aDate;
      });
  }

  async createApplication(app: CreateApplicationInput): Promise<Application> {
    await this.ensureReady();
    const userId = app.userId ?? app.scholarId;
    if (!userId) {
      throw new Error("Application requires a userId");
    }
    const newApp: Application = {
      ...(app as Application),
      id: nextId(this.data.applications),
      userId,
    };
    this.data.applications.push(newApp);
    await this.persist();
    return newApp;
  }

  async updateApplication(
    id: number,
    updates: UpdateApplicationInput,
  ): Promise<Application> {
    await this.ensureReady();
    const app = this.data.applications.find((entry) => entry.id === id);
    if (!app) {
      throw new Error("Application not found");
    }
    const updated = { ...app, ...updates };
    this.data.applications = this.data.applications.map((entry) =>
      entry.id === id ? updated : entry,
    );
    await this.persist();
    return updated;
  }

  async getReviewsForApplication(
    applicationId: number,
  ): Promise<ApplicationReview[]> {
    await this.ensureReady();
    return this.data.applicationReviews
      .filter((entry) => entry.applicationId === applicationId)
      .sort((a, b) => {
        const aDate = a.reviewDate
          ? new Date(a.reviewDate as string).getTime()
          : 0;
        const bDate = b.reviewDate
          ? new Date(b.reviewDate as string).getTime()
          : 0;
        return aDate - bDate;
      });
  }

  async createReview(review: CreateReviewInput): Promise<ApplicationReview> {
    await this.ensureReady();
    const reviewerId =
      typeof review.reviewerId === "string"
        ? parseInt(review.reviewerId, 10)
        : review.reviewerId;
    const newReview: ApplicationReview = {
      ...(review as ApplicationReview),
      id: nextId(this.data.applicationReviews),
      reviewerId,
      reviewDate: this.nowIso(),
    };
    this.data.applicationReviews.push(newReview);
    await this.persist();
    return newReview;
  }

  async isSupervisorForScholar(
    employeeId: string,
    scholarId: string,
  ): Promise<boolean> {
    await this.ensureReady();
    const supervisorId = parseInt(employeeId, 10);
    const scholar = this.data.scholars.find(
      (entry) => entry.scholarId === scholarId,
    );
    if (!scholar) return false;
    return this.data.scholarSupervisors.some(
      (entry) =>
        entry.userId === scholar.userId && entry.supervisorId === supervisorId,
    );
  }

  async getScholarsBySupervisor(
    supervisorId: number | string,
  ): Promise<(Scholar & Partial<User>)[]> {
    await this.ensureReady();
    const numericId =
      typeof supervisorId === "string"
        ? parseInt(supervisorId, 10)
        : supervisorId;
    const scholarIds = new Set(
      this.data.scholarSupervisors
        .filter((entry) => entry.supervisorId === numericId)
        .map((entry) => entry.userId),
    );
    return this.data.scholars
      .filter((scholar) => scholarIds.has(scholar.userId))
      .map((scholar) => ({
        ...scholar,
        ...(this.data.users.find((user) => user.id === scholar.userId) ?? {}),
      }));
  }

  async createScholarProfile(
    profile: CreateScholarProfileInput,
  ): Promise<Scholar> {
    await this.ensureReady();
    const existing = this.data.scholars.find(
      (entry) => entry.userId === profile.userId,
    );
    if (existing) {
      const updated = { ...existing, ...profile };
      this.data.scholars = this.data.scholars.map((entry) =>
        entry.userId === profile.userId ? updated : entry,
      );
      await this.persist();
      return updated;
    }
    const newProfile: Scholar = { ...profile };
    this.data.scholars.push(newProfile);
    await this.persist();
    return newProfile;
  }

  async updateScholarPhase(userId: number, phase: string): Promise<Scholar> {
    await this.ensureReady();
    const scholar = this.data.scholars.find((entry) => entry.userId === userId);
    if (!scholar) {
      throw new Error("Scholar not found");
    }
    const updated = { ...scholar, phase, updatedAt: this.nowIso() };
    this.data.scholars = this.data.scholars.map((entry) =>
      entry.userId === userId ? updated : entry,
    );
    await this.persist();
    return updated;
  }

  async updateScholarSupervisorAssignment(
    userId: number,
    supervisorId: number,
  ): Promise<ScholarSupervisor> {
    await this.ensureReady();
    this.data.scholarSupervisors = this.data.scholarSupervisors.map((entry) =>
      entry.userId === userId ? { ...entry, isPrimary: false } : entry,
    );
    const assignment: ScholarSupervisor = {
      id: nextId(this.data.scholarSupervisors),
      userId,
      supervisorId,
      isPrimary: true,
      assignedOn: this.nowIso(),
    };
    this.data.scholarSupervisors.push(assignment);
    await this.persist();
    return assignment;
  }

  async getResearchProgress(
    scholarId: string,
  ): Promise<ResearchProgress | undefined> {
    await this.ensureReady();
    const numericId = parseInt(scholarId, 10);
    return this.data.researchProgress.find(
      (entry) => entry.userId === numericId,
    );
  }

  async createResearchProgress(
    stats: CreateResearchProgressInput,
  ): Promise<ResearchProgress> {
    await this.ensureReady();
    const userId = stats.userId ?? stats.scholarId;
    if (!userId) {
      throw new Error("Research progress requires a userId");
    }
    const existing = this.data.researchProgress.find(
      (entry) => entry.userId === userId,
    );
    const newStats: ResearchProgress = {
      ...(existing ?? {}),
      ...(stats as ResearchProgress),
      userId,
    };
    this.data.researchProgress = existing
      ? this.data.researchProgress.map((entry) =>
          entry.userId === userId ? newStats : entry,
        )
      : [...this.data.researchProgress, newStats];
    await this.persist();
    return newStats;
  }

  async getScholarById(id: number): Promise<Scholar | undefined> {
    await this.ensureReady();
    return this.data.scholars.find((entry) => entry.userId === id);
  }

  async getScholarByScholarId(scholarId: string): Promise<Scholar | undefined> {
    await this.ensureReady();
    return this.data.scholars.find((entry) => entry.scholarId === scholarId);
  }

  async getScholarPersonalDetails(
    scholarId: number,
  ): Promise<ScholarPersonalDetails | undefined> {
    await this.ensureReady();
    return this.data.scholarPersonalDetails.find(
      (entry) => entry.userId === scholarId,
    );
  }

  async createScholarPersonalDetails(
    details: CreateScholarPersonalDetailsInput,
  ): Promise<ScholarPersonalDetails> {
    await this.ensureReady();
    const existing = this.data.scholarPersonalDetails.find(
      (entry) => entry.userId === details.userId,
    );
    const newDetails: ScholarPersonalDetails = {
      ...(existing ?? {}),
      ...(details as ScholarPersonalDetails),
    };
    this.data.scholarPersonalDetails = existing
      ? this.data.scholarPersonalDetails.map((entry) =>
          entry.userId === details.userId ? newDetails : entry,
        )
      : [...this.data.scholarPersonalDetails, newDetails];
    await this.persist();
    return newDetails;
  }

  async createCourseCompletion(record: CreateCourseCompletionInput) {
    await this.ensureReady();
    const existingIndex = this.data.courseCompletion.findIndex(
      (entry) => entry.userId === record.userId,
    );
    if (existingIndex >= 0) {
      this.data.courseCompletion[existingIndex] = {
        ...this.data.courseCompletion[existingIndex],
        ...record,
      };
    } else {
      this.data.courseCompletion.push({ ...record });
    }
    await this.persist();
    return record;
  }

  async createScholarFeeDemand(record: CreateScholarFeeDemandInput) {
    await this.ensureReady();
    this.data.scholarFeeDemand.push({ ...record });
    await this.persist();
    return record;
  }

  async createFeePayment(record: CreateFeePaymentInput) {
    await this.ensureReady();
    this.data.feePayments.push({ ...record });
    await this.persist();
    return record;
  }

  async getFeeStructure(): Promise<FeeStructure[]> {
    await this.ensureReady();
    return this.data.feeStructure;
  }

  async createApplicationAttachment(
    attachment: CreateApplicationAttachmentInput,
  ): Promise<ApplicationAttachment> {
    await this.ensureReady();
    const newAttachment: ApplicationAttachment = {
      ...(attachment as ApplicationAttachment),
      id: nextId(this.data.applicationAttachments),
      uploadedOn: this.nowIso(),
    };
    this.data.applicationAttachments.push(newAttachment);
    await this.persist();
    return newAttachment;
  }

  async getApplicationAttachments(
    applicationId: number,
  ): Promise<ApplicationAttachment[]> {
    await this.ensureReady();
    return this.data.applicationAttachments
      .filter((entry) => entry.applicationId === applicationId)
      .sort((a, b) => {
        const aDate = a.uploadedOn
          ? new Date(a.uploadedOn as string).getTime()
          : 0;
        const bDate = b.uploadedOn
          ? new Date(b.uploadedOn as string).getTime()
          : 0;
        return aDate - bDate;
      });
  }

  async getApplicationAttachmentsByType(
    applicationId: number,
    documentType: string,
  ): Promise<ApplicationAttachment[]> {
    await this.ensureReady();
    return this.data.applicationAttachments.filter(
      (entry) =>
        entry.applicationId === applicationId &&
        entry.documentType === documentType,
    );
  }

  async updateApplicationAttachmentVerification(
    attachmentId: number,
    verifiedBy: number,
    isVerified: boolean,
    verificationNotes?: string,
  ): Promise<ApplicationAttachment[]> {
    await this.ensureReady();
    let updated: ApplicationAttachment | undefined;
    this.data.applicationAttachments = this.data.applicationAttachments.map(
      (entry) => {
        if (entry.id !== attachmentId) return entry;
        updated = {
          ...entry,
          isVerified,
          verifiedBy,
          verificationNotes,
          verifiedOn: this.nowIso(),
        };
        return updated;
      },
    );
    if (!updated) return [];
    await this.persist();
    return [updated];
  }

  async deleteApplicationAttachment(attachmentId: number, uploadedBy: number) {
    await this.ensureReady();
    const existing = this.data.applicationAttachments.find(
      (entry) => entry.id === attachmentId && entry.uploadedBy === uploadedBy,
    );
    if (!existing) return [];
    this.data.applicationAttachments = this.data.applicationAttachments.filter(
      (entry) => entry.id !== attachmentId,
    );
    await this.persist();
    return [existing];
  }

  async getApplicationRequiredDocuments(
    applicationType: string,
  ): Promise<RequiredDocument[]> {
    await this.ensureReady();
    return this.data.applicationRequiredDocuments
      .filter((entry) => entry.applicationType === applicationType)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async createApplicationRequiredDocument(
    applicationType: string,
    documentType: string,
    displayName: string,
    isMandatory = true,
    description?: string,
  ): Promise<RequiredDocument> {
    await this.ensureReady();
    const newDoc: RequiredDocument = {
      id: nextId(this.data.applicationRequiredDocuments),
      applicationType,
      documentType,
      displayName,
      description: description ?? null,
      isMandatory,
      sortOrder: this.data.applicationRequiredDocuments.length + 1,
    };
    this.data.applicationRequiredDocuments.push(newDoc);
    await this.persist();
    return newDoc;
  }

  async updateApplicationReviewerChecklist(
    applicationId: number,
    reviewerId: number,
    reviewStage: string,
    updates: UpdateApplicationReviewerChecklistInput,
  ) {
    await this.ensureReady();
    const existingIndex = this.data.applicationReviewerChecklist.findIndex(
      (entry) =>
        entry.applicationId === applicationId &&
        entry.reviewerId === reviewerId &&
        entry.reviewStage === reviewStage,
    );
    if (existingIndex >= 0) {
      this.data.applicationReviewerChecklist[existingIndex] = {
        ...this.data.applicationReviewerChecklist[existingIndex],
        ...updates,
      };
      await this.persist();
      return [this.data.applicationReviewerChecklist[existingIndex]];
    }
    const newChecklist = {
      applicationId,
      reviewerId,
      reviewStage,
      ...updates,
    };
    this.data.applicationReviewerChecklist.push(newChecklist);
    await this.persist();
    return [newChecklist];
  }

  async countRacMeetings(scholarId: number): Promise<number> {
    await this.ensureReady();
    return this.data.racReviews.filter((entry) => entry.userId === scholarId)
      .length;
  }

  async checkIfPreTalkDone(_scholarId: number): Promise<boolean> {
    return false;
  }

  async checkCourseCompletion(scholarId: number): Promise<boolean> {
    await this.ensureReady();
    const record = this.data.courseCompletion.find(
      (entry) => entry.userId === scholarId,
    );
    return Boolean(record?.completed);
  }

  async calculateFeeArrears(numericScholarId: number): Promise<number> {
    await this.ensureReady();
    const demands = this.data.scholarFeeDemand.filter(
      (entry) => entry.userId === numericScholarId,
    );
    const totalDemand = demands.reduce(
      (sum, entry) =>
        sum + Number(entry.arrearsAmount || 0) + Number(entry.annualFee || 0),
      0,
    );
    const payments = this.data.feePayments.filter(
      (entry) =>
        entry.userId === numericScholarId &&
        entry.paymentStatus === "COMPLETED",
    );
    const totalPaid = payments.reduce(
      (sum, entry) => sum + Number(entry.amountPaid || 0),
      0,
    );
    const arrears = totalDemand - totalPaid;
    return arrears > 0 ? arrears : 0;
  }

  async countApprovedExtensions(scholarId: number | string): Promise<number> {
    await this.ensureReady();
    const numericId =
      typeof scholarId === "string" ? parseInt(scholarId, 10) : scholarId;
    return this.data.applications.filter(
      (entry) =>
        entry.userId === numericId &&
        entry.type === "Extension" &&
        entry.finalOutcome === "Approved",
    ).length;
  }
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

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user;
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

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.userId, userId));
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
    const [newApp] = await db.insert(applications).values({
      ...app,
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
    const [newReview] = await db.insert(applicationReviews).values({
      ...review,
    }).returning();
    return newReview;
  }

  async isSupervisorForScholar(supervisorUserId: number, scholarId: string): Promise<boolean> {
    const [supervisorRecord] = await db
      .select()
      .from(scholarSupervisors)
      .innerJoin(scholars, eq(scholars.userId, scholarSupervisors.userId))
      .where(and(
        eq(scholars.scholarId, scholarId),
        eq(scholarSupervisors.supervisorId, supervisorUserId)
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

  async updateScholarPhase(userId: number, phase: string): Promise<Scholar> {
    const [updated] = await db
      .update(scholars)
      .set({ phase, updatedAt: new Date() })
      .where(eq(scholars.userId, userId))
      .returning();
    return updated;
  }

  async updateScholarSupervisorAssignment(
    userId: number,
    supervisorId: number,
  ): Promise<ScholarSupervisor> {
    await db
      .update(scholarSupervisors)
      .set({ isPrimary: false })
      .where(eq(scholarSupervisors.userId, userId));

    const [assignment] = await db
      .insert(scholarSupervisors)
      .values({ userId, supervisorId, isPrimary: true })
      .returning();
    return assignment;
  }

  async getResearchProgress(userId: number): Promise<ResearchProgress | undefined> {
    const [stats] = await db.select().from(researchProgress).where(eq(researchProgress.userId, userId));
    return stats;
  }

  async createResearchProgress(stats: CreateResearchProgressInput): Promise<ResearchProgress> {
    const [newStats] = await db.insert(researchProgress).values({
      ...stats,
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

  async getFeeStructure(): Promise<FeeStructure[]> {
    return db.select().from(feeStructure).orderBy(desc(feeStructure.academicYear));
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

  async countApprovedExtensions(scholarId: number | string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, scholarId),
          eq(applications.type, "Extension"),
          eq(applications.finalOutcome, "Approved"),
        ),
      );
    return result[0]?.count || 0;
  }
}

const useFileStorage = process.env.DEMO_FILE_STORAGE === "true";
export const storage = useFileStorage
  ? new FileStorage()
  : new DatabaseStorage();

// Helper function to verify password
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!hashedPassword?.startsWith("$2")) {
    return plainPassword === hashedPassword;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
}
