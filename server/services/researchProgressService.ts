import type { IStorage } from "../storage";

export class ResearchProgressService {
  constructor(private readonly storage: IStorage) {}

  async getResearchProgress(scholarId: string) {
    const stats = await this.storage.getResearchProgress(scholarId);
    
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
    return this.storage.createResearchProgress({
      userId: numericScholarId,
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
    const existing = await this.storage.getResearchProgress(scholarId);
    
    if (!existing) {
      return this.createResearchProgress(scholarId, data);
    }

    // Update logic would go here
    // For now, just return existing
    return existing;
  }
}
