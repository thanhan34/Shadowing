# WFD gamification — Phase 1

## Scope and compatibility

The existing practice scoring utility, audio player, filters, flashcards, export and report flow remain in place. Gamification adds authenticated API calls and does not prevent local scoring when the API is unavailable. Flashcards and Always Show Answer are not ranked practice.

Implemented: daily goal settings/progress, quality-based XP, streak/milestones, weekly leaderboard with personal row, deterministic ties, session rank comparison/snapshots, eight configurable achievements, immutable weekly challenges with admin UI, and an explicit session summary (also shown when switching to flashcards).

Deferred: personal records, heatmap, leagues, class battles and realtime activity feed. Leaderboards refresh every 60 seconds while visible, after a submission, or manually; they are not realtime. Closing the browser cannot display the session summary. Unsent attempts are queued in memory; leaving/reloading can lose this queue. A beforeunload warning is used while work is pending, but it is not durable offline storage. Navigation to another route is not intercepted.

## Routes

- Existing practice: `/writefromdictation`
- Achievements: `/wfd/achievements`
- Leaderboard: `/wfd/leaderboard`
- Admin challenge configuration: `/admin/wfd-challenges` (API requires the admin role, not just support)
- API: `/api/wfd/dashboard`, `/start`, `/submit`, `/goal`, `/snapshot`
- Admin API: `/api/admin/wfd-challenge`

## Policy decisions

- Time uses server clock, calendar dates in UTC+07:00 (`Asia/Ho_Chi_Minh`), and Monday week keys. No destructive weekly reset or scheduled job is needed.
- Default goal is 20. Settings accept 10/20/30/50 and take effect the following day. Today's goal is frozen before a setting change, even without an earlier attempt.
- One eligible attempt counts as one WFD practiced. Repeating the same question can count at most five times per calendar day. This is not a unique-question daily goal.
- Eligibility requires a server-created attempt ticket, nonempty normalized input, at least five seconds since ticket creation and the user's previous submission, a ticket age below two hours, and fewer than five rewarded attempts on that question today. The five-second threshold is a configurable initial heuristic, not proof of listening.
- Ineligible submissions are stored with their reason and zero XP; they do not advance goals, mastery, challenge progress or achievements. They count in the leaderboard attempts tie-breaker.
- Mastery is the first eligible 100% answer per question. Existing practice word scoring stays unchanged. Gamification accuracy divides matched words by the larger of reference length/input length, so adding unrelated words lowers bonus accuracy. This retains the existing word-matching semantics, not strict word-order matching.
- Streak increments only when a day's goal is completed. Missed days reset the displayed streak. Milestones are awarded once per account, not again after a reset. Only 7/14/30 award XP; all configured milestones celebrate.
- Comeback requires seven full inactive calendar days between eligible practice dates.
- Achievement XP rewards default to zero because no amounts were specified. Configuration includes `xpReward` for future changes. Badge unlock timestamps live in the profile's `unlocked` map.
- Weekly challenges are one per week and immutable after publication. Late publication counts only subsequent activity. `accuracy` means a target count of eligible answers meeting `minimumAccuracy`; `xp` counts practice XP only, excluding bonuses to avoid feedback loops. Challenge badges are separate from lifetime achievements.
- Ties: XP, average eligible-attempt accuracy, fewer total attempts, earlier timestamp at the current XP, then user ID for deterministic order. Rank snapshots are saved when continuing after a session summary. Session rank changes are observed movement, not proof that only this session caused the change.

## Data layout (all server-owned)

```
_wfd/users/profiles/{clerkUserId}
  tickets/{serverGeneratedUuid}
  attempts/{sameUuid}
  days/{yyyy-mm-dd}
  questions/{questionId}
  challenges/{mondayDate}
  ranks/{mondayDate}
_wfd/weeks/items/{mondayDate}/entries/{clerkUserId}
_wfd/challenges/items/{mondayDate}
```

Submission transaction reads the ticket, prior attempt, profile, reference question, daily and question progress, weekly entry and challenge. It writes attempt and rewards atomically. Duplicate attempt IDs return the stored outcome without writing again. Clients never supply trusted identity, time, score, XP or reward decisions. Daily goal and first mastery cannot double-award across tabs because their documents participate in the same transaction.

The dashboard currently sorts all entries in the active week to produce exact ranks and top ten plus the personal row. This favors correctness for an initial classroom rollout; it is O(active weekly students) in Firestore reads per refresh. Benchmark read cost/latency before expanding to a large audience; move to materialized rank snapshots/pagination at scale.

## Deployment checklist

1. Review/deploy `firestore.rules` **before exposing the feature**. `_wfd` is excluded from the existing broad approved-user/staff rule for reads and writes. Do not add a broader overlapping allow rule.
2. Configure the existing Firebase Admin credentials (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, or ADC) and existing Clerk settings on the server. Do not place service keys in client environment variables.
3. Confirm the Firebase project matches the existing WFD collection. No migration/backfill is performed; progress starts with new submissions. Historical client-only practice cannot be reconstructed reliably.
4. Test in a staging Firebase project with two approved students, an admin, a support user and a pending account. Verify access revocation, parallel submissions from two tabs, duplicate network retries, hidden questions, goal settings, week/day rollover, and direct `_wfd` client access denial.
5. Create a weekly challenge from the admin route. Verify reward once, including multi-tab completion, and visibility of its badge on the achievements page.
6. Test mobile/desktop WFD audio, navigation, filters, repeat, answer reveal, flashcards, export and reporting. Check modal keyboard focus/Escape and slow/offline network recovery.
7. Plan data retention for tickets/answer attempts and leaderboard name/avatar visibility. No TTL or scheduled cleanup is configured by this change.

## Security limits

The existing app downloads reference answers for practice. Therefore the new API prevents client-side XP forgery and replay but does **not** prevent a determined approved user/bot from reading answers and submitting them after the timing threshold. Tickets start at question selection, not verified audio completion. Add answer-isolated ranked mode, stronger abuse monitoring and infrastructure rate limits before attaching high-value rewards. Start-ticket creation has a per-account one-second throttle; dashboard/submit endpoints do not have infrastructure-wide rate limiting.

The server Admin SDK is privileged, so API authorization is essential in addition to Firestore rules. Existing `requireAccess` is used on every new endpoint; only admins may publish challenges.

## Validation commands

Run from the repository root:

```powershell
node scripts/test-wfd-gamification.cjs
node scripts/test-wfd-api.cjs
node scripts/test-access.cjs
node scripts/test-admin-navigation.cjs
node scripts/test-staff.cjs
npx tsc --noEmit --incremental false
$env:NEXT_BUILD_DIR='.next-wfd-check'; npm run build
```

The gamification service tests use an in-memory serialized transaction harness, not a Firestore emulator. They verify deterministic logic/read-before-write behavior and replay but do not certify real Firestore contention, deployed security rules or end-to-end Clerk authentication. Staging verification is required before declaring Phase 1 stable and beginning Phase 2.