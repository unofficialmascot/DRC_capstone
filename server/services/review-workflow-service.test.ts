import test from "node:test";
import assert from "node:assert/strict";
import { submitApplicationReview } from "./review-workflow-service";
import { storage } from "../storage";
import { ApiError } from "../routes/http";

type MutableStorage = Record<string, unknown>;

function withMockedStorage<T>(
  overrides: Partial<MutableStorage>,
  run: () => Promise<T>,
): Promise<T> {
  const target = storage as unknown as MutableStorage;
  const originals = new Map<string, unknown>();

  for (const [key, value] of Object.entries(overrides)) {
    originals.set(key, target[key]);
    target[key] = value;
  }

  return run().finally(() => {
    for (const [key, value] of originals.entries()) {
      target[key] = value;
    }
  });
}

test("submitApplicationReview throws 404 when application is missing", async () => {
  await withMockedStorage(
    {
      getApplicationById: async () => undefined,
    },
    async () => {
      await assert.rejects(
        () =>
          submitApplicationReview(1001, {
            reviewerId: "EMP-SUPERVISOR-001",
            decision: "approved",
            remarks: "Looks good",
          }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 404);
          assert.equal(error.message, "Application not found");
          return true;
        },
      );
    },
  );
});

test("submitApplicationReview throws 403 when supervisor is not assigned", async () => {
  await withMockedStorage(
    {
      getApplicationById: async () => ({
        id: 10,
        scholarId: "GITAM-SCH-2020-118",
        type: "Extension",
        status: "Pending",
        currentStage: "supervisor",
        details: {},
      }),
      getEmployee: async () => ({
        id: 2,
        employeeId: "EMP-SUPERVISOR-001",
      }),
      isSupervisorForScholar: async () => false,
    },
    async () => {
      await assert.rejects(
        () =>
          submitApplicationReview(10, {
            reviewerId: "EMP-SUPERVISOR-001",
            decision: "approved",
            remarks: "Approved",
          }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 403);
          assert.equal(error.message, "Supervisor not assigned to this scholar");
          return true;
        },
      );
    },
  );
});

test("submitApplicationReview returns updated app and review on success", async () => {
  let updatedStage: unknown;
  let updatedStatus: unknown;
  let updatedOutcome: unknown;

  await withMockedStorage(
    {
      getApplicationById: async () => ({
        id: 21,
        scholarId: "GITAM-SCH-2020-118",
        type: "Extension",
        status: "Pending",
        currentStage: "supervisor",
        details: { extensionDuration: "6 months" },
      }),
      getEmployee: async () => ({
        id: 3,
        employeeId: "EMP-SUPERVISOR-001",
      }),
      isSupervisorForScholar: async () => true,
      createReview: async (payload: unknown) => payload,
      updateApplication: async (
        _applicationId: number,
        updates: Record<string, unknown>,
      ) => {
        updatedStage = updates.currentStage;
        updatedStatus = updates.status;
        updatedOutcome = updates.finalOutcome;
        return {
          id: 21,
          currentStage: updates.currentStage,
          status: updates.status,
          finalOutcome: updates.finalOutcome,
        };
      },
    },
    async () => {
      const result = await submitApplicationReview(21, {
        reviewerId: "EMP-SUPERVISOR-001",
        decision: "approved",
        remarks: "Proceed",
      });

      assert.equal(updatedStage, "drc");
      assert.equal(updatedStatus, "Pending");
      assert.equal(updatedOutcome, null);
      assert.equal((result.review as { applicationId: number }).applicationId, 21);
      assert.equal((result.application as { currentStage: string }).currentStage, "drc");
    },
  );
});
