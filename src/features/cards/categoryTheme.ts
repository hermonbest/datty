import React from 'react';
import {
  Sparkles,
  Heart,
  Flame,
  Zap,
  HelpCircle,
  Compass,
  Activity,
  Smile,
  Palette,
  Camera,
  Layers,
  LucideIcon,
} from 'lucide-react-native';

export interface CategoryTheme {
  category: string;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  border: string;
  iconName: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'Popular Community Questions': {
    category: 'Popular Community Questions',
    label: 'Popular',
    emoji: '✨',
    color: '#E11D48',         // Crimson Rose
    bgLight: '#FFE4E6',
    border: '#FECDD3',
    iconName: 'Sparkles',
    icon: Sparkles,
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
  },
  'Deep Questions': {
    category: 'Deep Questions',
    label: 'Deep Talks',
    emoji: '💜',
    color: '#7C3AED',         // Royal Violet
    bgLight: '#EDE9FE',
    border: '#DDD6FE',
    iconName: 'Heart',
    icon: Heart,
    badgeBg: '#EDE9FE',
    badgeText: '#6D28D9',
  },
  'Hot & Spicy': {
    category: 'Hot & Spicy',
    label: 'Hot & Spicy',
    emoji: '🔥',
    color: '#DC2626',         // Fiery Red
    bgLight: '#FEE2E2',
    border: '#FECACA',
    iconName: 'Flame',
    icon: Flame,
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
  },
  'Unhinged': {
    category: 'Unhinged',
    label: 'Unhinged',
    emoji: '⚡',
    color: '#D946EF',         // Electric Fuchsia
    bgLight: '#FAE8FF',
    border: '#F5D0FE',
    iconName: 'Zap',
    icon: Zap,
    badgeBg: '#FAE8FF',
    badgeText: '#A21CAF',
  },
  'Would You Rather?': {
    category: 'Would You Rather?',
    label: 'Would You Rather',
    emoji: '🎲',
    color: '#EA580C',         // Sunset Amber Orange
    bgLight: '#FFEDD5',
    border: '#FED7AA',
    iconName: 'HelpCircle',
    icon: HelpCircle,
    badgeBg: '#FFEDD5',
    badgeText: '#C2410C',
  },
  'Future Plans & Dreams': {
    category: 'Future Plans & Dreams',
    label: 'Future & Dreams',
    emoji: '🧭',
    color: '#0D9488',         // Emerald Teal
    bgLight: '#CCFBF1',
    border: '#99F6E4',
    iconName: 'Compass',
    icon: Compass,
    badgeBg: '#CCFBF1',
    badgeText: '#0F766E',
  },
  'Wellness': {
    category: 'Wellness',
    label: 'Wellness',
    emoji: '🌿',
    color: '#059669',         // Calm Jade Emerald
    bgLight: '#D1FAE5',
    border: '#A7F3D0',
    iconName: 'Activity',
    icon: Activity,
    badgeBg: '#D1FAE5',
    badgeText: '#047857',
  },
  'Parenting Perspectives': {
    category: 'Parenting Perspectives',
    label: 'Parenting',
    emoji: '🧸',
    color: '#D97706',         // Golden Honey
    bgLight: '#FEF3C7',
    border: '#FDE68A',
    iconName: 'Smile',
    icon: Smile,
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
  'Creative / Visual': {
    category: 'Creative / Visual',
    label: 'Creative & Visual',
    emoji: '🎨',
    color: '#DB2777',         // Radiant Magenta Pink
    bgLight: '#FCE7F3',
    border: '#FBCFE8',
    iconName: 'Palette',
    icon: Palette,
    badgeBg: '#FCE7F3',
    badgeText: '#BE185D',
  },
  'Photo Prompts': {
    category: 'Photo Prompts',
    label: 'Photo Prompts',
    emoji: '📸',
    color: '#0284C7',         // Cerulean Sky
    bgLight: '#E0F2FE',
    border: '#BAE6FD',
    iconName: 'Camera',
    icon: Camera,
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
  },
};

const DEFAULT_THEME: CategoryTheme = {
  category: 'General',
  label: 'Questions',
  emoji: '✨',
  color: '#E11D48',
  bgLight: '#FFE4E6',
  border: '#FECDD3',
  iconName: 'Sparkles',
  icon: Sparkles,
  badgeBg: '#FFE4E6',
  badgeText: '#BE123C',
};

/**
 * Returns the theme config for a given category with fallback.
 */
export function getCategoryTheme(categoryName?: string | null): CategoryTheme {
  if (!categoryName) return DEFAULT_THEME;
  if (CATEGORY_THEMES[categoryName]) {
    return CATEGORY_THEMES[categoryName];
  }

  // Case-insensitive / partial matching
  const matchKey = Object.keys(CATEGORY_THEMES).find(
    (key) => key.toLowerCase() === categoryName.toLowerCase() ||
             categoryName.toLowerCase().includes(key.toLowerCase()) ||
             key.toLowerCase().includes(categoryName.toLowerCase())
  );

  return matchKey ? CATEGORY_THEMES[matchKey] : DEFAULT_THEME;
}

/**
 * Map of Lucide icons by name for dynamic lookup.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Heart,
  Flame,
  Zap,
  HelpCircle,
  Compass,
  Activity,
  Smile,
  Palette,
  Camera,
  Layers,
};
