# WFD notifications — Phase 1 deployment and limitations

## Implementation

Existing Firebase project, Clerk authorization/custom Firebase auth and Firebase Admin are reused. No new project or dependency. UI reuses existing Tailwind/global tokens and Card/Button/Input. Settings and a basic inbox are at `/settings/notifications`; mastery is at `/writefromdictation/mastery`; due practice is `/writefromdictation?mode=review`.

Permission is requested only by an Enable button. The custom dialog is offered after an eligible server-confirmed WFD submission, not on page entry. Prompt decisions persist server-side; dismissal defers 30 days and denial suppresses automatic prompts. Settings can retry after browser permission is manually unblocked.

## Data and security

```
_notifications/{clerkUid}                         # prompt state + nextEvaluationAt
  settings/preferences
  tokens/{sha256Token}                           # one per browser subscription
  delivery/state                                # transaction quota / high-water
  logs/{sha256DedupeKey}
_notificationTokenOwners/{sha256Token}            # single current account owner
_wfd/users/profiles/{clerkUid}/mastery/summary    # bounded question state map
```

All these collections are server-only. Existing broad Firestore read/write rules explicitly exclude notification collections. User APIs use requireAccess and derive identity from Clerk; users never choose a uid. Tokens, logs and secrets are not returned in settings. Ack endpoints accept only a small allowlist of event fields on the caller's logs. Deploy rules before exposing endpoints. Firestore Admin bypasses rules, so API authorization remains essential.

## Required production configuration

- Existing Firebase Admin credentials / ADC, matching `pteshadowing`.
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: Firebase Console → Cloud Messaging → Web Push certificates → public key. This is public, not an Admin secret.
- `WFD_NOTIFICATION_CRON_SECRET`: random server-only secret, at least 32 characters.
- HTTPS origin; service worker static asset and Google SDK imports must be allowed by deployment/CSP.
- External scheduler: POST `/api/cron/wfd-notifications` with `Authorization: Bearer <secret>` every 15 minutes. The exact route bypasses Clerk middleware and validates its own secret. No platform-specific cron is auto-deployed.
- Scheduler handles 25 eligible users per invocation. Monitor backlog and invoke more frequently / add workers before exceeding capacity. Overlapping workers reserve quota atomically, but may duplicate evaluation reads.

Queries use built-in single-field indexes: `_notifications.nextEvaluationAt`, per-user `tokens.enabled`, `logs.createdAt`, and existing `writefromdictation.isHidden`. No new composite index is required. Do not disable these single-field indexes. Exempt the large `questions` map in the mastery summary from indexing in Firebase Console to reduce index overhead; it is never queried by field.

The worker obtains public web config from its registration URL, sourced from the shared `lib/firebaseConfig.ts`; no Admin keys are placed in the worker. Firebase compat imports are pinned to the installed client SDK version 10.1.0.

## Mastery policy and scale

Correct = trusted server scoring 100%, with extra words penalized. First correct answer schedules +1 day; the next due success schedules +3 days; the following due success reaches Mastered and schedules +7 days, then +14/+30 days. Early correct repetitions do not advance/postpone review. Incorrect eligible answers reset Learning and +1 day. Existing XP rules remain unchanged; attempts not eligible for XP do not update mastery. Historical XP mastery is not migrated.

Summary stores at most 2,000 question states in one document, read once per evaluation. Current catalogue IDs are fetched once per scheduler batch and used to exclude hidden/deleted questions from both numerator and denominator. No per-user question-collection scan occurs. This is suitable for a bounded WFD set, NOT an unlimited catalogue design: shard/materialize counters before expanding. The UI exposes the capacity warning. The bucket helpers are unit-tested building blocks for a future materialized scheduler, not the current persistence path.

Due is exact nextReviewAt; overdue is at least 24 hours late. Retention label explicitly means the proportion of Mastered questions not overdue, not an empirically measured recall probability. Review mode snapshots due IDs at session start; it never falls back to all questions. Reload/re-enter to fetch a fresh due list.

## Delivery semantics

Default 1 push/day (configurable 1–2), at least 4 hours apart, quiet hours 22:00–07:00. Milestones count toward the cap. Review window starts 08:00 and ends at the configured goal reminder hour; goal/streak uses that hour onward. Quiet-hour candidates are reevaluated on the next scheduler run, rather than sent during quiet hours. Daily goals/streak continue to use the existing Vietnam calendar even if the delivery timezone changes.

Preference, daily quota, deterministic log ID, and milestone high-water are checked/reserved in one transaction. Only the highest newly attained milestone is selected; lower milestones are subsumed to avoid a burst. The reservation consumes quota even on failure. `reserved`, `sent`, `failed`, `unknown`, and `skipped` are operational log states; click/read are separate timestamps and never erase delivery status.

FCM and Firestore cannot share a transaction. A crash after reservation can lose a send; a timeout can have unknown delivery outcome. No automatic retry is made for ambiguous outcomes: this is intentionally at-most-one send attempt, not guaranteed exactly-once delivery. `sent` means FCM accepted at least one device, not proof of display. Monitor old reserved/unknown logs. Failed milestone reservations are also not automatically retried; operator review is required.

Tokens older than 90 days are disabled. Invalid-registration and unregistered-token errors disable the affected token only. Other failures are logged, not treated as invalid tokens. Token refreshed on supported browser visits/visibility. There is a maximum of 20 active tokens/account. Re-registration transfers ownership from a previous account; sign-out attempts to delete the browser subscription. An already accepted notification cannot be recalled after logout/preferences change; content includes no email/phone/score reports. Browser, OS and power-saving policies affect delivery; fully quitting the browser/OS is not guaranteed to receive push.

Foreground uses a banner, background uses data messages and the worker. Click routes accept only same-origin WFD paths and focus/navigate an existing window when available. Clicks and dismissals are best-effort acknowledgements; expired auth/offline can prevent them. Practice attribution records the first eligible submitted answer within 30 minutes, not audio playback/session-open. Full analytics, trainer digests and advanced notification types remain Phase 2. The navigation bell has no unread-count polling yet.

## Validation / staging gate

```
node scripts/test-wfd-notifications.cjs
node scripts/test-wfd-gamification.cjs
node scripts/test-wfd-api.cjs
npx tsc --noEmit --incremental false
npm run build
```

Local tests do not certify real Firestore transaction contention, deployed rules, FCM delivery, browser permission, service worker lifecycle or mobile support. Before production verify two devices; switching accounts/sign-out; foreground and background; denied permission; a closed tab; click focus/routing; simultaneous cron runs; revoked approval; invalid token; quiet hours/timezone rollover; review completion immediately before cron; service worker upgrade; and keyboard/mobile UI. Do not mark all acceptance criteria complete until staging evidence exists.