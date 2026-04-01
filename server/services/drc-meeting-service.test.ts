import test from "node:test";
import assert from "node:assert/strict";
import {
  closeDrcMeeting,
  clearDrcMeetingNotifications,
  listDrcMeetings,
  listDrcMeetingNotifications,
  scheduleDrcMeeting,
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

test("scheduleDrcMeeting creates meeting with normalized agenda points", async () => {
  let capturedMeetingId: number | undefined;
  let capturedApplicationIds: number[] = [];
  let capturedAgendaPoints: string[] = [];

  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 1,
        role: "drc_convener",
        employeeId: "EMP-100",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getOpenMeeting: async () => null,
          getPendingDrcApplications: async () => [
            {
              id: 41,
              scholarId: "SCH001",
              type: "Extension",
            },
          ],
          createMeeting: async ({ meetingDate, scheduledBy }: { meetingDate: Date; scheduledBy: string }) => ({
            id: 88,
            meetingDate,
            scheduledBy,
            scheduledAt: new Date("2026-04-01T09:00:00.000Z"),
            closedAt: null,
            closedBy: null,
          }),
          addMeetingApplications: async (meetingId: number, applicationIds: number[]) => {
            capturedMeetingId = meetingId;
            capturedApplicationIds = applicationIds;
          },
          addAgendaPoints: async (_meetingId: number, points: string[]) => {
            capturedAgendaPoints = points;
            return points.map((point, index) => ({
              id: index + 1,
              meetingId: 88,
              point,
              createdAt: new Date("2026-04-01T09:00:00.000Z"),
            }));
          },
        },
        async () => {
          const result = await scheduleDrcMeeting(1, {
            meetingDate: "2026-05-01T10:00:00.000Z",
            extraPoints: ["  Location: Seminar Hall  ", "  ", "Discuss pending scholarship cases"],
          });

          assert.equal(result.meeting.id, 88);
          assert.equal(capturedMeetingId, 88);
          assert.deepEqual(capturedApplicationIds, [41]);
          assert.deepEqual(capturedAgendaPoints, ["Location: Seminar Hall", "Discuss pending scholarship cases"]);
          assert.equal(result.applications.length, 1);
          assert.equal(result.extraPoints.length, 2);
        },
      );
    },
  );
});

test("scheduleDrcMeeting rejects when active meeting exists", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 2,
        role: "drc_convener",
        employeeId: "EMP-200",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getOpenMeeting: async () => ({ id: 7 }),
        },
        async () => {
          await assert.rejects(
            () =>
              scheduleDrcMeeting(2, {
                meetingDate: "2026-05-01T10:00:00.000Z",
              }),
            (error: unknown) => {
              assert.ok(error instanceof ApiError);
              assert.equal(error.status, 400);
              assert.equal(error.message, "An active DRC meeting already exists. Close it before scheduling a new one.");
              return true;
            },
          );
        },
      );
    },
  );
});

test("scheduleDrcMeeting rejects invalid meeting date", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 3,
        role: "drc_convener",
        employeeId: "EMP-300",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getOpenMeeting: async () => null,
        },
        async () => {
          await assert.rejects(
            () =>
              scheduleDrcMeeting(3, {
                meetingDate: "not-a-date",
              }),
            (error: unknown) => {
              assert.ok(error instanceof ApiError);
              assert.equal(error.status, 400);
              assert.equal(error.message, "Invalid meeting date");
              return true;
            },
          );
        },
      );
    },
  );
});

test("scheduleDrcMeeting rejects convener without employee profile", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 4,
        role: "drc_convener",
        employeeId: null,
      }),
    },
    async () => {
      await assert.rejects(
        () =>
          scheduleDrcMeeting(4, {
            meetingDate: "2026-05-01T10:00:00.000Z",
          }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 400);
          assert.equal(error.message, "DRC convener account is missing employee profile");
          return true;
        },
      );
    },
  );
});

test("listDrcMeetings returns meetings for authorized DRC viewer", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 5,
        role: "drc_convener",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          listMeetings: async () => [
            {
              id: 10,
              meetingDate: new Date("2026-04-03T10:00:00.000Z"),
              scheduledBy: "EMP-100",
              scheduledAt: new Date("2026-04-02T10:00:00.000Z"),
              closedAt: null,
              closedBy: null,
            },
          ],
        },
        async () => {
          const result = await listDrcMeetings(5);
          assert.equal(result.length, 1);
          assert.equal(result[0].id, 10);
          assert.equal(result[0].closedAt, null);
        },
      );
    },
  );
});

test("listDrcMeetings rejects users outside DRC meeting roles", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 6,
        role: "scholar",
      }),
    },
    async () => {
      await assert.rejects(
        () => listDrcMeetings(6),
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

test("closeDrcMeeting closes an active meeting and returns agenda", async () => {
  let closedMeetingId: number | undefined;
  let closedBy: string | undefined;
  let capturedMinutesMeetingId: number | undefined;
  let capturedGeneratedBy: string | undefined;

  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 7,
        role: "drc_convener",
        employeeId: "EMP-700",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getMeetingById: async () => ({
            id: 50,
            meetingDate: new Date("2026-04-05T10:00:00.000Z"),
            scheduledBy: "EMP-700",
            scheduledAt: new Date("2026-04-04T10:00:00.000Z"),
            closedAt: null,
            closedBy: null,
          }),
          closeMeeting: async (meetingId: number, employeeId: string) => {
            closedMeetingId = meetingId;
            closedBy = employeeId;
          },
          getMeetingApplications: async () => [],
          getDrcReviewsByApplicationIds: async () => [],
          createMeetingMinutes: async ({ meetingId, generatedBy }: { meetingId: number; generatedBy: string }) => {
            capturedMinutesMeetingId = meetingId;
            capturedGeneratedBy = generatedBy;
          },
          replaceMinuteItems: async () => {},
          getAgendaPoints: async () => [],
        },
        async () => {
          const result = await closeDrcMeeting(7, 50);
          assert.equal(closedMeetingId, 50);
          assert.equal(closedBy, "EMP-700");
          assert.equal(capturedMinutesMeetingId, 50);
          assert.equal(capturedGeneratedBy, "EMP-700");
          assert.equal(result.meeting.id, 50);
        },
      );
    },
  );
});

test("closeDrcMeeting rejects missing meeting", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 8,
        role: "drc_convener",
        employeeId: "EMP-800",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getMeetingById: async () => null,
        },
        async () => {
          await assert.rejects(
            () => closeDrcMeeting(8, 404),
            (error: unknown) => {
              assert.ok(error instanceof ApiError);
              assert.equal(error.status, 404);
              assert.equal(error.message, "Meeting not found");
              return true;
            },
          );
        },
      );
    },
  );
});

test("closeDrcMeeting rejects already closed meeting", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 9,
        role: "drc_convener",
        employeeId: "EMP-900",
      }),
    },
    async () => {
      await withMockedRepositoryPrototype(
        {
          getMeetingById: async () => ({
            id: 90,
            meetingDate: new Date("2026-04-05T10:00:00.000Z"),
            scheduledBy: "EMP-900",
            scheduledAt: new Date("2026-04-04T10:00:00.000Z"),
            closedAt: new Date("2026-04-06T10:00:00.000Z"),
            closedBy: "EMP-900",
          }),
        },
        async () => {
          await assert.rejects(
            () => closeDrcMeeting(9, 90),
            (error: unknown) => {
              assert.ok(error instanceof ApiError);
              assert.equal(error.status, 400);
              assert.equal(error.message, "Meeting is already closed");
              return true;
            },
          );
        },
      );
    },
  );
});

test("closeDrcMeeting rejects non-convener role", async () => {
  await withMockedStorage(
    {
      getUserWithScholar: async () => ({
        id: 10,
        role: "drc",
        employeeId: "EMP-1000",
      }),
    },
    async () => {
      await assert.rejects(
        () => closeDrcMeeting(10, 91),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 403);
          assert.equal(error.message, "Only DRC convener can schedule DRC meetings");
          return true;
        },
      );
    },
  );
});

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
