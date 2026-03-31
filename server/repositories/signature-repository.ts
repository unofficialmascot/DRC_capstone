import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { documentSignatures, type DocumentSignature, type InsertDocumentSignature } from "@shared/schema";

export class SignatureRepository {
  async getByEntity(entityType: string, entityId: number): Promise<DocumentSignature[]> {
    return db
      .select()
      .from(documentSignatures)
      .where(and(eq(documentSignatures.entityType, entityType), eq(documentSignatures.entityId, entityId)))
      .orderBy(asc(documentSignatures.id));
  }

  async upsertByEntity(entries: Array<InsertDocumentSignature>): Promise<DocumentSignature[]> {
    if (entries.length === 0) {
      return [];
    }

    return db
      .insert(documentSignatures)
      .values(entries)
      .onConflictDoUpdate({
        target: [
          documentSignatures.entityType,
          documentSignatures.entityId,
          documentSignatures.signerId,
        ],
        set: {
          signerName: sql`excluded.signer_name`,
          signerRole: sql`excluded.signer_role`,
          label: sql`excluded.label`,
          signedAt: sql`excluded.signed_at`,
          assetPath: sql`excluded.asset_path`,
          metadata: sql`excluded.metadata`,
          updatedAt: new Date(),
        },
      })
      .returning();
  }
}
