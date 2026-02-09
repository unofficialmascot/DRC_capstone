import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS / BASE ===
// Core user table - minimal fields, passwords MUST be hashed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(), // HASHED password using bcryptjs
  role: text("role").notNull(), // 'scholar', 'supervisor', 'drc', 'irc', 'doaa', 'admin'
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === EMPLOYEES ===
// Employee-specific data (supervisors, DRC, IRC, DoAA members)
export const employees = pgTable("employees", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").unique(),
  designation: text("designation"), // Professor, Associate Professor, etc.
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLARS (NORMALIZED) ===
// Scholar core profile - denormalized fields removed (see scholar_personal_details, scholar_education_background)
export const scholars = pgTable("scholars", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  scholarId: text("scholar_id").unique(),
  batch: text("batch"),
  status: text("status").default("Active"), // Active, Inactive, Graduated
  department: text("department"),
  researchArea: text("research_area"),
  researchTitle: text("research_title"),
  joiningDate: text("joining_date"),
  phase: text("phase"), // Phase-I, Phase-II, Phase-III
  programme: text("programme"), // Full Time, Part Time
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLAR PERSONAL DETAILS ===
// Scholar personal/demographic information
export const scholarPersonalDetails = pgTable("scholar_personal_details", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: date("date_of_birth"),
  nationality: text("nationality"),
  fatherName: text("father_name"),
  aadhaarNumber: text("aadhaar_number"),
  studentMobile: text("student_mobile"),
  parentMobile: text("parent_mobile"),
  studentEmail: text("student_email"),
  gender: text("gender"),
  isPwd: boolean("is_pwd").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLAR ADDRESS ===
// Scholar residential address
export const scholarAddress = pgTable("scholar_address", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  addressText: text("address_text"),
  state: text("state"),
  pincode: text("pincode"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLAR EDUCATION BACKGROUND (NEW - NORMALIZED) ===
// Scholar's 10th grade, 12th grade, UG, PG education records
export const scholarEducationBackground = pgTable("scholar_education_background", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  educationLevel: text("education_level").notNull(), // '10th', '12th', 'UG', 'PG'
  instituteName: text("institute_name"),
  boardOrUniversity: text("board_or_university").notNull(),
  percentageOrCgpa: numeric("percentage_or_cgpa", { precision: 5, scale: 2 }),
  yearOfCompletion: integer("year_of_completion"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEducationLevel: unique().on(table.userId, table.educationLevel),
}));

// === SCHOLAR SUPERVISORS ===
// PhD supervision assignments
export const scholarSupervisors = pgTable("scholar_supervisors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supervisorId: integer("supervisor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(true),
  assignedOn: timestamp("assigned_on").defaultNow(),
});

// === RESEARCHER ADVISORY COMMITTEE ===
// RAC member assignments (consolidated - removed redundant rac_members table)
export const scholarRacMembers = pgTable("scholar_rac_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  racMemberId: integer("rac_member_id").notNull(),
  role: text("role").notNull(), // 'drc', 'irc', 'doaa', 'guide'
  assignedOn: timestamp("assigned_on").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RAC REVIEWS ===
// Tracks RAC meeting reviews/evaluations for scholars
export const racReviews = pgTable("rac_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewNumber: integer("review_number").notNull(), // 1st RAC review, 2nd RAC review, etc.
  reviewDate: date("review_date").notNull(),
  remarks: text("remarks"),
  evaluationResult: text("evaluation_result"), // 'pass', 'fail', 'conditional'
  documentUrl: text("document_url"), // Link to review report/minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === ACADEMIC RECORDS ===
// Degree/qualification history
export const academicRecords = pgTable("academic_records", {
  recordId: serial("record_id").primaryKey(),
  userId: integer("user_id").notNull(),
  level: text("level").notNull(),
  instituteName: text("institute_name").notNull(),
  boardOrUniversity: text("board_or_university").notNull(),
  yearOfPassing: integer("year_of_passing").notNull(),
  percentageOrCgpa: numeric("percentage_or_cgpa", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RESEARCH PROGRESS ===
// Scholar research metrics
export const researchProgress = pgTable("research_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  completedReviews: integer("completed_reviews").default(0),
  pendingReports: integer("pending_reports").default(0),
  publications: integer("publications").default(0),
  lastReviewDate: timestamp("last_review_date"),
});

// === RESEARCH PROGRESSIONS ===
// Research progression reports
export const researchProgressions = pgTable("research_progressions", {
  progressionId: serial("progression_id").primaryKey(),
  userId: integer("user_id").notNull(),
  progressionNo: integer("progression_no").notNull(),
  title: text("title").notNull(),
  conductedOn: date("conducted_on").notNull(),
  documentUrl: text("document_url"),
  supervisorUploadedOn: timestamp("supervisor_uploaded_on"),
  drcApprovedOn: timestamp("drc_approved_on"),
  finalResult: text("final_result"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === PRE-PHD EXAMS ===
// Pre-PhD qualifying exams
export const prePhDExams = pgTable("pre_phd_exams", {
  examId: serial("exam_id").primaryKey(),
  userId: integer("user_id").notNull(),
  examType: text("exam_type").default("REGULAR"),
  conductedMonth: integer("conducted_month"),
  conductedYear: integer("conducted_year"),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PRE-PHD SUBJECT RESULTS ===
// Subject grades in exams
export const prePhDSubjectResults = pgTable("pre_phd_subject_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => prePhDExams.examId),
  subjectName: text("subject_name").notNull(),
  subjectCode: text("subject_code").notNull(),
  semester: text("semester"),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHOLAR REVIEWS (NEW - CONSOLIDATED) ===
// Consolidated scholar review tracking (replaces fragmented review_cycles, review_status, review_outcome)
export const scholarReviews = pgTable("scholar_reviews", {
  reviewId: serial("review_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewMonth: integer("review_month").notNull(),
  reviewYear: integer("review_year").notNull(),
  reviewType: text("review_type").notNull().default("PERIODIC"), // 'PERIODIC', 'SPECIAL', 'ANNUAL'
  currentStage: text("current_stage").notNull().default("NOT_STARTED"),
  currentStatus: text("current_status").notNull().default("IN_PROGRESS"), // 'IN_PROGRESS', 'COMPLETED', 'REJECTED'
  finalResult: text("final_result"), // 'PASS', 'FAIL', 'CONDITIONAL'
  submittedDate: timestamp("submitted_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueReview: unique().on(table.userId, table.reviewMonth, table.reviewYear),
}));

// === APPLICATIONS ===
// Application submissions (extensions, supervisor changes, etc.)
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'Extension', 'Re-Registration', 'Supervisor Change', etc.
  status: text("status").notNull().default("Pending"), // 'Pending', 'Approved', 'Rejected'
  currentStage: text("current_stage").notNull().default("supervisor"), // 'supervisor', 'drc', 'irc', 'doaa', 'completed'
  submissionDate: timestamp("submission_date").defaultNow(),
  details: jsonb("details"), // Extra form fields
  finalOutcome: text("final_outcome"), // 'Approved', 'Rejected', null
});

// === APPLICATION REVIEWS ===
// Review history per application stage
export const applicationReviews = pgTable("application_reviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  stage: text("stage").notNull(), // 'supervisor', 'drc', 'irc', 'doaa'
  decision: text("decision").notNull(), // 'approved', 'rejected'
  remarks: text("remarks").notNull(),
  reviewDate: timestamp("review_date").defaultNow(),
});

// === APPLICATION DOCUMENTS ===
// Supporting files for applications
export const applicationDocuments = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FEE STRUCTURE ===
// Institutional fee settings
export const feeStructure = pgTable("fee_structure", {
  feeId: serial("fee_id").primaryKey(),
  academicYear: text("academic_year").notNull(),
  phase: text("phase").notNull(),
  batch: text("batch").notNull(),
  year1Fee: numeric("year_1_fee", { precision: 10, scale: 2 }),
  year2Fee: numeric("year_2_fee", { precision: 10, scale: 2 }),
  year3Fee: numeric("year_3_fee", { precision: 10, scale: 2 }),
  year4Fee: numeric("year_4_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLAR FEE DEMAND ===
// Tuition fee tracking per scholar
export const scholarFeeDemand = pgTable("scholar_fee_demand", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  academicYear: text("academic_year").notNull(),
  arrearsAmount: numeric("arrears_amount", { precision: 10, scale: 2 }).default("0"),
  hostelArrears: numeric("hostel_arrears", { precision: 10, scale: 2 }).default("0"),
  annualFee: numeric("annual_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === FEE PAYMENTS ===
// Payment transactions
export const feePayments = pgTable("fee_payments", {
  paymentId: serial("payment_id").primaryKey(),
  userId: integer("user_id").notNull(),
  academicYear: text("academic_year").notNull(),
  transactionId: text("transaction_id").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  bankName: text("bank_name"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("PENDING"), // 'PENDING', 'COMPLETED', 'FAILED'
  createdAt: timestamp("created_at").defaultNow(),
});

// === COURSE COMPLETION ===
// Tracks whether a scholar has completed course work
export const courseCompletion = pgTable("course_completion", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  completedOn: date("completed_on"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === APPLICATION REQUIREMENT DOCUMENTS ===
// Defines which documents are required for each application type
export const applicationRequiredDocuments = pgTable("application_required_documents", {
  id: serial("id").primaryKey(),
  applicationType: text("application_type").notNull(), // 'Extension', 'Re-Registration', etc.
  documentType: text("document_type").notNull(), // e.g., 'admission_letter', 'course_marks_memo'
  displayName: text("display_name").notNull(), // User-friendly name
  description: text("description"),
  isMandatory: boolean("is_mandatory").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === APPLICATION ATTACHMENTS ===
// Stores uploaded documents for applications
export const applicationAttachments = pgTable("application_attachments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // matches applicationRequiredDocuments.documentType
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedOn: timestamp("uploaded_on").defaultNow(),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedOn: timestamp("verified_on"),
  verificationNotes: text("verification_notes"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === APPLICATION REVIEWER CHECKLIST ===
// Tracks what each reviewer verified for an application
export const applicationReviewerChecklist = pgTable("application_reviewer_checklist", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  reviewStage: text("review_stage").notNull(), // 'supervisor', 'drc', 'irc', 'doaa'
  documentsVerified: boolean("documents_verified").default(false),
  eligibilityVerified: boolean("eligibility_verified").default(false),
  eligibilityIssues: jsonb("eligibility_issues"), // Store specific eligibility problems
  documentsReview: jsonb("documents_review"), // Document checklist status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueReviewChecklist: unique().on(table.applicationId, table.reviewerId, table.reviewStage),
}));


// === AUDIT LOGS ===
// Change/action tracking
export const auditLogs = pgTable("audit_logs", {
  auditId: serial("audit_id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(),
  performedBy: integer("performed_by").notNull(),
  performedOn: timestamp("performed_on").defaultNow(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users);
export const insertApplicationSchema = createInsertSchema(applications);
export const insertApplicationReviewSchema = createInsertSchema(applicationReviews);
export const insertScholarEducationBackgroundSchema = createInsertSchema(scholarEducationBackground);
export const insertScholarReviewSchema = createInsertSchema(scholarReviews);
export const insertApplicationAttachmentSchema = createInsertSchema(applicationAttachments);
export const insertApplicationRequiredDocumentsSchema = createInsertSchema(applicationRequiredDocuments);
export const insertApplicationReviewerChecklistSchema = createInsertSchema(applicationReviewerChecklist);

// === TYPES ===
export type User = typeof users.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RacReview = typeof racReviews.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ApplicationReview = typeof applicationReviews.$inferSelect;
export type InsertApplicationReview = z.infer<typeof insertApplicationReviewSchema>;
export type ResearchProgress = typeof researchProgress.$inferSelect;
export type ScholarEducationBackground = typeof scholarEducationBackground.$inferSelect;
export type InsertScholarEducationBackground = z.infer<typeof insertScholarEducationBackgroundSchema>;
export type ScholarReview = typeof scholarReviews.$inferSelect;
export type InsertScholarReview = z.infer<typeof insertScholarReviewSchema>;
export type ApplicationAttachment = typeof applicationAttachments.$inferSelect;
export type InsertApplicationAttachment = z.infer<typeof insertApplicationAttachmentSchema>;
export type ApplicationRequiredDocument = typeof applicationRequiredDocuments.$inferSelect;
export type ApplicationReviewerChecklist = typeof applicationReviewerChecklist.$inferSelect;
