import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Cpu,
  Hammer,
  Home,
  Palette,
  Truck,
  UserRound,
} from 'lucide-react';

export interface MarketingCategory {
  name: string;
  slug: string;
  description: string;
  servicesLabel: string;
  icon: LucideIcon;
}

/** Homepage category grid — matches the Magobo marketplace design. */
export const MARKETING_CATEGORIES: MarketingCategory[] = [
  {
    name: 'Education',
    slug: 'education',
    description: 'Tutoring, exam prep, languages and coaching.',
    servicesLabel: 'Tutoring & coaching',
    icon: BookOpen,
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Web, mobile, data and IT support.',
    servicesLabel: 'Web, mobile & IT',
    icon: Cpu,
  },
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Cleaning, plumbing, electrical and repairs.',
    servicesLabel: 'Home & repairs',
    icon: Home,
  },
  {
    name: 'Transportation',
    slug: 'transport-delivery',
    description: 'Drivers, deliveries, moving and logistics.',
    servicesLabel: 'Moving & logistics',
    icon: Truck,
  },
  {
    name: 'Creative',
    slug: 'creative-design',
    description: 'Design, photography, video and writing.',
    servicesLabel: 'Design & content',
    icon: Palette,
  },
  {
    name: 'Business',
    slug: 'professional-services',
    description: 'Consulting, accounting, marketing and admin.',
    servicesLabel: 'Consulting & admin',
    icon: Briefcase,
  },
  {
    name: 'Construction',
    slug: 'construction',
    description: 'Carpentry, masonry, roofing and site work.',
    servicesLabel: 'Build & site work',
    icon: Hammer,
  },
  {
    name: 'Events',
    slug: 'events-hospitality',
    description: 'Catering, MCs, décor, sound and staffing.',
    servicesLabel: 'Catering & events',
    icon: CalendarDays,
  },
  {
    name: 'Personal Services',
    slug: 'personal-services',
    description: 'Care, fitness, styling and errands.',
    servicesLabel: 'Care & errands',
    icon: UserRound,
  },
];
