import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AdminRecord,
  AnalyticsDailyRecord,
  AvailabilityStatus,
  BioLink,
  FaqRecord,
  LeadRecord,
  LeadStatus,
  LinkEmbedType,
  LinkEventRecord,
  LinkPlatform,
  PaymentMethodRecord,
  PaymentRequestRecord,
  PaymentRequestStatus,
  PlanTier,
  PlatformSettingsRecord,
  ProfileConfig,
  ReportReason,
  ReportRecord,
  ReportStatus,
  SubscriptionRecord,
  SupportCategory,
  SupportStatus,
  SupportTicketRecord,
  UserAccount,
  UsernameRecord,
} from '../types/linkora';
import {
  generateSafeId,
  normalizeAndValidateUrl,
  normalizeUsername,
  sanitizeHexColor,
  sanitizePlainText,
  sanitizeScheduleDatetime,
  validateBasicEmail,
  validateUsername,
} from './validation';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsRecord = {
  heroHeadline: 'All Your Links. One Beautiful Page.',
  heroSubheadline:
    'Linkora 3.0 gives creators, freelancers, founders, and online sellers a fast, light-and-dark adaptive bio page with scheduled links, inline media players, digital vCards, lead capture, and privacy-first analytics.',
  freeMaxLinks: 10,
  premiumMaxLinks: 50,
  premiumPriceMonthly: 9,
  disabledThemes: [],
};

export const DEFAULT_FAQS: FaqRecord[] = [
  {
    id: 'faq_1',
    question: 'Is Linkora really free to use?',
    answer:
      'Yes. Every account starts on the Free plan, which includes one custom public URL, up to 10 active destination links, 7 built-in themes, digital vCard downloads, visitor lead capture, QR code sharing, and visit/click analytics.',
    order: 1,
    isPublished: true,
  },
  {
    id: 'faq_2',
    question: 'Can I reserve my own unique public username?',
    answer:
      'Yes. When you create your account or edit your profile, Linkora reserves your lowercase username slug transactionally so no two accounts can ever share the same URL.',
    order: 2,
    isPublished: true,
  },
  {
    id: 'faq_3',
    question: 'What types of links and cards can I add to my page?',
    answer:
      'You can add websites, portfolios, YouTube channels, Instagram, TikTok, LinkedIn, X, GitHub, online shops with price tags, thumbnails, spotlight cards, direct WhatsApp message links, email (mailto:), telephone (tel:) buttons, a downloadable vCard, and an inquiry form.',
    order: 3,
    isPublished: true,
  },
  {
    id: 'faq_4',
    question: 'How does Linkora handle visitor privacy in analytics?',
    answer:
      'Linkora records aggregated page views and link clicks along with coarse device categories (mobile, tablet, desktop) and referrer hostnames—without storing visitor IP addresses, cookies, or personal identifiers.',
    order: 4,
    isPublished: true,
  },
  {
    id: 'faq_5',
    question: 'Can I unpublish my bio page temporarily?',
    answer:
      'Yes. You can switch your page between Published and Unpublished at any time from your dashboard. While unpublished, your username remains reserved for your account, and visitors see a polite unavailable notice.',
    order: 5,
    isPublished: true,
  },
];

function sanitizeImageDataOrHttpsUrl(raw: string, maxLength: number): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('/assets/')
  ) {
    return trimmed.slice(0, maxLength);
  }
  return '';
}

export async function checkUsernameAvailable(
  rawSlug: string,
  currentUid?: string
): Promise<{ available: boolean; reason?: string }> {
  const slug = normalizeUsername(rawSlug);
  const check = validateUsername(slug);
  if (!check.valid) {
    return { available: false, reason: check.error };
  }

  const path = `usernames/${slug}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', slug));
    if (!snap.exists()) {
      return { available: true };
    }
    const data = snap.data() as UsernameRecord;
    if (currentUid && data.uid === currentUid) {
      return { available: true };
    }
    return { available: false, reason: `@${slug} is already taken.` };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

async function findAvailableInitialUsername(baseHint: string, uid: string): Promise<string> {
  let base = normalizeUsername(baseHint.split('@')[0] || 'creator');
  if (base.length < 3 || !validateUsername(base).valid) {
    base = `user_${uid.slice(0, 6).toLowerCase()}`;
  }
  const firstCheck = await checkUsernameAvailable(base, uid);
  if (firstCheck.available) return base;

  for (let i = 0; i < 6; i++) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const candidate = `${base.slice(0, 24)}_${suffix}`;
    const check = await checkUsernameAvailable(candidate, uid);
    if (check.available) return candidate;
  }
  return `u_${uid.slice(0, 12).toLowerCase()}`;
}

export async function ensureUserAccountAndProfile(firebaseUser: FirebaseUser): Promise<{
  account: UserAccount;
  profile: ProfileConfig;
  subscription: SubscriptionRecord;
  isAdmin: boolean;
}> {
  const uid = firebaseUser.uid;
  const email = (firebaseUser.email || '').trim();
  const displayName = sanitizePlainText(
    firebaseUser.displayName || email.split('@')[0] || 'Creator',
    80
  );

  let userSnap;
  try {
    userSnap = await getDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  if (!userSnap.exists()) {
    const username = await findAvailableInitialUsername(displayName || email, uid);
    const batch = writeBatch(db);

    const newUser = {
      uid,
      email,
      displayName: displayName || 'Creator',
      plan: 'free' as PlanTier,
      status: 'active' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newSub = {
      uid,
      plan: 'free' as PlanTier,
      status: 'active' as const,
      provider: 'system' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newProfile = {
      uid,
      username,
      displayName: displayName || 'Creator',
      bio: 'Welcome to my official Linkora page.',
      avatarUrl:
        firebaseUser.photoURL && firebaseUser.photoURL.startsWith('https://')
          ? firebaseUser.photoURL.slice(0, 2000)
          : '',
      backgroundImageUrl: '',
      themeId: 'minimal-white' as const,
      customBgColor: '',
      customBgGradient: '',
      customButtonColor: '',
      customTextColor: '',
      buttonShape: 'rounded' as const,
      buttonStyle: 'solid' as const,
      fontFamily: 'jakarta' as const,
      avatarShape: 'circle' as const,
      layoutWidth: 'standard' as const,
      ctaLabel: '',
      ctaUrl: '',
      seoTitle: '',
      seoDescription: '',
      headline: '',
      location: '',
      announcementText: '',
      isVerifiedCreator: false,
      vcardEnabled: false,
      vcardEmail: '',
      vcardPhone: '',
      leadCaptureEnabled: false,
      leadCaptureTitle: 'Send me a message',
      visitorThemeSwitchEnabled: true,
      availabilityStatus: 'none' as AvailabilityStatus,
      availabilityText: '',
      tipJarEnabled: false,
      tipJarLabel: 'Support my work',
      tipJarUrl: '',
      isPublished: true,
      accountStatus: 'active' as const,
      linkCount: 0,
      lastModifiedLinkId: '',
      totalViews: 0,
      totalClicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newUsername = {
      uid,
      username,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    batch.set(doc(db, 'users', uid), newUser);
    batch.set(doc(db, 'subscriptions', uid), newSub);
    batch.set(doc(db, 'profiles', uid), newProfile);
    batch.set(doc(db, 'usernames', username), newUsername);

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  }

  let finalUserSnap;
  let finalProfileSnap;
  let finalSubSnap;
  let adminSnap;

  try {
    [finalUserSnap, finalProfileSnap, finalSubSnap, adminSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'profiles', uid)),
      getDoc(doc(db, 'subscriptions', uid)),
      getDoc(doc(db, 'admins', uid)),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `profiles/${uid}`);
  }

  const account = finalUserSnap.data() as UserAccount;
  const profile = finalProfileSnap.data() as ProfileConfig;
  const subscription: SubscriptionRecord = finalSubSnap.exists()
    ? (finalSubSnap.data() as SubscriptionRecord)
    : {
        uid,
        plan: account.plan,
        status: 'active',
        provider: 'system',
      };

  const isBootstrappedAdmin =
    Boolean(firebaseUser.emailVerified) &&
    firebaseUser.email?.toLowerCase() === 'usman51225@gmail.com';
  const isAdmin = isBootstrappedAdmin || (Boolean(firebaseUser.emailVerified) && adminSnap.exists());

  return { account, profile, subscription, isAdmin };
}

export async function fetchOwnerLinks(uid: string): Promise<BioLink[]> {
  const path = `profiles/${uid}/links`;
  try {
    const q = query(collection(db, 'profiles', uid, 'links'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as BioLink)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface ProfileUpdateInput {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  backgroundImageUrl: string;
  themeId: ProfileConfig['themeId'];
  customBgColor: string;
  customBgGradient: string;
  customButtonColor: string;
  customTextColor: string;
  buttonShape: ProfileConfig['buttonShape'];
  buttonStyle: ProfileConfig['buttonStyle'];
  fontFamily: ProfileConfig['fontFamily'];
  avatarShape: ProfileConfig['avatarShape'];
  layoutWidth: ProfileConfig['layoutWidth'];
  ctaLabel: string;
  ctaUrl: string;
  seoTitle: string;
  seoDescription: string;
  headline?: string;
  location?: string;
  announcementText?: string;
  vcardEnabled?: boolean;
  vcardEmail?: string;
  vcardPhone?: string;
  leadCaptureEnabled?: boolean;
  leadCaptureTitle?: string;
  visitorThemeSwitchEnabled?: boolean;
  availabilityStatus?: AvailabilityStatus;
  availabilityText?: string;
  tipJarEnabled?: boolean;
  tipJarLabel?: string;
  tipJarUrl?: string;
  isPublished: boolean;
}

export async function saveProfileChanges(
  uid: string,
  currentProfile: ProfileConfig,
  input: ProfileUpdateInput,
  ownerLinks: BioLink[],
  plan: PlanTier
): Promise<void> {
  const nextUsername = normalizeUsername(input.username);
  const slugValidation = validateUsername(nextUsername);
  if (!slugValidation.valid) {
    throw new Error(slugValidation.error);
  }

  if (nextUsername !== currentProfile.username) {
    const availability = await checkUsernameAvailable(nextUsername, uid);
    if (!availability.available) {
      throw new Error(availability.reason || 'That username is already in use.');
    }
  }

  let cleanCtaUrl = '';
  const cleanCtaLabel = sanitizePlainText(input.ctaLabel.trim(), 60);
  if (input.ctaUrl.trim()) {
    const urlCheck = normalizeAndValidateUrl(input.ctaUrl.trim(), 'custom');
    if (!urlCheck.valid) {
      throw new Error(`CTA Button URL: ${urlCheck.error}`);
    }
    cleanCtaUrl = urlCheck.url.slice(0, 500);
  }

  const rawVcardEmail = sanitizePlainText((input.vcardEmail || '').trim(), 160);
  if (rawVcardEmail && !validateBasicEmail(rawVcardEmail)) {
    throw new Error('vCard Contact Email: Please enter a valid email address.');
  }

  let cleanTipJarUrl = '';
  const cleanTipJarLabel = sanitizePlainText((input.tipJarLabel || '').trim(), 60);
  if (input.tipJarUrl && input.tipJarUrl.trim()) {
    const tipCheck = normalizeAndValidateUrl(input.tipJarUrl.trim(), 'custom');
    if (!tipCheck.valid) {
      throw new Error(`Support / Tip Jar URL: ${tipCheck.error}`);
    }
    cleanTipJarUrl = tipCheck.url.slice(0, 500);
  }

  const allowedAvailability: AvailabilityStatus[] = ['none', 'available', 'booking', 'busy'];
  const cleanAvailabilityStatus: AvailabilityStatus =
    input.availabilityStatus && allowedAvailability.includes(input.availabilityStatus)
      ? input.availabilityStatus
      : 'none';

  const batch = writeBatch(db);

  if (nextUsername !== currentProfile.username) {
    batch.delete(doc(db, 'usernames', currentProfile.username));
    batch.set(doc(db, 'usernames', nextUsername), {
      uid,
      username: nextUsername,
      isPublished: input.isPublished,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else if (input.isPublished !== currentProfile.isPublished) {
    batch.update(doc(db, 'usernames', currentProfile.username), {
      isPublished: input.isPublished,
      updatedAt: serverTimestamp(),
    });
  }

  if (input.isPublished !== currentProfile.isPublished) {
    for (const link of ownerLinks) {
      batch.update(doc(db, 'profiles', uid, 'links', link.id), {
        isProfilePublished: input.isPublished,
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Note: Never include `isVerifiedCreator` here—owners cannot write that admin-controlled field.
  const profilePayload = {
    username: nextUsername,
    displayName: sanitizePlainText(input.displayName.trim() || 'Creator', 80),
    bio: sanitizePlainText(input.bio, 280),
    avatarUrl: sanitizeImageDataOrHttpsUrl(input.avatarUrl, 150000),
    backgroundImageUrl: sanitizeImageDataOrHttpsUrl(input.backgroundImageUrl, 200000),
    themeId: input.themeId,
    customBgColor: sanitizeHexColor(input.customBgColor),
    customBgGradient: sanitizePlainText(input.customBgGradient, 160),
    customButtonColor: sanitizeHexColor(input.customButtonColor),
    customTextColor: sanitizeHexColor(input.customTextColor),
    buttonShape: input.buttonShape,
    buttonStyle: input.buttonStyle,
    fontFamily: input.fontFamily,
    avatarShape: input.avatarShape,
    layoutWidth: input.layoutWidth,
    ctaLabel: cleanCtaLabel,
    ctaUrl: cleanCtaUrl,
    seoTitle: plan === 'premium' ? sanitizePlainText(input.seoTitle, 70) : '',
    seoDescription: plan === 'premium' ? sanitizePlainText(input.seoDescription, 160) : '',
    headline: sanitizePlainText((input.headline || '').trim(), 100),
    location: sanitizePlainText((input.location || '').trim(), 60),
    announcementText: sanitizePlainText((input.announcementText || '').trim(), 140),
    vcardEnabled: Boolean(input.vcardEnabled),
    vcardEmail: rawVcardEmail,
    vcardPhone: sanitizePlainText((input.vcardPhone || '').trim(), 40),
    leadCaptureEnabled: Boolean(input.leadCaptureEnabled),
    leadCaptureTitle: sanitizePlainText((input.leadCaptureTitle || '').trim(), 80),
    visitorThemeSwitchEnabled:
      input.visitorThemeSwitchEnabled === undefined ? true : Boolean(input.visitorThemeSwitchEnabled),
    availabilityStatus: cleanAvailabilityStatus,
    availabilityText: sanitizePlainText((input.availabilityText || '').trim(), 90),
    tipJarEnabled: Boolean(input.tipJarEnabled),
    tipJarLabel: cleanTipJarLabel,
    tipJarUrl: cleanTipJarUrl,
    isPublished: input.isPublished,
    updatedAt: serverTimestamp(),
  };

  batch.update(doc(db, 'profiles', uid), profilePayload);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}`);
  }
}

export async function addBioLink(
  uid: string,
  currentProfile: ProfileConfig,
  plan: PlanTier,
  input: {
    title: string;
    url: string;
    platform: LinkPlatform;
    isSocialIcon: boolean;
    subtitle?: string;
    badgeText?: string;
    priceLabel?: string;
    sectionTitle?: string;
    thumbnailUrl?: string;
    isFeatured?: boolean;
    embedType?: LinkEmbedType;
    startsAt?: string;
    expiresAt?: string;
    isPinned?: boolean;
    order: number;
  }
): Promise<string> {
  const maxLinks = plan === 'premium' ? 50 : 10;
  if (currentProfile.linkCount >= maxLinks) {
    throw new Error(
      plan === 'free'
        ? 'Free plan supports up to 10 links. Remove a link or upgrade to Premium for up to 50 links.'
        : 'Maximum link limit (50) reached.'
    );
  }

  const cleanTitle = sanitizePlainText(input.title.trim(), 100);
  if (!cleanTitle) {
    throw new Error('Link title is required.');
  }

  const urlCheck = normalizeAndValidateUrl(input.url, input.platform);
  if (!urlCheck.valid) {
    throw new Error(urlCheck.error);
  }

  const allowedEmbeds: LinkEmbedType[] = ['none', 'youtube', 'spotify'];
  const cleanEmbedType: LinkEmbedType =
    input.embedType && allowedEmbeds.includes(input.embedType) ? input.embedType : 'none';
  const cleanStartsAt = sanitizeScheduleDatetime(input.startsAt);
  const cleanExpiresAt = sanitizeScheduleDatetime(input.expiresAt);
  if (cleanStartsAt && cleanExpiresAt && Date.parse(cleanExpiresAt) <= Date.parse(cleanStartsAt)) {
    throw new Error('Link expiration date must be after the scheduled start date.');
  }

  const linkId = generateSafeId('lnk');
  const batch = writeBatch(db);

  batch.set(doc(db, 'profiles', uid, 'links', linkId), {
    id: linkId,
    uid,
    title: cleanTitle,
    url: urlCheck.url,
    platform: input.platform,
    isSocialIcon: input.isSocialIcon,
    subtitle: sanitizePlainText((input.subtitle || '').trim(), 140),
    badgeText: sanitizePlainText((input.badgeText || '').trim(), 24),
    priceLabel: sanitizePlainText((input.priceLabel || '').trim(), 24),
    sectionTitle: sanitizePlainText((input.sectionTitle || '').trim(), 60),
    thumbnailUrl: sanitizeImageDataOrHttpsUrl(input.thumbnailUrl || '', 120000),
    isFeatured: Boolean(input.isFeatured),
    embedType: cleanEmbedType,
    startsAt: cleanStartsAt,
    expiresAt: cleanExpiresAt,
    isPinned: Boolean(input.isPinned),
    enabled: true,
    isProfilePublished: currentProfile.isPublished,
    order: Math.max(0, Math.min(1000, input.order)),
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'profiles', uid), {
    linkCount: currentProfile.linkCount + 1,
    lastModifiedLinkId: linkId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return linkId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `profiles/${uid}/links/${linkId}`);
  }
}

export async function duplicateBioLink(
  uid: string,
  currentProfile: ProfileConfig,
  plan: PlanTier,
  source: BioLink,
  nextOrder: number
): Promise<string> {
  return addBioLink(uid, currentProfile, plan, {
    title: sanitizePlainText(`${source.title} (Copy)`, 100),
    url: source.url,
    platform: source.platform,
    isSocialIcon: source.isSocialIcon,
    subtitle: source.subtitle || '',
    badgeText: source.badgeText || '',
    priceLabel: source.priceLabel || '',
    sectionTitle: source.sectionTitle || '',
    thumbnailUrl: source.thumbnailUrl || '',
    isFeatured: Boolean(source.isFeatured),
    embedType: source.embedType || 'none',
    startsAt: source.startsAt || '',
    expiresAt: source.expiresAt || '',
    isPinned: Boolean(source.isPinned),
    order: nextOrder,
  });
}

export async function updateBioLink(
  uid: string,
  linkId: string,
  updates: {
    title?: string;
    url?: string;
    platform?: LinkPlatform;
    isSocialIcon?: boolean;
    subtitle?: string;
    badgeText?: string;
    priceLabel?: string;
    sectionTitle?: string;
    thumbnailUrl?: string;
    isFeatured?: boolean;
    embedType?: LinkEmbedType;
    startsAt?: string;
    expiresAt?: string;
    isPinned?: boolean;
    enabled?: boolean;
    order?: number;
  }
): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) {
    const clean = sanitizePlainText(updates.title.trim(), 100);
    if (!clean) throw new Error('Link title cannot be empty.');
    payload.title = clean;
  }

  if (updates.platform !== undefined) {
    payload.platform = updates.platform;
  }

  if (updates.url !== undefined) {
    const check = normalizeAndValidateUrl(updates.url, updates.platform);
    if (!check.valid) throw new Error(check.error);
    payload.url = check.url;
  }

  if (updates.isSocialIcon !== undefined) {
    payload.isSocialIcon = updates.isSocialIcon;
  }

  if (updates.subtitle !== undefined) {
    payload.subtitle = sanitizePlainText(updates.subtitle.trim(), 140);
  }

  if (updates.badgeText !== undefined) {
    payload.badgeText = sanitizePlainText(updates.badgeText.trim(), 24);
  }

  if (updates.priceLabel !== undefined) {
    payload.priceLabel = sanitizePlainText(updates.priceLabel.trim(), 24);
  }

  if (updates.sectionTitle !== undefined) {
    payload.sectionTitle = sanitizePlainText(updates.sectionTitle.trim(), 60);
  }

  if (updates.thumbnailUrl !== undefined) {
    payload.thumbnailUrl = sanitizeImageDataOrHttpsUrl(updates.thumbnailUrl, 120000);
  }

  if (updates.isFeatured !== undefined) {
    payload.isFeatured = Boolean(updates.isFeatured);
  }

  if (updates.embedType !== undefined) {
    const allowedEmbeds: LinkEmbedType[] = ['none', 'youtube', 'spotify'];
    payload.embedType = allowedEmbeds.includes(updates.embedType) ? updates.embedType : 'none';
  }

  if (updates.startsAt !== undefined) {
    payload.startsAt = sanitizeScheduleDatetime(updates.startsAt);
  }

  if (updates.expiresAt !== undefined) {
    payload.expiresAt = sanitizeScheduleDatetime(updates.expiresAt);
  }

  if (
    typeof payload.startsAt === 'string' &&
    typeof payload.expiresAt === 'string' &&
    payload.startsAt &&
    payload.expiresAt &&
    Date.parse(payload.expiresAt) <= Date.parse(payload.startsAt)
  ) {
    throw new Error('Link expiration date must be after the scheduled start date.');
  }

  if (updates.isPinned !== undefined) {
    payload.isPinned = Boolean(updates.isPinned);
  }

  if (updates.enabled !== undefined) {
    payload.enabled = updates.enabled;
  }

  if (updates.order !== undefined) {
    payload.order = Math.max(0, Math.min(1000, updates.order));
  }

  const path = `profiles/${uid}/links/${linkId}`;
  try {
    await updateDoc(doc(db, 'profiles', uid, 'links', linkId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function bulkSetBioLinksEnabled(
  uid: string,
  links: BioLink[],
  enabled: boolean
): Promise<void> {
  const targets = links.filter((l) => l.enabled !== enabled);
  if (targets.length === 0) return;

  const batch = writeBatch(db);
  for (const lnk of targets) {
    batch.update(doc(db, 'profiles', uid, 'links', lnk.id), {
      enabled,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}/links`);
  }
}

export async function reorderBioLinks(uid: string, orderedLinks: BioLink[]): Promise<void> {
  const batch = writeBatch(db);
  orderedLinks.forEach((lnk, idx) => {
    batch.update(doc(db, 'profiles', uid, 'links', lnk.id), {
      order: idx,
      updatedAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}/links`);
  }
}

export async function deleteBioLink(
  uid: string,
  currentProfile: ProfileConfig,
  linkId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'profiles', uid, 'links', linkId));
  batch.update(doc(db, 'profiles', uid), {
    linkCount: Math.max(0, currentProfile.linkCount - 1),
    lastModifiedLinkId: linkId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `profiles/${uid}/links/${linkId}`);
  }
}

export async function updateAccountDisplayName(uid: string, displayName: string): Promise<void> {
  const clean = sanitizePlainText(displayName.trim(), 80);
  if (!clean) throw new Error('Display name is required.');
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// ============================================================================
// Visitor Lead Capture & Creator Audience Inbox (/leads)
// ============================================================================

export async function submitPublicLead(
  profileUid: string,
  input: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone?: string;
    message?: string;
  }
): Promise<void> {
  const throttleKey = `linkora_lead_${profileUid}`;
  try {
    if (typeof localStorage !== 'undefined') {
      const prev = localStorage.getItem(throttleKey);
      if (prev && Date.now() - Number(prev) < 60_000) {
        throw new Error('Your message was just sent. Please wait a minute before sending another.');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('just sent')) throw e;
  }

  const cleanName = sanitizePlainText(input.visitorName.trim(), 80);
  const cleanEmail = sanitizePlainText(input.visitorEmail.trim(), 254);
  const cleanPhone = sanitizePlainText((input.visitorPhone || '').trim(), 40);
  const cleanMessage = sanitizePlainText((input.message || '').trim(), 500);

  if (cleanName.length < 2) {
    throw new Error('Please enter your name (at least 2 characters).');
  }
  if (!validateBasicEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const leadId = generateSafeId('lead');
  try {
    await setDoc(doc(db, 'leads', leadId), {
      id: leadId,
      profileUid,
      visitorName: cleanName,
      visitorEmail: cleanEmail,
      visitorPhone: cleanPhone,
      message: cleanMessage,
      status: 'new' as LeadStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(throttleKey, String(Date.now()));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `leads/${leadId}`);
  }
}

export async function fetchOwnerLeads(uid: string): Promise<LeadRecord[]> {
  try {
    const q = query(collection(db, 'leads'), where('profileUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as LeadRecord)
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leads');
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'leads', leadId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
  }
}

export async function deleteLead(leadId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'leads', leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `leads/${leadId}`);
  }
}

// ============================================================================
// Public Profile Loading & Privacy-Conscious Event Tracking
// ============================================================================

export type PublicPageResult =
  | { status: 'not_found' }
  | { status: 'unpublished'; username: string }
  | { status: 'published'; profile: ProfileConfig; links: BioLink[] };

export async function fetchPublicProfileByUsername(rawSlug: string): Promise<PublicPageResult> {
  const slug = normalizeUsername(rawSlug);
  if (!validateUsername(slug).valid) {
    return { status: 'not_found' };
  }

  let usernameSnap;
  try {
    usernameSnap = await getDoc(doc(db, 'usernames', slug));
  } catch {
    return { status: 'not_found' };
  }

  if (!usernameSnap.exists()) {
    return { status: 'not_found' };
  }

  const usernameData = usernameSnap.data() as UsernameRecord;
  if (!usernameData.isPublished) {
    return { status: 'unpublished', username: slug };
  }

  try {
    const profileSnap = await getDoc(doc(db, 'profiles', usernameData.uid));
    if (!profileSnap.exists()) {
      return { status: 'not_found' };
    }
    const profile = profileSnap.data() as ProfileConfig;
    if (!profile.isPublished || profile.accountStatus !== 'active') {
      return { status: 'unpublished', username: slug };
    }

    const linksQuery = query(
      collection(db, 'profiles', usernameData.uid, 'links'),
      where('isProfilePublished', '==', true),
      where('enabled', '==', true)
    );
    const linksSnap = await getDocs(linksQuery);
    const links = linksSnap.docs
      .map((d) => d.data() as BioLink)
      .sort((a, b) => a.order - b.order);

    return { status: 'published', profile, links };
  } catch {
    return { status: 'unpublished', username: slug };
  }
}

function detectCoarseDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getSafeReferrerHost(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const url = new URL(document.referrer);
    if (typeof window !== 'undefined' && url.hostname === window.location.hostname) {
      return 'direct';
    }
    return sanitizePlainText(url.hostname, 120) || 'direct';
  } catch {
    return 'direct';
  }
}

export async function recordPublicInteraction(
  profileUid: string,
  eventType: 'view' | 'click',
  link?: { id: string; title: string; isCta?: boolean }
): Promise<void> {
  // Session-level deduplication to prevent simple accidental refresh/double-click inflation
  const dedupeKey = `linkora_evt_${profileUid}_${eventType}_${link?.id || 'page'}`;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const prev = sessionStorage.getItem(dedupeKey);
      if (prev && Date.now() - Number(prev) < 60_000) {
        return;
      }
      sessionStorage.setItem(dedupeKey, String(Date.now()));
    }
  } catch {
    // Ignore storage errors in strict privacy browsers
  }

  const eventId = generateSafeId('evt');
  const dateKey = new Date().toISOString().slice(0, 10);
  const statId = `${profileUid}_${dateKey}`;

  const batch = writeBatch(db);

  batch.set(doc(db, 'linkEvents', eventId), {
    profileUid,
    eventType,
    linkId: link?.id ? sanitizePlainText(link.id, 128) : '',
    linkTitle: link?.title ? sanitizePlainText(link.title, 100) : '',
    deviceType: detectCoarseDeviceType(),
    referrerHost: getSafeReferrerHost(),
    dateKey,
    createdAt: serverTimestamp(),
  });

  batch.set(
    doc(db, 'analyticsDaily', statId),
    {
      profileUid,
      dateKey,
      views: increment(eventType === 'view' ? 1 : 0),
      clicks: increment(eventType === 'click' ? 1 : 0),
      lastEventId: eventId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  batch.update(
    doc(db, 'profiles', profileUid),
    eventType === 'view' ? { totalViews: increment(1) } : { totalClicks: increment(1) }
  );

  if (eventType === 'click' && link?.id && !link.isCta) {
    batch.update(doc(db, 'profiles', profileUid, 'links', link.id), {
      clicks: increment(1),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    // Non-blocking for public visitors so navigation is never disrupted
    console.warn('Analytics event skipped:', err);
  }
}

export async function fetchUserAnalytics(uid: string): Promise<{
  daily: AnalyticsDailyRecord[];
  recentEvents: LinkEventRecord[];
}> {
  try {
    const [dailySnap, eventsSnap] = await Promise.all([
      getDocs(query(collection(db, 'analyticsDaily'), where('profileUid', '==', uid))),
      getDocs(query(collection(db, 'linkEvents'), where('profileUid', '==', uid), limit(300))),
    ]);

    const daily = dailySnap.docs
      .map((d) => d.data() as AnalyticsDailyRecord)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const recentEvents = eventsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as LinkEventRecord) }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });

    return { daily, recentEvents };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'analyticsDaily');
  }
}

// ============================================================================
// Support Tickets & Public Abuse Reports
// ============================================================================

export async function submitSupportTicket(
  uid: string,
  email: string,
  input: { category: SupportCategory; subject: string; message: string }
): Promise<void> {
  const subject = sanitizePlainText(input.subject.trim(), 120);
  const message = sanitizePlainText(input.message.trim(), 2000);
  if (subject.length < 3) throw new Error('Subject must be at least 3 characters.');
  if (message.length < 10) throw new Error('Please describe your question in at least 10 characters.');

  const ticketId = generateSafeId('tkt');
  try {
    await setDoc(doc(db, 'supportTickets', ticketId), {
      uid,
      email,
      category: input.category,
      subject,
      message,
      status: 'open',
      adminReply: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `supportTickets/${ticketId}`);
  }
}

export async function fetchUserSupportTickets(uid: string): Promise<SupportTicketRecord[]> {
  try {
    const q = query(collection(db, 'supportTickets'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicketRecord, 'id'>) }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'supportTickets');
  }
}

export async function submitProfileReport(input: {
  reportedUid: string;
  reportedUsername: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  const throttleKey = `linkora_rpt_${input.reportedUid}`;
  try {
    if (typeof localStorage !== 'undefined') {
      const last = localStorage.getItem(throttleKey);
      if (last && Date.now() - Number(last) < 5 * 60_000) {
        throw new Error('You recently submitted a report for this profile. Thank you for helping keep Linkora safe.');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('recently submitted')) throw e;
  }

  const cleanDetails = sanitizePlainText(input.details.trim(), 500);
  if (cleanDetails.length < 5) {
    throw new Error('Please provide a brief description (at least 5 characters).');
  }

  const reportId = generateSafeId('rpt');
  try {
    await setDoc(doc(db, 'reports', reportId), {
      reportedUid: input.reportedUid,
      reportedUsername: normalizeUsername(input.reportedUsername),
      reason: input.reason,
      details: cleanDetails,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(throttleKey, String(Date.now()));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
  }
}

// ============================================================================
// Public Platform Settings & FAQs
// ============================================================================

export async function fetchPublicPlatformContent(): Promise<{
  settings: PlatformSettingsRecord;
  faqs: FaqRecord[];
}> {
  try {
    const [settingsSnap, faqsSnap] = await Promise.all([
      getDoc(doc(db, 'platformSettings', 'public')),
      getDocs(query(collection(db, 'faqs'), where('isPublished', '==', true))),
    ]);

    const settings = settingsSnap.exists()
      ? (settingsSnap.data() as PlatformSettingsRecord)
      : DEFAULT_PLATFORM_SETTINGS;

    const faqs =
      faqsSnap.docs.length > 0
        ? faqsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<FaqRecord, 'id'>) }))
            .sort((a, b) => a.order - b.order)
        : DEFAULT_FAQS;

    return { settings, faqs };
  } catch {
    return { settings: DEFAULT_PLATFORM_SETTINGS, faqs: DEFAULT_FAQS };
  }
}

// ============================================================================
// Manual Payment Methods & User Payment Verification Requests
// ============================================================================

export async function fetchActivePaymentMethods(): Promise<PaymentMethodRecord[]> {
  try {
    const q = query(collection(db, 'paymentMethods'), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PaymentMethodRecord)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'paymentMethods');
  }
}

export async function fetchUserPaymentRequests(uid: string): Promise<PaymentRequestRecord[]> {
  try {
    const q = query(collection(db, 'paymentRequests'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PaymentRequestRecord)
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'paymentRequests');
  }
}

export async function submitPaymentVerificationRequest(input: {
  uid: string;
  userEmail: string;
  username: string;
  method: PaymentMethodRecord;
  amountUsd: number;
  senderName: string;
  senderAccount: string;
  transactionId: string;
  receiptDataUrl: string;
  userNote: string;
}): Promise<void> {
  const cleanSenderName = sanitizePlainText(input.senderName.trim(), 100);
  const cleanSenderAccount = sanitizePlainText(input.senderAccount.trim(), 120);
  const cleanTransactionId = sanitizePlainText(input.transactionId.trim(), 120);
  const cleanNote = sanitizePlainText(input.userNote.trim(), 500);
  const cleanReceipt = input.receiptDataUrl.startsWith('data:image/')
    ? input.receiptDataUrl.slice(0, 160000)
    : '';

  if (cleanSenderName.length < 2) {
    throw new Error('Sender account title / name must be at least 2 characters.');
  }
  if (cleanSenderAccount.length < 2) {
    throw new Error('Sender account / phone number must be at least 2 characters.');
  }
  if (cleanTransactionId.length < 3) {
    throw new Error('Transaction ID / reference number must be at least 3 characters.');
  }

  const requestId = generateSafeId('pay');
  const payload = {
    id: requestId,
    uid: input.uid,
    userEmail: input.userEmail.trim(),
    username: normalizeUsername(input.username),
    methodId: input.method.id,
    methodName: sanitizePlainText(input.method.providerName, 80),
    amountUsd: Math.max(1, Math.min(500, Math.round(input.amountUsd))),
    senderName: cleanSenderName,
    senderAccount: cleanSenderAccount,
    transactionId: cleanTransactionId,
    receiptDataUrl: cleanReceipt,
    userNote: cleanNote,
    status: 'pending' as PaymentRequestStatus,
    adminNote: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'paymentRequests', requestId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `paymentRequests/${requestId}`);
  }
}

// ============================================================================
// Protected Admin Panel Operations
// ============================================================================

export async function fetchAdminDashboardData(): Promise<{
  users: UserAccount[];
  profiles: ProfileConfig[];
  reports: ReportRecord[];
  tickets: SupportTicketRecord[];
  admins: AdminRecord[];
  settings: PlatformSettingsRecord;
  faqs: FaqRecord[];
  paymentMethods: PaymentMethodRecord[];
  paymentRequests: PaymentRequestRecord[];
}> {
  try {
    const [
      usersSnap,
      profilesSnap,
      reportsSnap,
      ticketsSnap,
      adminsSnap,
      settingsSnap,
      faqsSnap,
      paymentMethodsSnap,
      paymentRequestsSnap,
    ] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(200))),
      getDocs(query(collection(db, 'profiles'), limit(200))),
      getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100))),
      getDocs(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'), limit(100))),
      getDocs(collection(db, 'admins')),
      getDoc(doc(db, 'platformSettings', 'public')),
      getDocs(collection(db, 'faqs')),
      getDocs(collection(db, 'paymentMethods')),
      getDocs(query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'), limit(150))),
    ]);

    return {
      users: usersSnap.docs.map((d) => d.data() as UserAccount),
      profiles: profilesSnap.docs.map((d) => d.data() as ProfileConfig),
      reports: reportsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportRecord, 'id'>) })),
      tickets: ticketsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SupportTicketRecord, 'id'>),
      })),
      admins: adminsSnap.docs.map((d) => d.data() as AdminRecord),
      settings: settingsSnap.exists()
        ? (settingsSnap.data() as PlatformSettingsRecord)
        : DEFAULT_PLATFORM_SETTINGS,
      faqs: faqsSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FaqRecord, 'id'>) }))
        .sort((a, b) => a.order - b.order),
      paymentMethods: paymentMethodsSnap.docs
        .map((d) => d.data() as PaymentMethodRecord)
        .sort((a, b) => a.order - b.order),
      paymentRequests: paymentRequestsSnap.docs.map((d) => d.data() as PaymentRequestRecord),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_dashboard');
  }
}

export async function adminSetUserStatusAndPlan(
  targetUser: UserAccount,
  targetProfile: ProfileConfig | undefined,
  nextStatus: 'active' | 'suspended',
  nextPlan: PlanTier
): Promise<void> {
  const subRef = doc(db, 'subscriptions', targetUser.uid);
  const subSnap = await getDoc(subRef);

  const batch = writeBatch(db);

  batch.update(doc(db, 'users', targetUser.uid), {
    status: nextStatus,
    plan: nextPlan,
    updatedAt: serverTimestamp(),
  });

  if (subSnap.exists()) {
    batch.update(subRef, {
      plan: nextPlan,
      status: 'active',
      provider: 'manual_admin',
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(subRef, {
      uid: targetUser.uid,
      plan: nextPlan,
      status: 'active',
      provider: 'manual_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (targetProfile) {
    const nextPublished = nextStatus === 'suspended' ? false : targetProfile.isPublished;
    batch.update(doc(db, 'profiles', targetUser.uid), {
      accountStatus: nextStatus,
      isPublished: nextPublished,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'usernames', targetProfile.username), {
      isPublished: nextPublished,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUser.uid}`);
  }
}

export async function adminToggleVerifiedCreator(
  targetUid: string,
  isVerifiedCreator: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'profiles', targetUid), {
      isVerifiedCreator: Boolean(isVerifiedCreator),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${targetUid}`);
  }
}

export async function adminSavePaymentMethod(
  methodId: string | null,
  input: {
    providerName: string;
    accountTitle: string;
    accountNumber: string;
    instructions: string;
    isActive: boolean;
    order: number;
  }
): Promise<void> {
  const cleanProvider = sanitizePlainText(input.providerName.trim(), 80);
  const cleanTitle = sanitizePlainText(input.accountTitle.trim(), 100);
  const cleanNumber = sanitizePlainText(input.accountNumber.trim(), 120);
  const cleanInstructions = sanitizePlainText(input.instructions.trim(), 600);
  const cleanOrder = Math.max(0, Math.min(500, Math.round(input.order)));

  if (cleanProvider.length < 2) {
    throw new Error('Payment method / bank name must be at least 2 characters.');
  }
  if (cleanTitle.length < 2) {
    throw new Error('Account title must be at least 2 characters.');
  }
  if (cleanNumber.length < 3) {
    throw new Error('Account number / IBAN / wallet must be at least 3 characters.');
  }

  const id = methodId || generateSafeId('pm');
  const ref = doc(db, 'paymentMethods', id);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        providerName: cleanProvider,
        accountTitle: cleanTitle,
        accountNumber: cleanNumber,
        instructions: cleanInstructions,
        isActive: input.isActive,
        order: cleanOrder,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id,
        providerName: cleanProvider,
        accountTitle: cleanTitle,
        accountNumber: cleanNumber,
        instructions: cleanInstructions,
        isActive: input.isActive,
        order: cleanOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `paymentMethods/${id}`);
  }
}

export async function adminDeletePaymentMethod(methodId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'paymentMethods', methodId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `paymentMethods/${methodId}`);
  }
}

export async function adminReviewPaymentRequest(
  request: PaymentRequestRecord,
  nextStatus: 'approved' | 'rejected',
  adminNote: string
): Promise<void> {
  const cleanNote = sanitizePlainText(adminNote.trim(), 500);
  const reqRef = doc(db, 'paymentRequests', request.id);

  if (nextStatus === 'rejected') {
    try {
      await updateDoc(reqRef, {
        status: 'rejected',
        adminNote: cleanNote,
        updatedAt: serverTimestamp(),
      });
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `paymentRequests/${request.id}`);
    }
  }

  // Approve: atomically mark request approved AND activate Premium on user + subscription
  const subRef = doc(db, 'subscriptions', request.uid);
  const subSnap = await getDoc(subRef);
  const batch = writeBatch(db);

  batch.update(reqRef, {
    status: 'approved',
    adminNote: cleanNote || 'Payment verified and Premium plan activated.',
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'users', request.uid), {
    plan: 'premium',
    updatedAt: serverTimestamp(),
  });

  if (subSnap.exists()) {
    batch.update(subRef, {
      plan: 'premium',
      status: 'active',
      provider: 'manual_admin',
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(subRef, {
      uid: request.uid,
      plan: 'premium',
      status: 'active',
      provider: 'manual_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `paymentRequests/${request.id}`);
  }
}

export async function adminGrantPrivilege(
  currentAdminUid: string,
  targetUid: string,
  targetEmail: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'admins', targetUid.trim()), {
      uid: targetUid.trim(),
      email: targetEmail.trim(),
      grantedBy: currentAdminUid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admins/${targetUid}`);
  }
}

export async function adminRevokePrivilege(targetUid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admins/${targetUid}`);
  }
}

export async function adminUpdateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function adminReplySupportTicket(
  ticketId: string,
  status: SupportStatus,
  adminReply: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status,
      adminReply: sanitizePlainText(adminReply.trim(), 2000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
  }
}

export async function adminSavePlatformSettings(
  settings: Omit<PlatformSettingsRecord, 'updatedAt'>
): Promise<void> {
  const payload = {
    heroHeadline: sanitizePlainText(settings.heroHeadline.trim(), 120),
    heroSubheadline: sanitizePlainText(settings.heroSubheadline.trim(), 300),
    freeMaxLinks: Math.max(1, Math.min(50, Math.round(settings.freeMaxLinks))),
    premiumMaxLinks: Math.max(10, Math.min(100, Math.round(settings.premiumMaxLinks))),
    premiumPriceMonthly: Math.max(1, Math.min(500, Math.round(settings.premiumPriceMonthly))),
    disabledThemes: settings.disabledThemes.slice(0, 16),
    updatedAt: serverTimestamp(),
  };

  try {
    const existing = await getDoc(doc(db, 'platformSettings', 'public'));
    if (existing.exists()) {
      await updateDoc(doc(db, 'platformSettings', 'public'), payload);
    } else {
      await setDoc(doc(db, 'platformSettings', 'public'), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'platformSettings/public');
  }
}

export async function adminSaveFaqItem(
  faqId: string | null,
  input: { question: string; answer: string; order: number; isPublished: boolean }
): Promise<void> {
  const id = faqId || generateSafeId('faq');
  const payload = {
    question: sanitizePlainText(input.question.trim(), 200),
    answer: sanitizePlainText(input.answer.trim(), 1500),
    order: Math.max(0, Math.min(500, Math.round(input.order))),
    isPublished: input.isPublished,
    updatedAt: serverTimestamp(),
  };
  if (payload.question.length < 5 || payload.answer.length < 10) {
    throw new Error('Question (min 5 chars) and answer (min 10 chars) are required.');
  }

  try {
    const existing = await getDoc(doc(db, 'faqs', id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'faqs', id), payload);
    } else {
      await setDoc(doc(db, 'faqs', id), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `faqs/${id}`);
  }
}

export async function adminDeleteFaqItem(faqId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'faqs', faqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `faqs/${faqId}`);
  }
}
