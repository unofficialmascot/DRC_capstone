import test from "node:test";
import assert from "node:assert/strict";
import { SignatureResolverService } from "./signature-resolver-service";
import { applicationReviews } from "@shared/schema";
import { db } from "../db";
import { storage } from "../storage";

type Mutable = Record<string, unknown>;

test("getSignaturesForApplication maps signed reviews and adds pending placeholders", async () => {
  const service = new SignatureResolverService();
  const dbTarget = db as unknown as Mutable;
  const storageTarget = storage as unknown as Mutable;

  const originalSelect = dbTarget.select;
  const originalGetUserByEmployeeId = storageTarget.getUserByEmployeeId;
  const originalUpsertSignatures = storageTarget.upsertSignatures;
  const originalGetSignaturesByEntity = storageTarget.getSignaturesByEntity;

  dbTarget.select = () => ({
    from: (table: unknown) => {
      if (table === applicationReviews) {
        return {
          where: () => ({
            orderBy: async () => [
              {
                applicationId: 9,
                reviewerId: "EMP-DRC-1",
                stage: "drc",
                decision: "approved",
                remarks: "Looks good",
                reviewDate: new Date("2026-03-30T10:00:00.000Z"),
              },
            ],
          }),
        };
      }

      return {
        where: () => ({
          orderBy: () => ({
            limit: async () => [],
          }),
        }),
      };
    },
  });

  storageTarget.getUserByEmployeeId = async (employeeId: string) => ({ name: `User ${employeeId}` });
  storageTarget.upsertSignatures = async () => [];
  storageTarget.getSignaturesByEntity = async () => [
    {
      signerId: "EMP-DRC-1",
      signerName: "User EMP-DRC-1",
      signerRole: "DRC Member",
      label: "DRC Review",
      signedAt: new Date("2026-03-30T10:00:00.000Z"),
      assetPath: null,
      metadata: { decision: "approved" },
    },
  ];

  try {
    const signatures = await service.getSignaturesForApplication(9);
    assert.equal(signatures.some((item) => item.label === "DRC Review" && !item.isPending), true);
    assert.equal(signatures.some((item) => item.label === "IRC Review" && item.isPending), true);
    assert.equal(signatures.some((item) => item.label === "DoAA Review" && item.isPending), true);
  } finally {
    dbTarget.select = originalSelect;
    storageTarget.getUserByEmployeeId = originalGetUserByEmployeeId;
    storageTarget.upsertSignatures = originalUpsertSignatures;
    storageTarget.getSignaturesByEntity = originalGetSignaturesByEntity;
  }
});
