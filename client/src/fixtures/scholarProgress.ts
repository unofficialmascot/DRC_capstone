import type {
  AuditLogEntry,
  DocumentRecord,
  ProgressionSummaryEntry,
  ReviewCycle,
} from "@/types/gscholar";

export const progressionSummaryFixture: ProgressionSummaryEntry[] = [
  {
    number: "PR-01",
    title: "Progression Review - 1",
    conductedOn: "2023-12-15",
    rac1: { id: "RAC-118", name: "Dr. Nandita B. Chaudhuri" },
    rac2: { id: "RAC-203", name: "Dr. S. Rama Krishna" },
    documentLabel: "View Progression File",
    supervisorUploadedOn: "2023-12-02 10:30",
    drcApprovalOn: "2023-12-18 15:10",
    finalResult: "Satisfactory",
  },
];

export const reviewCyclesFixture: ReviewCycle[] = [
  {
    reviewMonthYear: "December 2023",
    reviewType: "6-monthly",
    scholarStatus: "Submitted",
    scholarSubmittedOn: "2023-12-01 09:15",
    scholarAbsent: "No",
    supervisorStatus: "Reviewed",
    supervisorSubmittedOn: "2023-12-03 11:40",
    rac1Status: "Reviewed",
    rac1SubmittedOn: "2023-12-05 14:05",
    rac2Status: "Pending",
    rac2SubmittedOn: "--",
    drcStatus: "Pending",
    drcReviewedOn: "--",
    outcome: "Pending",
  },
];

export const documentRecordsFixture: DocumentRecord[] = [
  {
    type: "Progression Report",
    file: "progression-report-pr01.pdf",
    uploadedBy: "Supervisor",
    uploadedOn: "2023-12-02 10:30",
    version: "v2",
    locked: "Yes",
    visibility: "Scholar / RAC / DRC",
  },
  {
    type: "Coursework Certificate",
    file: "prephd-certificate.pdf",
    uploadedBy: "Scholar",
    uploadedOn: "2023-07-29 15:05",
    version: "v1",
    locked: "Yes",
    visibility: "Scholar / DRC",
  },
];

export const auditTimelineFixture: AuditLogEntry[] = [
  {
    reviewCycleId: "RC-2023-12",
    reviewerRole: "Scholar",
    actionTimestamp: "2023-12-01 09:15",
    actionPerformed: "Submit",
    remarks: "Uploaded report and self-evaluation",
    auditRef: "AUD-9912",
  },
  {
    reviewCycleId: "RC-2023-12",
    reviewerRole: "Supervisor",
    actionTimestamp: "2023-12-03 11:40",
    actionPerformed: "Review",
    remarks: "Recommended for RAC review",
    auditRef: "AUD-9945",
  },
];
