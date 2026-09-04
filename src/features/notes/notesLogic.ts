import { CoupleNote, CoupleNoteType, PartnerNote } from '../../types';

export type ListFilter = 'all' | 'todo' | 'done';

export const DEFAULT_PARTNER_CATEGORIES = [
  'Favorites',
  'Sizes',
  'Preferences',
  'Gifts',
  'Quirks',
  'General',
] as const;

export const SUGGESTED_PARTNER_PROMPTS = [
  { title: '☕ Coffee Order', category: 'Preferences' },
  { title: '🌸 Favorite Flowers', category: 'Favorites' },
  { title: '🎁 Gift Ideas', category: 'Gifts' },
  { title: '👗 Sizes (Clothes / Shoes / Ring)', category: 'Sizes' },
  { title: '🍕 Comfort Food', category: 'Favorites' },
  { title: '💖 Love Language', category: 'Preferences' },
];

export function validateNoteContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content?.trim() || '';
  if (!trimmed) {
    return { valid: false, error: 'Note cannot be empty.' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: 'Note exceeds maximum length of 2000 characters.' };
  }
  return { valid: true };
}

export function validatePartnerNote(
  title: string,
  content: string
): { valid: boolean; error?: string } {
  const trimmedTitle = title?.trim() || '';
  const trimmedContent = content?.trim() || '';

  if (!trimmedTitle) {
    return { valid: false, error: 'Title is required (e.g. "Coffee Order").' };
  }
  if (!trimmedContent) {
    return { valid: false, error: 'Please enter details for this note.' };
  }
  if (trimmedTitle.length > 100) {
    return { valid: false, error: 'Title must be under 100 characters.' };
  }
  return { valid: true };
}

export function filterCoupleNotesByType(notes: CoupleNote[], type: CoupleNoteType): CoupleNote[] {
  return notes.filter((n) => n.type === type);
}

export function sortGratitudeNotes(notes: CoupleNote[]): CoupleNote[] {
  return [...notes].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return timeB - timeA;
  });
}

export function sortCoupleListItems(notes: CoupleNote[], filter: ListFilter = 'all'): CoupleNote[] {
  const filtered = notes.filter((item) => {
    if (filter === 'todo') return !item.completed;
    if (filter === 'done') return !!item.completed;
    return true;
  });

  return filtered.sort((a, b) => {
    // Incomplete items come first
    if (!a.completed && b.completed) return -1;
    if (a.completed && !b.completed) return 1;

    // Within same group, sort newest first
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return timeB - timeA;
  });
}

export function sortPartnerNotes(notes: PartnerNote[], categoryFilter: string = 'all'): PartnerNote[] {
  const filtered = categoryFilter === 'all'
    ? notes
    : notes.filter((n) => n.category === categoryFilter);

  return [...filtered].sort((a, b) => {
    const timeA = (a.updatedAt?.toMillis ? a.updatedAt.toMillis() : a.updatedAt) ||
                  (a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt) || 0;
    const timeB = (b.updatedAt?.toMillis ? b.updatedAt.toMillis() : b.updatedAt) ||
                  (b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt) || 0;
    return timeB - timeA;
  });
}
