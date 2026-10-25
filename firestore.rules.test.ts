/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies all 12 adversarial payloads from security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Privilege Escalation on Signup (plan: premium)',
    operation: 'create',
    path: '/users/attacker1',
    auth: { uid: 'attacker1', email: 'attacker@example.com', email_verified: true },
    payload: {
      uid: 'attacker1',
      email: 'attacker@example.com',
      displayName: 'Attacker',
      plan: 'premium',
      status: 'active',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    operation: 'create',
    path: '/admins/attacker2',
    auth: { uid: 'attacker2', email: 'usman51225@gmail.com', email_verified: false },
    payload: {
      uid: 'attacker2',
      email: 'usman51225@gmail.com',
      grantedBy: 'attacker2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read on /users/victimUid',
    operation: 'get',
    path: '/users/victimUid',
    auth: { uid: 'otherUser', email: 'other@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Ghost Field Update on /profiles/userA',
    operation: 'update',
    path: '/profiles/userA',
    auth: { uid: 'userA', email: 'usera@example.com', email_verified: true },
    payload: {
      displayName: 'Updated Name',
      verifiedBadge: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'JavaScript XSS Link URL Injection',
    operation: 'create',
    path: '/profiles/userA/links/link1',
    auth: { uid: 'userA', email: 'usera@example.com', email_verified: true },
    payload: {
      id: 'link1',
      uid: 'userA',
      title: 'Click Me',
      url: 'javascript:alert(1)',
      platform: 'custom',
      isSocialIcon: false,
      enabled: true,
      isProfilePublished: true,
      order: 0,
      clicks: 0,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Free Plan 11th Link Limit Bypass',
    operation: 'update',
    path: '/profiles/freeUser',
    auth: { uid: 'freeUser', email: 'free@example.com', email_verified: true },
    payload: {
      linkCount: 11,
      lastModifiedLinkId: 'link11',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Free Plan Premium Theme Bypass',
    operation: 'update',
    path: '/profiles/freeUser',
    auth: { uid: 'freeUser', email: 'free@example.com', email_verified: true },
    payload: {
      themeId: 'glassmorphism',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Username Hijack of Existing Reserved Slug',
    operation: 'update',
    path: '/usernames/usman',
    auth: { uid: 'hijacker', email: 'hijacker@example.com', email_verified: true },
    payload: {
      uid: 'hijacker',
      username: 'usman',
      isPublished: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unpublished Draft Scrape by Unauthenticated Visitor',
    operation: 'get',
    path: '/profiles/draftOwner',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Self-Approved Manual Payment Verification Bypass',
    operation: 'update',
    path: '/paymentRequests/pay_123',
    auth: { uid: 'userA', email: 'usera@example.com', email_verified: true },
    payload: {
      status: 'approved',
      adminNote: 'Self-approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unauthorized Payment Method Creation by Non-Admin',
    operation: 'create',
    path: '/paymentMethods/pm_fake',
    auth: { uid: 'attacker1', email: 'attacker@example.com', email_verified: true },
    payload: {
      id: 'pm_fake',
      providerName: 'JazzCash',
      accountTitle: 'Attacker Account',
      accountNumber: '03000000000',
      instructions: 'Send money here',
      isActive: true,
      order: 1,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unfiltered List Scraping of /paymentRequests',
    operation: 'list',
    path: '/paymentRequests',
    auth: { uid: 'curiousUser', email: 'curious@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
