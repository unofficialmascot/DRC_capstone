import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  employeeId: text("employee_id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  designation: text("designation"), // Professor, Associate Professor, etc.
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHOLARS ===
// Scholar-specific data - separated from users
export const scholars = pgTable("scholars", {
  scholarId: text("scholar_id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  batch: text("batch"),
  status: text("status").default("Active"), // Active, Inactive, Graduated
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
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  date: timestamp("date").defaultNow(),
  targetRole: text("target_role"),
});

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
export const insertApplicationSchema = createInsertSchema(applications);
export const insertApplicationReviewSchema = createInsertSchema(applicationReviews);
export const insertNoticeSchema = createInsertSchema(notices);
export const insertDocumentSchema = createInsertSchema(documents);

// === TYPES ===
export type User = typeof users.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ApplicationReview = typeof applicationReviews.$inferSelect;
export type InsertApplicationReview = z.infer<typeof insertApplicationReviewSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type ResearchProgress = typeof researchProgress.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
