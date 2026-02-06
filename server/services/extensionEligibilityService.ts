import { storage } from "../storage";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// For ES modules, we need to define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load extension rules from JSON config
const extensionRulesConfigPath = path.join(__dirname, "../config/extension-rules.json");
const extensionRulesConfig = JSON.parse(fs.readFileSync(extensionRulesConfigPath, "utf-8"));

export interface ExtensionEligibilityResult {
  isEligible: boolean;
  issues: string[];
  warnings: string[];
  details: {
    yearsCompleted: number;
    racMeetingsCount: number;
    hasPreTalk: boolean;
    coursesCompleted: boolean;
    feeArrears: number;
    currentExtensions: number;
    maxAllowedExtensions: number;
  };
}

export interface ExtensionRule {
  gender: string;
  minYearsCompleted: number;
  maxExtensionYears: number;
  minRacMeetings: number;
  requiresCoursesCompletion: boolean;
  requiresNoFeeArrears: boolean;
  requiresNoPreTalk: boolean;
  allowedExtensionPeriods: string[];
}

export class ExtensionEligibilityService {
  private getEligibilityRules(gender: string): ExtensionRule {
    const rules = (extensionRulesConfig.extensionEligibilityRules as Record<string, ExtensionRule>);
    // Default to male rules if gender not found in config
    return rules[gender] || rules["M"];
  }

  async checkExtensionEligibility(scholarId: string): Promise<ExtensionEligibilityResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Get scholar information - need to look up by scholarId string first
    const scholar = await storage.getScholarByScholarId(scholarId);
    if (!scholar) {
      throw new Error("Scholar not found");
    }

    // Determine gender category from DB fields (scholar_personal_details)
    const personalDetails = await storage.getScholarPersonalDetails(scholar.userId);
    let genderCategory = "M";
    if (personalDetails?.isPwd === true) {
      genderCategory = "PWD";
    } else if (personalDetails?.gender && personalDetails.gender.toLowerCase() === "female") {
      genderCategory = "F";
    }

    // Get rules for this gender category from JSON config
    const rules = this.getEligibilityRules(genderCategory);

    // 1. Check years completed in PhD programme
    const joiningDate = scholar.joiningDate ? new Date(scholar.joiningDate) : null;
    let yearsCompleted = 0;

    if (joiningDate) {
      const monthsDiff =
        (new Date().getFullYear() - joiningDate.getFullYear()) * 12 +
        (new Date().getMonth() - joiningDate.getMonth());
      yearsCompleted = Math.floor(monthsDiff / 12);
    }

    if (yearsCompleted < rules.minYearsCompleted) {
      issues.push(
        `Only ${yearsCompleted} years completed. Minimum ${rules.minYearsCompleted} years required for extension eligibility.`,
      );
    }

    // Run remaining checks in PARALLEL instead of sequential
    const [racMeetingsCount, hasPreTalk, coursesCompleted, feeArrears, currentExtensions] = await Promise.all([
      storage.countRacMeetings(scholar.userId),
      rules.requiresNoPreTalk ? storage.checkIfPreTalkDone(scholar.userId) : Promise.resolve(false),
      rules.requiresCoursesCompletion ? storage.checkCourseCompletion(scholar.userId) : Promise.resolve(true),
      rules.requiresNoFeeArrears ? storage.calculateFeeArrears(scholar.userId) : Promise.resolve(0),
      storage.countApprovedExtensions(scholar.userId),
    ]);

    // 2. Check RAC meetings
    if (racMeetingsCount < rules.minRacMeetings) {
      issues.push(
        `Only ${racMeetingsCount} RAC meetings completed. Minimum ${rules.minRacMeetings} RAC meetings required.`,
      );
    }

    // 3. Check if pre-talk has been conducted
    if (rules.requiresNoPreTalk && hasPreTalk) {
      issues.push("Pre-talk has been conducted. Extension not allowed after pre-talk.");
    }

    // 4. Check course completion
    if (rules.requiresCoursesCompletion && !coursesCompleted) {
      warnings.push("Course work not yet completed. This may affect extension approval.");
    }

    // 5. Check fee arrears
    if (rules.requiresNoFeeArrears && feeArrears > 0) {
      issues.push(
        `Outstanding fee arrears: ₹${feeArrears}. All dues must be cleared before extension.`,
      );
    }

    // 6. Check extension limit based on gender
    const currentTotalYears = currentExtensions * 0.5; // Assuming 6-month extensions

    if (currentTotalYears >= rules.maxExtensionYears) {
      issues.push(
        `Maximum extension limit of ${rules.maxExtensionYears} years already reached (${currentExtensions} extension(s) approved).`,
      );
    }

    const isEligible = issues.length === 0;

    return {
      isEligible,
      issues,
      warnings,
      details: {
        yearsCompleted,
        racMeetingsCount,
        hasPreTalk,
        coursesCompleted,
        feeArrears,
        currentExtensions,
        maxAllowedExtensions: rules.maxExtensionYears,
      },
    };
  }

  async getRequiredDocumentsForExtension(scholarId: string): Promise<RequiredDocument[]> {
    const docs = (extensionRulesConfig.requiredDocuments as Record<string, RequiredDocument[]>);
    return docs["Extension"] || [];
  }
}

export interface RequiredDocument {
  type: string;
  name: string;
  description: string;
  isMandatory: boolean;
}

export const extensionEligibilityService = new ExtensionEligibilityService();
