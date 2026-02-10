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
} from "../domain/types";
import type { IStorage } from "./types";

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
