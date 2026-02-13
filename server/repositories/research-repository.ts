import { eq } from "drizzle-orm";
import { db } from "../db";
import { researchProgress } from "@shared/schema";

export class ResearchRepository {
  async getResearchProgress(
    scholarId: string,
  ): Promise<typeof researchProgress.$inferSelect | undefined> {
    const [stats] = await db
      .select()
      .from(researchProgress)
      .where(eq(researchProgress.scholarId, scholarId));
    return stats;
  }

  async createResearchProgress(
    stats: typeof researchProgress.$inferInsert,
  ): Promise<typeof researchProgress.$inferSelect> {
    const [newStats] = await db.insert(researchProgress).values(stats).returning();
    return newStats;
  }
}
