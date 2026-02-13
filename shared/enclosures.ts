export interface DocHubDocumentType {
  value: string;
  label: string;
  description: string;
}

export const DOC_HUB_DOCUMENT_TYPES = {
  personal: [
    {
      value: "aadhaar",
      label: "Aadhaar Card",
      description: "Government issued identification document with unique 12-digit number",
    },
    {
      value: "pan",
      label: "PAN Card",
      description: "Permanent Account Number card for financial transactions",
    },
    {
      value: "passport",
      label: "Passport Photos",
      description: "Recent passport-sized photographs for official documents",
    },
  ],
  academic: [
    {
      value: "grade_cards",
      label: "Grade Cards",
      description: "All semester grade cards and mark sheets from previous qualifications",
    },
    {
      value: "degree_certificates",
      label: "Degree Certificates",
      description: "Bachelor's and Master's degree certificates and provisional certificates",
    },
    {
      value: "transfer_certificate",
      label: "Transfer Certificate",
      description: "TC from previous institution with conduct and character details",
    },
  ],
  research: [
    {
      value: "admission_letter",
      label: "Admission Letter",
      description: "Copy of admission letter",
    },
    {
      value: "coursework_marks_memo",
      label: "Course Work Marks Memo",
      description: "Marks memo of course work",
    },
    {
      value: "permission_letter_extension",
      label: "Permission Letter - Prior Extension",
      description: "Permission letter for previous extension (if applicable)",
    },
    {
      value: "permission_letter_title_change",
      label: "Permission Letter - Title/Topic Change",
      description: "Permission letter for title/topic change (if applicable)",
    },
    {
      value: "permission_letter_supervisor_change",
      label: "Permission Letter - Supervisor Change",
      description: "Permission letter for supervisor/co-supervisor change (if applicable)",
    },
    {
      value: "fee_receipts_bundle",
      label: "Fee Receipts",
      description: "All fee receipts from date of joining onwards",
    },
    {
      value: "progress_report",
      label: "Progress Report",
      description: "Progress report signed by supervisor/co-supervisor",
    },
    {
      value: "journal_publication_proofs",
      label: "Journal Publication Proofs",
      description: "List/proofs of publications in journals",
    },
    {
      value: "conference_publication_proofs",
      label: "Conference Publication Proofs",
      description: "Conference/seminar publications with certificates and abstracts",
    },
  ],
} as const;

export interface EnclosureRequirementDefinition {
  code: string;
  label: string;
  required: boolean;
  documentTypes: string[];
}

export const APPLICATION_ENCLOSURE_REQUIREMENTS: Record<string, EnclosureRequirementDefinition[]> = {
  Extension: [
    {
      code: "admission_letter",
      label: "Copy of Admission letter",
      required: true,
      documentTypes: ["admission_letter"],
    },
    {
      code: "coursework_marks_memo",
      label: "Marks Memo of Course Work",
      required: true,
      documentTypes: ["coursework_marks_memo"],
    },
    {
      code: "permission_letters",
      label: "Permission letters (if applicable)",
      required: false,
      documentTypes: [
        "permission_letter_extension",
        "permission_letter_title_change",
        "permission_letter_supervisor_change",
      ],
    },
    {
      code: "fee_receipts_bundle",
      label: "All fee receipts from date of joining onwards",
      required: true,
      documentTypes: ["fee_receipts_bundle"],
    },
    {
      code: "progress_report",
      label: "Progress report",
      required: true,
      documentTypes: ["progress_report"],
    },
    {
      code: "journal_publication_proofs",
      label: "Publications in Journals",
      required: true,
      documentTypes: ["journal_publication_proofs"],
    },
    {
      code: "conference_publication_proofs",
      label: "Publications in Conferences/Seminars",
      required: true,
      documentTypes: ["conference_publication_proofs"],
    },
  ],
};