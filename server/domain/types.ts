export interface User {
  id: number;
  password: string;
  role?: string;
  [key: string]: unknown;
}

export interface Scholar {
  id?: number;
  userId: number;
  scholarId?: string;
  joiningDate?: string | Date | null;
  [key: string]: unknown;
}

export interface Employee {
  userId: number;
  employeeId: string;
  [key: string]: unknown;
}

export interface Application {
  id: number;
  userId: number | string;
  scholarId?: number;
  type: string;
  status: string;
  currentStage: string;
  details?: unknown;
  finalOutcome?: string | null;
  [key: string]: unknown;
}

export interface ApplicationReview {
  id: number;
  applicationId: number;
  reviewerId: number;
  stage: string;
  decision: string;
  remarks: string;
  reviewDate?: string | Date | null;
  [key: string]: unknown;
}

export interface ResearchProgress {
  userId: number;
  completedReviews: number;
  pendingReports: number;
  publications: number;
  [key: string]: unknown;
}

export interface ApplicationAttachment {
  id: number;
  applicationId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: number;
  uploadedOn?: string | Date | null;
  isVerified?: boolean;
  verifiedBy?: number | null;
  verificationNotes?: string | null;
  [key: string]: unknown;
}

export interface RequiredDocument {
  id: number;
  applicationType: string;
  documentType: string;
  displayName: string;
  description?: string | null;
  isMandatory: boolean;
  sortOrder?: number | null;
  [key: string]: unknown;
}

export interface ScholarPersonalDetails {
  userId: number;
  gender?: string | null;
  isPwd?: boolean | null;
  [key: string]: unknown;
}

export interface ReviewerChecklist {
  [key: string]: unknown;
}

export interface CreateUserInput {
  password?: string;
  role?: string;
  [key: string]: unknown;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface CreateEmployeeInput {
  userId: number;
  employeeId: string;
  [key: string]: unknown;
}

export interface CreateApplicationInput {
  userId?: number;
  scholarId?: number;
  type: string;
  status: string;
  currentStage: string;
  details?: Record<string, unknown>;
  finalOutcome?: string | null;
  [key: string]: unknown;
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export interface CreateReviewInput {
  applicationId: number;
  reviewerId: number | string;
  stage: string;
  decision: string;
  remarks: string;
  [key: string]: unknown;
}

export interface CreateApplicationAttachmentInput {
  applicationId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
  [key: string]: unknown;
}

export interface CreateResearchProgressInput {
  userId?: number;
  scholarId?: number;
  completedReviews: number;
  pendingReports: number;
  publications: number;
  [key: string]: unknown;
}

export interface CreateScholarProfileInput {
  userId: number;
  scholarId?: string;
  joiningDate?: string | Date | null;
  [key: string]: unknown;
}

export interface CreateScholarPersonalDetailsInput {
  userId: number;
  gender?: string | null;
  isPwd?: boolean | null;
  [key: string]: unknown;
}

export interface CreateCourseCompletionInput {
  userId: number;
  completed?: boolean;
  [key: string]: unknown;
}

export interface CreateScholarFeeDemandInput {
  userId: number;
  academicYear: string;
  arrearsAmount?: number;
  annualFee?: number;
  [key: string]: unknown;
}

export interface CreateFeePaymentInput {
  userId: number;
  amountPaid: number;
  paymentStatus?: string;
  [key: string]: unknown;
}

export interface CreateApplicationRequiredDocumentInput {
  applicationType: string;
  documentType: string;
  displayName: string;
  isMandatory?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface UpdateApplicationReviewerChecklistInput {
  documentsVerified?: boolean;
  documentsReview?: Record<string, boolean>;
  [key: string]: unknown;
}
