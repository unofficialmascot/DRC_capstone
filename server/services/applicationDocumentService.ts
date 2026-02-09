import type { IStorage } from "../storage";
import { AppError } from "../errors";
import type { DocumentStorageProvider } from "./documentStorageProvider";

export interface DocumentUploadInput {
  applicationId: number;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
  objectKey?: string;
}

export interface DocumentVerificationInput {
  attachmentId: number;
  verifiedBy: number;
  isVerified: boolean;
  verificationNotes?: string;
}

export class ApplicationDocumentService {
  constructor(
    private readonly storage: IStorage,
    private readonly documentStorageProvider?: DocumentStorageProvider,
  ) {}

  /**
   * Upload a document for an application
   */
  async uploadDocument(input: DocumentUploadInput) {
    const resolvedUrl =
      input.fileUrl ??
      (input.objectKey
        ? this.documentStorageProvider?.resolveDownloadUrl(input.objectKey)
        : undefined);
    if (!resolvedUrl) {
      throw new AppError("File URL is required", 400);
    }
    const attachment = await this.storage.createApplicationAttachment({
      applicationId: input.applicationId,
      documentType: input.documentType,
      fileName: input.fileName,
      fileUrl: resolvedUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      uploadedBy: input.uploadedBy,
    });

    return attachment;
  }

  /**
   * Get all documents for an application
   */
  async getApplicationDocuments(applicationId: number) {
    return this.storage.getApplicationAttachments(applicationId);
  }

  /**
   * Get documents by type for an application
   */
  async getDocumentsByType(applicationId: number, documentType: string) {
    return this.storage.getApplicationAttachmentsByType(applicationId, documentType);
  }

  /**
   * Verify a document (for reviewers)
   */
  async verifyDocument(input: DocumentVerificationInput) {
    const result = await this.storage.updateApplicationAttachmentVerification(
      input.attachmentId,
      input.verifiedBy,
      input.isVerified,
      input.verificationNotes,
    );
    
    if (result.length === 0) {
      throw new AppError("Document not found", 404);
    }
    
    return result[0];
  }

  /**
   * Get checklist of required documents and their submission status
   */
  async getDocumentChecklistStatus(applicationId: number, applicationType: string) {
    // Get all required documents for this application type
    const requiredDocs = await this.storage.getApplicationRequiredDocuments(applicationType);

    // Get all uploaded documents for this application
    const uploadedDocs = await this.storage.getApplicationAttachments(applicationId);

    // Build checklist with status
    const checklist = requiredDocs.map((requiredDoc) => {
      const uploaded = uploadedDocs.filter((doc) => doc.documentType === requiredDoc.documentType);

      return {
        documentType: requiredDoc.documentType,
        displayName: requiredDoc.displayName,
        description: requiredDoc.description,
        isMandatory: requiredDoc.isMandatory,
        status: uploaded.length > 0 ? "uploaded" : "pending",
        uploadedCount: uploaded.length,
        documents: uploaded,
        allVerified: uploaded.length > 0 && uploaded.every((doc) => doc.isVerified),
      };
    });

    return checklist;
  }

  /**
   * Check if all mandatory documents are uploaded for an application
   */
  async checkMandatoryDocumentsUploaded(
    applicationId: number,
    applicationType: string,
  ): Promise<{ allUploaded: boolean; missing: string[] }> {
    const checklist = await this.getDocumentChecklistStatus(applicationId, applicationType);

    const missing = checklist
      .filter((item) => item.isMandatory && item.status === "pending")
      .map((item) => item.displayName);

    return {
      allUploaded: missing.length === 0,
      missing,
    };
  }

  /**
   * Mark documents as verified by a reviewer
   */
  async markDocumentsReviewedByReviewer(
    applicationId: number,
    reviewerId: number,
    reviewStage: string,
    documentsReview: Record<string, boolean>,
  ) {
    return this.storage.updateApplicationReviewerChecklist(applicationId, reviewerId, reviewStage, {
      documentsVerified: true,
      documentsReview,
    });
  }

  /**
   * Get all documents grouped for reviewer
   */
  async getDocumentsForReview(applicationId: number) {
    const documents = await this.storage.getApplicationAttachments(applicationId);

    // Group by document type
    const grouped: Record<string, any[]> = {};
    documents.forEach((doc) => {
      if (!grouped[doc.documentType]) {
        grouped[doc.documentType] = [];
      }
      grouped[doc.documentType].push({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        uploadedBy: doc.uploadedBy,
        uploadedOn: doc.uploadedOn,
        isVerified: doc.isVerified,
        verifiedBy: doc.verifiedBy,
        verificationNotes: doc.verificationNotes,
      });
    });

    return grouped;
  }

  /**
   * Delete a document (before application submission)
   */
  async deleteDocument(attachmentId: number, uploadedBy: number) {
    return this.storage.deleteApplicationAttachment(attachmentId, uploadedBy);
  }

  async assertDocumentAccess(
    applicationId: number,
    userId: number,
    options?: {
      requireUploader?: boolean;
      requireReviewer?: boolean;
      requireStageMatch?: boolean;
    },
  ) {
    const application = await this.storage.getApplicationById(applicationId);
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isUploader = application.userId === userId;
    const isReviewer = await this.isReviewerForApplication(
      userId,
      user.role ?? "",
      application.userId,
    );

    if (options?.requireUploader && !isUploader) {
      throw new AppError("Not authorized to upload documents for this application", 403);
    }

    if (options?.requireReviewer && !isReviewer) {
      throw new AppError("Not authorized to review documents for this application", 403);
    }

    if (!options?.requireUploader && !options?.requireReviewer && !isUploader && !isReviewer) {
      throw new AppError("Not authorized to access documents for this application", 403);
    }

    if (options?.requireStageMatch && isReviewer) {
      const role = user.role ?? "";
      if (application.currentStage !== role) {
        throw new AppError("Not authorized for this review stage", 403);
      }
    }

    return { application, user, isReviewer, isUploader };
  }

  private async isReviewerForApplication(
    reviewerId: number,
    role: string,
    scholarUserId: number,
  ) {
    if (role === "supervisor") {
      return this.storage.isSupervisorForScholar(reviewerId, String(scholarUserId));
    }

    return ["drc", "irc", "doaa"].includes(role);
  }
}
