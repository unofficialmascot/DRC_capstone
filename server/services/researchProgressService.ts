import { storage } from "../storage";

export class ResearchProgressService {
  async getResearchProgress(scholarId: string) {
    const stats = await storage.getResearchProgress(scholarId);
    
    if (!stats) {
      return {
        completedReviews: 0,
        pendingReports: 0,
        publications: 0,
      };
    }

    return stats;
  }

  async createResearchProgress(
    scholarId: string,
    data: {
      completedReviews?: number;
      pendingReports?: number;
      publications?: number;
    },
  ) {
    const numericScholarId = parseInt(scholarId, 10);
    return storage.createResearchProgress({
      scholarId: numericScholarId,
      completedReviews: data.completedReviews ?? 0,
      pendingReports: data.pendingReports ?? 0,
      publications: data.publications ?? 0,
    });
  }

  async updateResearchProgress(
    scholarId: string,
    data: {
      completedReviews?: number;
      pendingReports?: number;
      publications?: number;
    },
  ) {
    const numericScholarId = parseInt(scholarId, 10);
    const existing = await storage.getResearchProgress(scholarId);
    
    if (!existing) {
      return this.createResearchProgress(scholarId, data);
    }

    // Update logic would go here
    // For now, just return existing
    return existing;
  }
}

export const researchProgressService = new ResearchProgressService();
