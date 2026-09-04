import {
  validateNoteContent,
  validatePartnerNote,
  filterCoupleNotesByType,
  sortGratitudeNotes,
  sortCoupleListItems,
  sortPartnerNotes,
  DEFAULT_PARTNER_CATEGORIES,
} from '../src/features/notes/notesLogic';
import { CoupleNote, PartnerNote } from '../src/types';

describe('notesLogic', () => {
  describe('validateNoteContent', () => {
    it('rejects empty and whitespace strings', () => {
      expect(validateNoteContent('').valid).toBe(false);
      expect(validateNoteContent('   ').valid).toBe(false);
      expect(validateNoteContent(null as any).valid).toBe(false);
    });

    it('accepts valid text', () => {
      expect(validateNoteContent('Grateful for our morning walk').valid).toBe(true);
    });

    it('rejects strings over 2000 characters', () => {
      const longText = 'a'.repeat(2001);
      expect(validateNoteContent(longText).valid).toBe(false);
    });
  });

  describe('validatePartnerNote', () => {
    it('requires both title and content', () => {
      expect(validatePartnerNote('', 'content').valid).toBe(false);
      expect(validatePartnerNote('title', '').valid).toBe(false);
      expect(validatePartnerNote('   ', '   ').valid).toBe(false);
    });

    it('accepts valid title and content', () => {
      const result = validatePartnerNote('Coffee Order', 'Oat milk latte');
      expect(result.valid).toBe(true);
    });

    it('rejects overly long title', () => {
      const longTitle = 'x'.repeat(101);
      expect(validatePartnerNote(longTitle, 'details').valid).toBe(false);
    });
  });

  describe('filterCoupleNotesByType', () => {
    const notes: CoupleNote[] = [
      { id: '1', type: 'gratitude', content: 'Warm hug', authorUid: 'u1', createdAt: 100 },
      { id: '2', type: 'list', content: 'Go to Paris', completed: false, authorUid: 'u1', createdAt: 200 },
      { id: '3', type: 'gratitude', content: 'Good dinner', authorUid: 'u2', createdAt: 300 },
    ];

    it('filters gratitude notes only', () => {
      const gratitude = filterCoupleNotesByType(notes, 'gratitude');
      expect(gratitude).toHaveLength(2);
      expect(gratitude.map((n) => n.id)).toEqual(['1', '3']);
    });

    it('filters list notes only', () => {
      const list = filterCoupleNotesByType(notes, 'list');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('2');
    });
  });

  describe('sortGratitudeNotes', () => {
    it('sorts newest first', () => {
      const notes: CoupleNote[] = [
        { id: '1', type: 'gratitude', content: 'A', authorUid: 'u1', createdAt: 100 },
        { id: '2', type: 'gratitude', content: 'B', authorUid: 'u1', createdAt: 300 },
        { id: '3', type: 'gratitude', content: 'C', authorUid: 'u1', createdAt: 200 },
      ];
      const sorted = sortGratitudeNotes(notes);
      expect(sorted.map((n) => n.id)).toEqual(['2', '3', '1']);
    });
  });

  describe('sortCoupleListItems', () => {
    const items: CoupleNote[] = [
      { id: '1', type: 'list', content: 'Done item', completed: true, authorUid: 'u1', createdAt: 500 },
      { id: '2', type: 'list', content: 'Pending older', completed: false, authorUid: 'u1', createdAt: 100 },
      { id: '3', type: 'list', content: 'Pending newer', completed: false, authorUid: 'u1', createdAt: 300 },
    ];

    it('puts incomplete items first, each group sorted newest first', () => {
      const sorted = sortCoupleListItems(items, 'all');
      expect(sorted.map((i) => i.id)).toEqual(['3', '2', '1']);
    });

    it('filters by todo status', () => {
      const todo = sortCoupleListItems(items, 'todo');
      expect(todo.map((i) => i.id)).toEqual(['3', '2']);
    });

    it('filters by done status', () => {
      const done = sortCoupleListItems(items, 'done');
      expect(done.map((i) => i.id)).toEqual(['1']);
    });
  });

  describe('sortPartnerNotes', () => {
    const notes: PartnerNote[] = [
      { id: '1', title: 'Flower', content: 'Roses', category: 'Favorites', createdAt: 100 },
      { id: '2', title: 'Shoe', content: 'Size 8', category: 'Sizes', createdAt: 300 },
      { id: '3', title: 'Ice Cream', content: 'Matcha', category: 'Favorites', createdAt: 200 },
    ];

    it('sorts newest first', () => {
      const sorted = sortPartnerNotes(notes, 'all');
      expect(sorted.map((n) => n.id)).toEqual(['2', '3', '1']);
    });

    it('filters by category', () => {
      const favorites = sortPartnerNotes(notes, 'Favorites');
      expect(favorites.map((n) => n.id)).toEqual(['3', '1']);
    });
  });

  describe('categories integrity', () => {
    it('contains essential categories', () => {
      expect(DEFAULT_PARTNER_CATEGORIES).toContain('Favorites');
      expect(DEFAULT_PARTNER_CATEGORIES).toContain('Sizes');
      expect(DEFAULT_PARTNER_CATEGORIES).toContain('Preferences');
      expect(DEFAULT_PARTNER_CATEGORIES).toContain('Gifts');
    });
  });
});
