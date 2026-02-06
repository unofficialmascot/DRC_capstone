import { storage } from "../storage";
import type { InsertApplicationAttachment } from "@shared/schema";

export interface DocumentUploadInput {
  applicationId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
}

export interface DocumentVerificationInput {
  attachmentId: number;
  verifiedBy: number;
  isVerified: boolean;
  verificationNotes?: string;
}

export class ApplicationDocumentService {
  /**
   * Upload a document for an application
   */
  async uploadDocument(input: DocumentUploadInput) {
    const attachment = await storage.createApplicationAttachment({
      applicationId: input.applicationId,
      documentType: input.documentType,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
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
    return storage.getApplicationAttachments(applicationId);
  }

  /**
   * Get documents by type for an application
   */
  async getDocumentsByType(applicationId: number, documentType: string) {
    return storage.getApplicationAttachmentsByType(applicationId, documentType);
  }

  /**
   * Verify a document (for reviewers)
   */
  async verifyDocument(input: DocumentVerificationInput) {
    const result = await storage.updateApplicationAttachmentVerification(
      input.attachmentId,
      input.verifiedBy,
      input.isVerified,
      input.verificationNotes,
    );
    
    if (result.length === 0) {
      throw new Error("Document not found");
    }
    
    return result[0];
  }

  /**
   * Get checklist of required documents and their submission status
   */
  async getDocumentChecklistStatus(applicationId: number, applicationType: string) {
    // Get all required documents for this application type
    const requiredDocs = await storage.getApplicationRequiredDocuments(applicationType);

    // Get all uploaded documents for this application
    const uploadedDocs = await storage.getApplicationAttachments(applicationId);

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
    return storage.updateApplicationReviewerChecklist(applicationId, reviewerId, reviewStage, {
      documentsVerified: true,
      documentsReview,
    });
  }

  /**
   * Get all documents grouped for reviewer
   */
  async getDocumentsForReview(applicationId: number) {
    const documents = await storage.getApplicationAttachments(applicationId);

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
    return storage.deleteApplicationAttachment(attachmentId, uploadedBy);
  }
}

export const applicationDocumentService = new ApplicationDocumentService();
