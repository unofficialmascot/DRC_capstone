import type { IStorage } from "../storage";

export class ResearchProgressService {
  constructor(private readonly storage: IStorage) {}

  async getResearchProgress(userId: number) {
    const stats = await this.storage.getResearchProgress(userId);
    
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
    userId: number,
    data: {
      completedReviews?: number;
      pendingReports?: number;
      publications?: number;
    },
  ) {
    return this.storage.createResearchProgress({
      userId,
      completedReviews: data.completedReviews ?? 0,
      pendingReports: data.pendingReports ?? 0,
      publications: data.publications ?? 0,
    });
  }

  async updateResearchProgress(
    userId: number,
    data: {
      completedReviews?: number;
      pendingReports?: number;
      publications?: number;
    },
  ) {
    const existing = await this.storage.getResearchProgress(userId);
    
    if (!existing) {
      return this.createResearchProgress(userId, data);
    }

    // Update logic would go here
    // For now, just return existing
    return existing;
  }
}
