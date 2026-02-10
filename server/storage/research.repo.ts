import type {
  CreateCourseCompletionInput,
  CreateFeePaymentInput,
  CreateResearchProgressInput,
  CreateScholarFeeDemandInput,
  CreateScholarPersonalDetailsInput,
  ResearchProgress,
  ScholarPersonalDetails,
} from "../domain/types";

export interface ResearchRepository {
  getResearchProgress(userId: number): Promise<ResearchProgress | undefined>;
  createResearchProgress(stats: CreateResearchProgressInput): Promise<ResearchProgress>;
  getScholarPersonalDetails(scholarId: number): Promise<ScholarPersonalDetails | undefined>;
  createScholarPersonalDetails(details: CreateScholarPersonalDetailsInput): Promise<ScholarPersonalDetails>;
  createCourseCompletion(record: CreateCourseCompletionInput): Promise<Record<string, unknown>>;
  createScholarFeeDemand(record: CreateScholarFeeDemandInput): Promise<Record<string, unknown>>;
  createFeePayment(record: CreateFeePaymentInput): Promise<Record<string, unknown>>;

  // Extension helper methods kept stable
  countRacMeetings(scholarId: number): Promise<number>;
  checkIfPreTalkDone(scholarId: number): Promise<boolean>;
  checkCourseCompletion(scholarId: number): Promise<boolean>;
  calculateFeeArrears(numericScholarId: number): Promise<number>;
  countApprovedExtensions(scholarId: number | string): Promise<number>;
}
