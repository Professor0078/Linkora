import { Timestamp } from 'firebase/firestore';

export type PlanTier = 'free' | 'premium';
export type AccountStatus = 'active' | 'suspended';

export type ThemeId =
  | 'minimal-white'
  | 'dark-pro'
  | 'gradient-dream'
  | 'creator-neon'
  | 'business-pro'
  | 'pink-aesthetic'
  | 'nature-green'
  | 'glassmorphism';

export type ButtonShape = 'sharp' | 'rounded' | 'pill';
export type ButtonStyle = 'solid' | 'outline' | 'soft' | 'shadow' | 'glass';
export type FontToken = 'jakarta' | 'serif' | 'mono' | 'editorial' | 'modern';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type LayoutWidth = 'compact' | 'standard' | 'wide';

export type LinkPlatform =
  | 'website'
  | 'portfolio'
  | 'whatsapp'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'x'
  | 'github'
  | 'shop'
  | 'email'
  | 'phone'
  | 'custom';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  plan: PlanTier;
  status: AccountStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt?: Timestamp;
}

export interface UsernameRecord {
  uid: string;
  username: string;
  isPublished: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProfileConfig {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  backgroundImageUrl: string;
  themeId: ThemeId;
  customBgColor: string;
  customBgGradient: string;
  customButtonColor: string;
  customTextColor: string;
  buttonShape: ButtonShape;
  buttonStyle: ButtonStyle;
  fontFamily: FontToken;
  avatarShape: AvatarShape;
  layoutWidth: LayoutWidth;
  ctaLabel: string;
  ctaUrl: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  accountStatus: AccountStatus;
  linkCount: number;
  lastModifiedLinkId: string;
  totalViews: number;
  totalClicks: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BioLink {
  id: string;
  uid: string;
  title: string;
  url: string;
  platform: LinkPlatform;
  isSocialIcon: boolean;
  enabled: boolean;
  isProfilePublished: boolean;
  order: number;
  clicks: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LinkEventRecord {
  id?: string;
  profileUid: string;
  eventType: 'view' | 'click';
  linkId: string;
  linkTitle: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  referrerHost: string;
  dateKey: string;
  createdAt?: Timestamp;
}

export interface AnalyticsDailyRecord {
  profileUid: string;
  dateKey: string;
  views: number;
  clicks: number;
  lastEventId: string;
  updatedAt?: Timestamp;
}

export interface SubscriptionRecord {
  uid: string;
  plan: PlanTier;
  status: 'active' | 'canceled' | 'pending_verification';
  provider: 'system' | 'manual_admin';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type SupportCategory = 'account' | 'billing' | 'technical' | 'abuse' | 'feature';
export type SupportStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicketRecord {
  id: string;
  uid: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  adminReply: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ReportReason = 'spam' | 'impersonation' | 'phishing' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface ReportRecord {
  id: string;
  reportedUid: string;
  reportedUsername: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PlatformSettingsRecord {
  heroHeadline: string;
  heroSubheadline: string;
  freeMaxLinks: number;
  premiumMaxLinks: number;
  premiumPriceMonthly: number;
  disabledThemes: ThemeId[];
  updatedAt?: Timestamp;
}

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  updatedAt?: Timestamp;
}

export interface PaymentMethodRecord {
  id: string;
  providerName: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  isActive: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequestRecord {
  id: string;
  uid: string;
  userEmail: string;
  username: string;
  methodId: string;
  methodName: string;
  amountUsd: number;
  senderName: string;
  senderAccount: string;
  transactionId: string;
  receiptDataUrl: string;
  userNote: string;
  status: PaymentRequestStatus;
  adminNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  tier: PlanTier;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  mutedTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  defaultShape: ButtonShape;
  defaultStyle: ButtonStyle;
  previewAccent: string;
}

