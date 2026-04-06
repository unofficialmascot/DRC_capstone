import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS / BASE ===
// Core user table - minimal fields, passwords MUST be hashed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(), // HASHED password using bcryptjs
  role: text("role").notNull(), // 'scholar', 'supervisor', 'drc', 'drc_convener', 'drc_chairman', 'irc', 'doaa', 'admin'
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
  employeeId: text("employee_id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  designation: text("designation"), // Professor, Associate Professor, etc.
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeRoles = pgTable(
  "employee_roles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    role: text("role").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("employee_roles_user_idx").on(table.userId),
    uniqueUserRole: uniqueIndex("employee_roles_user_role_idx").on(table.userId, table.role),
  }),
);

// === SCHOLARS ===
// Scholar-specific data - separated from users
export const scholars = pgTable("scholars", {
  scholarId: text("scholar_id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  batch: text("batch"),
  status: text("status").default("Active"), // Active, Inactive, Graduated
  lifecycleStatus: text("lifecycle_status").notNull().default("Active"), // Active, Awarded, Deregistered, Terminated, Re-registered
  department: text("department"),
  researchArea: text("research_area"),
  researchTitle: text("research_title"),
  joiningDate: text("joining_date"),
  phase: text("phase"), // Phase-I, Phase-II, Phase-III
  programme: text("programme"), // Full Time, Part Time
  location: text("location"),
  
  // Supervisor assignments
  supervisorId: text("supervisor_id"), // Primary supervisor (employee_id)
  coSupervisorId: text("co_supervisor_id"), // Co-supervisor (employee_id)
  extensionMonthsGranted: integer("extension_months_granted").default(0),
  lastExtensionApprovedAt: timestamp("last_extension_approved_at"),
  
  // Personal Details
  fatherName: text("father_name"),
  parentMobile: text("parent_mobile"),
  aadhaar: text("aadhaar"),
  nationality: text("nationality"),
  address: text("address"),
  
  // Education
  tenthBoard: text("tenth_board"),
  tenthPercentage: text("tenth_percentage"),
  interBoard: text("inter_board"),
  interPercentage: text("inter_percentage"),

  // Administrative
  hasFeesDue: boolean("has_fees_due").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supervisorChangeHistory = pgTable("supervisor_change_history", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),
  applicationId: integer("application_id").notNull(),
  previousSupervisorId: text("previous_supervisor_id"),
  newSupervisorId: text("new_supervisor_id").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

// === RAC MEMBERS ===
// DRC, IRC, DoAA members assigned to scholars (exactly 2 members per scholar)
export const racMembers = pgTable("rac_members", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),
  employeeId: text("employee_id").notNull(), // Reference to employees table
  memberRole: text("member_role").notNull(), // 'drc', 'irc', 'doaa'
  assignedOn: timestamp("assigned_on").defaultNow(),
});



// === APPLICATIONS ===
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),
  type: text("type").notNull(), // 'Extension', 'Re-Registration', 'Supervisor Change', 'Pre-Talk', 'Thesis Submission', etc.
  status: text("status").notNull().default("Pending"), // 'Pending', 'Approved', 'Rejected'
  currentStage: text("current_stage").notNull().default("supervisor"), // 'supervisor', 'drc', 'irc', 'doaa', 'completed'
  submissionDate: timestamp("submission_date").defaultNow(),
  details: jsonb("details"), // Store extra form fields here
  finalOutcome: text("final_outcome"), // 'Approved', 'Rejected', null if still in progress
});

// === APPLICATION REVIEWS ===
// Each approval step creates a review record
export const applicationReviews = pgTable("application_reviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  stage: text("stage").notNull(), // 'drc', 'irc', 'doaa'
  decision: text("decision").notNull(), // 'approved', 'rejected'
  remarks: text("remarks").notNull(),
  reviewDate: timestamp("review_date").defaultNow(),
});

export const applicationDocuments = pgTable(
  "application_documents",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id").notNull(),
    documentId: integer("document_id").notNull(),
    requirementCode: text("requirement_code"),
    attachedBy: text("attached_by").notNull().default("scholar"),
    attachedAt: timestamp("attached_at").defaultNow(),
  },
  (table) => ({
    applicationIdx: index("application_documents_application_idx").on(table.applicationId),
    documentIdx: index("application_documents_document_idx").on(table.documentId),
    uniqueApplicationDocument: uniqueIndex("application_documents_application_document_idx").on(
      table.applicationId,
      table.documentId,
    ),
  }),
);

// === DRC MEETINGS / AGENDA ===
export const drcMeetings = pgTable("drc_meetings", {
  id: serial("id").primaryKey(),
  meetingDate: timestamp("meeting_date").notNull(),
  scheduledBy: text("scheduled_by").notNull(), // employee_id
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  closedBy: text("closed_by"), // employee_id
});

export const drcMeetingApplications = pgTable("drc_meeting_applications", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  applicationId: integer("application_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const drcAgendaPoints = pgTable("drc_agenda_points", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  point: text("point").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drcMeetingMinutes = pgTable("drc_meeting_minutes", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  generatedBy: text("generated_by").notNull(), // employee_id (convener)
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const drcMinuteItems = pgTable("drc_minute_items", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  applicationId: integer("application_id").notNull(),
  approvalCount: integer("approval_count").notNull().default(0),
  rejectionCount: integer("rejection_count").notNull().default(0),
  memberSummary: jsonb("member_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drcChairmanDecisions = pgTable("drc_chairman_decisions", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  applicationId: integer("application_id").notNull(),
  chairmanId: text("chairman_id").notNull(), // employee_id
  decision: text("decision").notNull(), // approved | rejected
  remarks: text("remarks").notNull(),
  decidedAt: timestamp("decided_at").defaultNow(),
});


// === RESEARCH PROGRESS ===
export const researchProgress = pgTable("research_progress", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),
  completedReviews: integer("completed_reviews").default(0),
  pendingReports: integer("pending_reports").default(0),
  publications: integer("publications").default(0),
  lastReviewDate: timestamp("last_review_date"),
});

// === NOTICES ===
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  notificationType: text("notification_type").notNull().default("general"),
  relatedApplicationId: integer("related_application_id"),
  relatedMeetingId: integer("related_meeting_id"),
  date: timestamp("date").defaultNow(),
  targetRole: text("target_role"),
});

export const noticeDismissals = pgTable(
  "notice_dismissals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    noticeId: integer("notice_id").notNull(),
    dismissedAt: timestamp("dismissed_at").defaultNow(),
  },
  (table) => ({
    uniqueUserNotice: uniqueIndex("notice_dismissals_user_notice_idx").on(
      table.userId,
      table.noticeId,
    ),
  }),
);

// === DOCUMENTS ===
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),
  documentType: text("document_type").notNull(), // 'aadhaar', 'pan', 'passport', 'grade_cards', 'degree_certificates', 'transfer_certificate'
  category: text("category").notNull(), // 'personal' or 'academic'
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: text("verified_by"), // employee_id who verified
  verifiedAt: timestamp("verified_at"),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users);
export const insertEmployeeRoleSchema = createInsertSchema(employeeRoles);
export const insertApplicationSchema = createInsertSchema(applications, {
  details: z.record(z.unknown()).optional(), // Explicitly allow any object for details field
  submissionDate: z.union([z.string(), z.date()]).optional(), // API returns dates as strings
});
export const insertApplicationReviewSchema = createInsertSchema(applicationReviews);
export const insertApplicationDocumentSchema = createInsertSchema(applicationDocuments);
export const insertDrcMeetingSchema = createInsertSchema(drcMeetings);
export const insertDrcMeetingApplicationSchema = createInsertSchema(drcMeetingApplications);
export const insertDrcAgendaPointSchema = createInsertSchema(drcAgendaPoints);
export const insertDrcMeetingMinutesSchema = createInsertSchema(drcMeetingMinutes);
export const insertDrcMinuteItemSchema = createInsertSchema(drcMinuteItems);
export const insertDrcChairmanDecisionSchema = createInsertSchema(drcChairmanDecisions);
export const insertNoticeSchema = createInsertSchema(notices);
export const insertNoticeDismissalSchema = createInsertSchema(noticeDismissals);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertSupervisorChangeHistorySchema = createInsertSchema(supervisorChangeHistory);

// === TYPES ===
export type User = typeof users.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EmployeeRole = typeof employeeRoles.$inferSelect;
export type InsertEmployeeRole = z.infer<typeof insertEmployeeRoleSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ApplicationReview = typeof applicationReviews.$inferSelect;
export type InsertApplicationReview = z.infer<typeof insertApplicationReviewSchema>;
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;
export type InsertApplicationDocument = z.infer<typeof insertApplicationDocumentSchema>;
export type DrcMeeting = typeof drcMeetings.$inferSelect;
export type InsertDrcMeeting = z.infer<typeof insertDrcMeetingSchema>;
export type DrcMeetingApplication = typeof drcMeetingApplications.$inferSelect;
export type InsertDrcMeetingApplication = z.infer<typeof insertDrcMeetingApplicationSchema>;
export type DrcAgendaPoint = typeof drcAgendaPoints.$inferSelect;
export type InsertDrcAgendaPoint = z.infer<typeof insertDrcAgendaPointSchema>;
export type DrcMeetingMinutes = typeof drcMeetingMinutes.$inferSelect;
export type InsertDrcMeetingMinutes = z.infer<typeof insertDrcMeetingMinutesSchema>;
export type DrcMinuteItem = typeof drcMinuteItems.$inferSelect;
export type InsertDrcMinuteItem = z.infer<typeof insertDrcMinuteItemSchema>;
export type DrcChairmanDecision = typeof drcChairmanDecisions.$inferSelect;
export type InsertDrcChairmanDecision = z.infer<typeof insertDrcChairmanDecisionSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type NotificationType =
  | "general"
  | "drc_meeting_scheduled"
  | "review_decision"
  | "review_pending"
  | "minutes_generated"
  | "chairman_decision";
export type NoticeDismissal = typeof noticeDismissals.$inferSelect;
export type InsertNoticeDismissal = z.infer<typeof insertNoticeDismissalSchema>;
export type ResearchProgress = typeof researchProgress.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SupervisorChangeHistory = typeof supervisorChangeHistory.$inferSelect;
export type InsertSupervisorChangeHistory = z.infer<typeof insertSupervisorChangeHistorySchema>;
