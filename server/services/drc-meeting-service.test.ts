import test from "node:test";
import assert from "node:assert/strict";
import {
  clearDrcMeetingNotifications,
  listDrcMeetingNotifications,
} from "./drc-meeting-service";
import { storage } from "../storage";
import { DrcMeetingRepository } from "../repositories/drc-meeting-repository";
import { ApiError } from "../routes/http";

type MutableStorage = Record<string, unknown>;
type MutableRepositoryPrototype = Record<string, unknown>;

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

function withMockedRepositoryPrototype<T>(
  overrides: Partial<MutableRepositoryPrototype>,
  run: () => Promise<T>,
): Promise<T> {
  const target = DrcMeetingRepository.prototype as unknown as MutableRepositoryPrototype;
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

test("listDrcMeetingNotifications returns notices for authorized viewer", async () => {
  let capturedTargetRole: string | undefined;
  let capturedUserId: number | undefined;

  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 101,
        role: "drc",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          listRoleNotices: async (targetRole: string, userId: number) => {
            capturedTargetRole = targetRole;
            capturedUserId = userId;
            return [
              {
                id: 11,
                title: "DRC Meeting Scheduled (ID: 7)",
                content: "Open the Meetings tab to download agenda PDF.",
                date: new Date("2026-03-05T10:00:00.000Z"),
                targetRole: "drc",
              },
            ];
          },
        },
        async () => {
          const result = await listDrcMeetingNotifications(101);
          assert.equal(capturedTargetRole, "drc");
          assert.equal(capturedUserId, 101);
          assert.equal(result.length, 1);
          assert.equal(result[0].id, 11);
        },
      );
    },
  );
});

test("clearDrcMeetingNotifications clears only current user's visible notices", async () => {
  let capturedTargetRole: string | undefined;
  let capturedUserId: number | undefined;

  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 202,
        role: "drc_chairman",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          clearRoleNotices: async (targetRole: string, userId: number) => {
            capturedTargetRole = targetRole;
            capturedUserId = userId;
            return 3;
          },
        },
        async () => {
          const result = await clearDrcMeetingNotifications(202);
          assert.equal(capturedTargetRole, "drc");
          assert.equal(capturedUserId, 202);
          assert.deepEqual(result, { cleared: 3 });
        },
      );
    },
  );
});

test("clearDrcMeetingNotifications rejects users outside DRC meeting roles", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 303,
        role: "scholar",
      }),
    },
    async () => {
      await assert.rejects(
        () => clearDrcMeetingNotifications(303),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 403);
          assert.equal(error.message, "Only DRC members can access meeting agendas");
          return true;
        },
      );
    },
  );
});
