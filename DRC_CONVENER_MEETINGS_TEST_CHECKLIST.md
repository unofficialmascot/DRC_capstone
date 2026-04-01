# DRC Convener Meetings: Detailed Test Checklist

## Scope
- Convener scheduling flow
- Convener meetings history page (Active and Past tabs)
- Immediate close with confirmation
- Error-message correctness
- Role access behavior and regressions

## Test Data Setup
1. Create at least one DRC convener user with employee profile.
2. Create one DRC member user and one scholar user.
3. Seed at least two DRC-stage pending applications.
4. Ensure no active meeting exists before starting baseline tests.

## Functional Cases
1. Open Meeting Agenda page as convener.
- Expected: schedule card is visible with date/time/location and extra agenda points.

2. Schedule a meeting with valid date/time/location.
- Expected: success toast appears.
- Expected: open meeting appears as latest agenda.
- Expected: schedule button is disabled while mutation is pending.

3. Try scheduling another meeting while one is active.
- Expected: blocked with clear message about active meeting existing.

4. Open Meetings History page as convener.
- Expected: Active tab and Past tab are visible with counts.
- Expected: Active tab shows exactly one open meeting card.

5. Close active meeting from Meetings History.
- Expected: confirmation dialog opens first.
- Expected: cancel leaves meeting open.
- Expected: confirm closes meeting and shows success toast.
- Expected: closed meeting disappears from Active and appears in Past.

6. Download agenda PDF from Active and Past entries.
- Expected: each click opens a valid PDF URL in a new tab.

7. Verify schedule-after-close flow.
- Expected: after close, convener can schedule a new meeting again.

## Error Handling Cases
1. Close already-closed meeting (force via API/dev tools).
- Expected: destructive error toast with "Meeting is already closed".

2. Close missing/non-existent meeting id (force via API/dev tools).
- Expected: destructive error toast with "Meeting not found".

3. Schedule with invalid date payload (force via API/dev tools).
- Expected: destructive error toast with "Invalid meeting date".

4. Network interruption during list load.
- Expected: Active/Past tab content shows fetch error message.

5. Network interruption during close mutation.
- Expected: destructive toast with fallback failure message.

## Access Control Cases
1. DRC member opens convener history route directly.
- Expected: no convener controls rendered.

2. Scholar opens convener history route directly.
- Expected: blocked/unauthorized UI path.

3. Convener without employee profile attempts schedule.
- Expected: clear error that employee profile is missing.

## Regression Cases
1. Reviewer non-convener review workflow remains unchanged.
2. DRC meetings page for DRC member still lists meetings and PDF download works.
3. Chairman minutes workflow remains unaffected.

## Backend Automated Coverage Added
- `scheduleDrcMeeting` success path with normalized agenda points.
- `scheduleDrcMeeting` errors: active-meeting conflict, invalid date, missing convener employee profile.
- `listDrcMeetings` authorization and success path.
- `closeDrcMeeting` success path with minutes generation calls.
- `closeDrcMeeting` errors: meeting not found, already closed, non-convener access.
- Existing notification list/clear tests remain green.
