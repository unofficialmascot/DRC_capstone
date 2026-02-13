import { APPLICATION_ENCLOSURE_REQUIREMENTS } from "../../shared/enclosures.js";
import type { Document } from "@shared/schema";

export interface ApplicationEnclosureMatchedDocument {
  id: number;
  fileName: string;
  documentType: string;
  category: string;
  uploadedAt: Date | string | null;
  isVerified: boolean | null;
  source: "dochub";
}

export interface ApplicationEnclosureItem {
  code: string;
  label: string;
  required: boolean;
  status: "attached" | "missing";
  matchedDocuments: ApplicationEnclosureMatchedDocument[];
}

export interface ApplicationEnclosureSnapshot {
  source: "dochub";
  generatedAt: string;
  requirements: ApplicationEnclosureItem[];
  summary: {
    requiredTotal: number;
    requiredAttached: number;
    requiredMissing: number;
  };
}

export function buildApplicationEnclosureSnapshot(
  applicationType: string,
  documents: Document[],
): ApplicationEnclosureSnapshot | null {
  const requirements = APPLICATION_ENCLOSURE_REQUIREMENTS[applicationType] ?? [];
  if (requirements.length === 0) {
    return null;
  }

  const requirementItems = requirements.map((requirement) => {
    const matchedDocuments = documents
      .filter((document) => requirement.documentTypes.includes(document.documentType))
      .map((document) => ({
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        category: document.category,
        uploadedAt: document.uploadedAt,
        isVerified: document.isVerified,
        source: "dochub" as const,
      }));

    return {
      code: requirement.code,
      label: requirement.label,
      required: requirement.required,
      status: matchedDocuments.length > 0 ? "attached" as const : "missing" as const,
      matchedDocuments,
    };
  });

  const requiredItems = requirementItems.filter((item) => item.required);
  const requiredAttached = requiredItems.filter((item) => item.status === "attached").length;

  return {
    source: "dochub",
    generatedAt: new Date().toISOString(),
    requirements: requirementItems,
    summary: {
      requiredTotal: requiredItems.length,
      requiredAttached,
      requiredMissing: requiredItems.length - requiredAttached,
    },
  };
}