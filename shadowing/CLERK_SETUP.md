# Clerk + admin approval

## Implemented

- Next.js 15.5 Pages Router, Clerk provider, sign-in/sign-up, profile controls.
- Home page is public. New users default to pending; protected requests check current Clerk private metadata on the server.
- `/pending-approval` shows access status. `/admin/students` allows administrators to approve/revoke students, with pagination.
- Student approval writes a server-owned Firestore `_access/{clerkUserId}` document. Firebase custom authentication connects existing browser Firestore/Storage calls to that identity.
- Firestore rules permit approved users to read content; only admins can write course content. Clients cannot read or modify `_access`.
- Revocation disables the Firestore access record first, so previously issued Firebase tokens no longer authorize data access after rules deployment. Already downloaded content cannot be recalled.
- Shared Read Aloud highlighting defaults remain read-only; personal edits now stay in local storage.

## Required configuration (do not commit secrets)

Clerk keys are configured locally. Add Firebase Admin credentials to `.env.local` and to the deployment environment:

- `FIREBASE_ADMIN_PROJECT_ID` = `pteshadowing`
- `FIREBASE_ADMIN_CLIENT_EMAIL` = service-account email
- `FIREBASE_ADMIN_PRIVATE_KEY` = service-account private key, with real newlines or escaped `\n`

Alternatively use Google Application Default Credentials (`GOOGLE_APPLICATION_CREDENTIALS` pointing to a private service-account file, or an attached service account in Google Cloud). The application intentionally does not import the existing serviceAccountKey.json file.

Ensure Firebase Authentication is initialized for this project. Never use NEXT_PUBLIC_ for service-account credentials.

## First administrator

1. Open the app and register your own account using the navigation.
2. In the correct Clerk development instance, open that user and edit **Private metadata**, merging `"role": "admin"` into the existing object.
3. Return to `/pending-approval`, refresh status, and open **Duyệt học viên**.
4. The first admin visit provisions its `_access` document using Firebase Admin credentials. No account is automatically promoted by email or signup order.
5. All subsequent student approvals/revocations should go through `/admin/students`, not manual Clerk metadata edits, so Firebase permissions stay synchronized.

To remove an administrator, revoke its `_access` document's `approved` and `admin` fields in Firebase and remove its Clerk private `role`. Admin role management is intentionally not exposed to students or this approval UI.

## Deploy rules before treating this as protected

### Support administrators

- Private metadata `role: "support"` grants student review and content-management access, but not role-management access.
- Admins can grant/remove this role from `/admin/students`. Removing support keeps approved student access; revoke that separately if needed.
- Support users cannot change roles, approve/revoke admins, or approve/revoke other support users.
- The staff-only navigation menu lists existing management pages; middleware and API authorization remain mandatory.
- Deploy BOTH updated Firebase rules before support users edit content. The `_access` record uses separate `admin` and `support` flags and cannot be edited by clients.
- Use the in-app role controls rather than changing Clerk metadata directly, so data permissions are updated too. Existing active requests can finish during a role change; Clerk/Firestore updates are not a cross-service transaction.
- Tests: `node scripts/test-staff.cjs`, plus the existing access, token and redirect test scripts. Firebase rules still require emulator/deployment verification.

Review and deploy the included firestore.rules and storage.rules to project pteshadowing using Firebase Console or Firebase CLI:

```powershell
firebase deploy --only firestore:rules,storage --project pteshadowing
```

Storage rules use Firestore access documents; enable the cross-service permission when Firebase asks. These rules have NOT been deployed by this implementation. Existing deployed public rules remain public until replaced. Configure credentials before deployment, otherwise approved users cannot load content.

Existing Firebase tokenized download URLs and third-party media URLs may remain shareable independently of web authentication. This change does not rotate existing download tokens or migrate every media player to authenticated streaming. Audit those URLs, revoke old tokens, and migrate protected assets to authenticated streaming before claiming strict media confidentiality.

Clerk doctor reports only a development instance. Configure a production instance and production keys before launching.

## Verification

- `npx tsc --noEmit --incremental false`
- `node scripts/test-access.cjs`
- `clerk doctor --mode agent`
- `npm run build`
- If OneDrive's old `.next` cache gives EINVAL/readlink, use `$env:NEXT_BUILD_DIR='.next-clerk-check'; npm run build` and start with the same variable.

Manual acceptance test with two separate accounts:
1. Signed out: home/login/signup work; protected pages redirect; APIs return 401.
2. New student: pending page only; APIs return 403; direct Firebase access denied.
3. Admin approves student: student can open practice and read Firebase data, but cannot edit course content or access admin APIs.
4. Admin revokes student with an existing open session: subsequent protected requests and direct Firebase reads are denied.
5. Student cannot change approvals through public/unsafe metadata or cross-origin form submissions.

The signed-in approval/revocation flow and deployed Firebase rules still require live verification with your test accounts and credentials.