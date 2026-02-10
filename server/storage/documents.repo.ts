import type {
  ApplicationAttachment,
  CreateApplicationAttachmentInput,
  FeeStructure,
  RequiredDocument,
  UpdateApplicationReviewerChecklistInput,
} from "../domain/types";

export interface DocumentsRepository {
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
