const fs = require('fs');
const path = require('path');
const { parseDecksFile } = require('./parseDecks');

const mdPath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
const parsedDecks = parseDecksFile(mdPath);

const CATEGORY_COLORS = {
  'Popular Community Questions': { color: '#E11D48', bgLight: '#FFE4E6', iconName: 'Sparkles' },
  'Deep Questions': { color: '#7C3AED', bgLight: '#EDE9FE', iconName: 'Heart' },
  'Hot & Spicy': { color: '#DC2626', bgLight: '#FEE2E2', iconName: 'Flame' },
  'Unhinged': { color: '#D946EF', bgLight: '#FAE8FF', iconName: 'Zap' },
  'Would You Rather?': { color: '#EA580C', bgLight: '#FFEDD5', iconName: 'HelpCircle' },
  'Future Plans & Dreams': { color: '#0D9488', bgLight: '#CCFBF1', iconName: 'Compass' },
  'Wellness': { color: '#059669', bgLight: '#D1FAE5', iconName: 'Activity' },
  'Parenting Perspectives': { color: '#D97706', bgLight: '#FEF3C7', iconName: 'Smile' },
  'Creative / Visual': { color: '#DB2777', bgLight: '#FCE7F3', iconName: 'Palette' },
  'Photo Prompts': { color: '#0284C7', bgLight: '#E0F2FE', iconName: 'Camera' },
};

const getTheme = (cat) => CATEGORY_COLORS[cat] || { color: '#E11D48', bgLight: '#FFE4E6', iconName: 'Sparkles' };

let tsOutput = `import { getCategoryTheme } from './categoryTheme';

// Auto-generated decks data from candle_cards_complete_questions_deck.md

export interface CardDeck {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  color: string;
  bgLight: string;
  iconName: string;
  questions: string[];
}

export const CATEGORIES = [
  'All',
  'Popular Community Questions',
  'Deep Questions',
  'Hot & Spicy',
  'Unhinged',
  'Would You Rather?',
  'Future Plans & Dreams',
  'Wellness',
  'Parenting Perspectives',
  'Creative / Visual',
  'Photo Prompts',
] as const;

const RAW_DECKS_DATA: CardDeck[] = ${JSON.stringify(parsedDecks.map((d, index) => {
  const theme = getTheme(d.category);
  const slug = d.deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: `deck-${index + 1}-${slug}`,
    title: d.deckTitle,
    category: d.category,
    subtitle: d.subtitle,
    color: theme.color,
    bgLight: theme.bgLight,
    iconName: theme.iconName,
    questions: d.questions,
  };
}), null, 2)};

export const DECKS_DATA: CardDeck[] = RAW_DECKS_DATA.map((deck) => {
  const theme = getCategoryTheme(deck.category);
  return {
    ...deck,
    color: theme.color,
    bgLight: theme.bgLight,
    iconName: theme.iconName,
  };
});
`;

const tsPath = path.join(__dirname, '../src/features/cards/decksData.ts');
fs.writeFileSync(tsPath, tsOutput, 'utf8');
console.log(`Generated ${parsedDecks.length} decks in ${tsPath}`);
