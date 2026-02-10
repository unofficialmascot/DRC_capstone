import type {
  Application,
  ApplicationReview,
  CreateApplicationInput,
  CreateReviewInput,
  UpdateApplicationInput,
} from "../domain/types";

export interface ApplicationsRepository {
  // Applications
  getApplications(scholarId?: number): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByStage(stage: string): Promise<Application[]>;
  getApplicationsForSupervisor(employeeId: string): Promise<Application[]>;
  createApplication(app: CreateApplicationInput): Promise<Application>;
  updateApplication(id: number, updates: UpdateApplicationInput): Promise<Application>;

  // Reviews
  getReviewsForApplication(applicationId: number): Promise<ApplicationReview[]>;
  createReview(review: CreateReviewInput): Promise<ApplicationReview>;
  isSupervisorForScholar(supervisorUserId: number, scholarId: string): Promise<boolean>;
}
