import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { documents, type Document, type InsertDocument } from "@shared/schema";

export class DocumentRepository {
  async getDocuments(scholarId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.scholarId, scholarId));
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentsByIds(ids: number[]): Promise<Document[]> {
    if (ids.length === 0) {
      return [];
    }

    return db.select().from(documents).where(inArray(documents.id, ids));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document> {
    const [updated] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}
