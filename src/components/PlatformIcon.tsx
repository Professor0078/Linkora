import React from 'react';
import {
  Briefcase,
  ExternalLink,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  ShoppingBag,
  Twitter,
  Youtube,
} from 'lucide-react';
import { LinkPlatform } from '../types/linkora';

export const PLATFORM_OPTIONS: {
  id: LinkPlatform;
  label: string;
  placeholder: string;
}[] = [
  { id: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
  { id: 'portfolio', label: 'Portfolio', placeholder: 'https://portfolio.design' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 234 5678 or https://wa.me/...' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { id: 'x', label: 'X / Twitter', placeholder: 'https://x.com/username' },
  { id: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { id: 'shop', label: 'Online Store / Product', placeholder: 'https://shop.example.com' },
  { id: 'email', label: 'Email Contact', placeholder: 'hello@example.com' },
  { id: 'phone', label: 'Phone Call', placeholder: '+1 555 234 5678' },
  { id: 'custom', label: 'Custom Link', placeholder: 'https://example.com/resource' },
];

export const PlatformIcon: React.FC<{
  platform: LinkPlatform;
  className?: string;
}> = ({ platform, className = 'w-4 h-4 shrink-0' }) => {
  switch (platform) {
    case 'website':
      return <Globe className={className} aria-hidden="true" />;
    case 'portfolio':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'whatsapp':
      return <MessageCircle className={className} aria-hidden="true" />;
    case 'youtube':
      return <Youtube className={className} aria-hidden="true" />;
    case 'instagram':
      return <Instagram className={className} aria-hidden="true" />;
    case 'tiktok':
      return <Music2 className={className} aria-hidden="true" />;
    case 'facebook':
      return <Facebook className={className} aria-hidden="true" />;
    case 'linkedin':
      return <Linkedin className={className} aria-hidden="true" />;
    case 'x':
      return <Twitter className={className} aria-hidden="true" />;
    case 'github':
      return <Github className={className} aria-hidden="true" />;
    case 'shop':
      return <ShoppingBag className={className} aria-hidden="true" />;
    case 'email':
      return <Mail className={className} aria-hidden="true" />;
    case 'phone':
      return <Phone className={className} aria-hidden="true" />;
    case 'custom':
    default:
      return <ExternalLink className={className} aria-hidden="true" />;
  }
};
