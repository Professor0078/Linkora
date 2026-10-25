# Linkora 3.0 Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **PII Isolation (`/users/{userId}`, `/paymentRequests/{requestId}`, `/leads/{leadId}`)**: User email, account metadata, manual payment receipts/transaction IDs, and visitor lead contact details (`visitorEmail`, `visitorPhone`, `message`) can only be read by the owning creator (`request.auth.uid == uid` / `profileUid`) or a verified `isAdmin()`. No blanket `isSignedIn()` reads or public reads are allowed.
2. **No Self-Assigned Privileges or Self-Verification**: Users registering `/users/{userId}` MUST set `plan == 'free'` and `status == 'active'`. Users can NEVER create or modify `/admins/{adminUid}`, approve their own `/paymentRequests/{requestId}`, upgrade their own `/subscriptions/{userId}` or `/users/{userId}.plan`, or set `isVerifiedCreator == true` on `/profiles/{userId}`. Only `isAdmin()` can toggle `isVerifiedCreator`.
3. **Verified Identity**: All authenticated owner/admin mutations require `request.auth.token.email_verified == true`. Bootstrapped admin email (`usman51225@gmail.com`) also requires `request.auth.token.email_verified == true`.
4. **Transactional Username Uniqueness**: Creating `/usernames/{username}` requires `getAfter(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.username == username`, ensuring 1-to-1 atomic sync with `/profiles/{userId}`.
5. **Plan-Based Backend Enforcement**: Free users (`users/{uid}.plan == 'free'`) cannot exceed `linkCount <= 10`, cannot select premium themes (`creator-neon`, `pink-aesthetic`, `glassmorphism`, `midnight-gold`, `sunset-studio`, `emerald-luxe`, `cyber-aurora`), and cannot set custom `seoTitle` or `seoDescription`.
6. **Atomic Link Counting**: Adding a link to `/profiles/{userId}/links/{linkId}` requires an atomic batch incrementing `/profiles/{userId}.linkCount` by `+1` and setting `lastModifiedLinkId == linkId` where the link did not exist before and exists after.
7. **Unpublished Draft Privacy**: `/profiles/{userId}` cannot be read by unauthenticated visitors unless `isPublished == true && accountStatus == 'active'`.
8. **Zero-Get List Queries**: Every `allow list` rule evaluates `resource.data` directly without `get()` or `exists()` calls to prevent $O(n)$ read cost explosions.
9. **Sanitized URLs, Tip Jar, Schedules & Media Bounds Only**: Every link `url`, `ctaUrl`, and `tipJarUrl` must match `^(https?://|mailto:|tel:).+` — `javascript:` or `data:` URLs are strictly rejected; optional `embedType` must be in `['none', 'youtube', 'spotify']`; optional `startsAt`/`expiresAt` are bounded to `<= 32` chars; optional `thumbnailUrl` must match `^(https://|data:image/|/src/assets/|/assets/).+` and stay within `120000` chars.
10. **Public Lead Capture Gatekeeping**: Creating `/leads/{leadId}` requires `status == 'new'`, `createdAt == request.time`, and target `/profiles/{profileUid}` to exist with `isPublished == true`, `accountStatus == 'active'`, and `leadCaptureEnabled == true`.
11. **Manual Payment Integrity & Terminal State Locking**: Payment methods (`/paymentMethods/{methodId}`) can only be created/modified/deleted by `isAdmin()`. Payment verification requests (`/paymentRequests/{requestId}`) must start in `status == 'pending'` with `adminNote == ''` referencing an active payment method, and can ONLY be transitioned (`approved` / `rejected`) by `isAdmin()`.

## 2. The "Dirty Dozen" Payloads

1. **Privilege Escalation on Signup**: Creating `/users/attacker1` with `{ plan: "premium", status: "active" }`.
2. **Unverified Admin Email Spoof**: Request with `auth.token.email == "usman51225@gmail.com"` and `email_verified == false` attempting to write `/admins/attacker2`.
3. **Cross-User PII Read**: Authenticated `userB` attempting `getDoc('/users/userA')`.
4. **Self-Granted Official Verified Badge**: Owner updating `/profiles/userA` with `{ isVerifiedCreator: true }`.
5. **JavaScript XSS Link Injection**: Owner creating `/profiles/userA/links/link1` with `{ url: "javascript:alert(document.cookie)" }`.
6. **Free Plan 11th Link Bypass**: Free user attempting to set `linkCount: 11` or create a link without incrementing `linkCount`.
7. **Free Plan Premium Theme Bypass**: Free user updating `/profiles/userA` with `{ themeId: "midnight-gold" }`.
8. **Username Hijack**: `userB` attempting to overwrite `/usernames/usman` already owned by `userA`.
9. **Unpublished Draft Scrape**: Unauthenticated visitor attempting `getDoc('/profiles/unpublishedUser')` where `isPublished == false`.
10. **Self-Approved Manual Payment Request**: Authenticated user attempting `updateDoc('/paymentRequests/req1', { status: "approved" })`.
11. **Unauthorized Fake Payment Method Injection**: Non-admin user attempting to create `/paymentMethods/pm_attacker`.
12. **Cross-Creator Lead Inbox Scraping**: Authenticated `userB` attempting `getDocs(collection(db, 'leads'))` without `where('profileUid', '==', auth.uid)`.
