import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { CardDeck, DECKS_DATA, CATEGORIES } from './decksData';
import { getCategoryTheme, ICON_MAP } from './categoryTheme';
import { CardPlayerScreen } from './CardPlayerScreen';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, ProfileSettingsModal } from '../../components';
import { useCouple } from '../../services/coupleContext';
import {
  Sparkles,
  Search,
  Shuffle,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react-native';
import { ChatReplyReference } from '../../types';

interface DecksScreenProps {
  onNavigateToChat?: (replyTo?: ChatReplyReference) => void;
}

// Pre-indexed searchable deck strings for 60fps instant search responsiveness
const PRE_INDEXED_DECKS = DECKS_DATA.map((deck) => ({
  deck,
  searchIndex: `${deck.title} ${deck.subtitle} ${deck.category} ${deck.questions.join(' ')}`.toLowerCase(),
}));

export const DecksScreen: React.FC<DecksScreenProps> = ({ onNavigateToChat }) => {
  const { userProfile } = useCouple();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDeck, setActiveDeck] = useState<CardDeck | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Fast filtered decks using pre-computed search index
  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRE_INDEXED_DECKS.filter(({ deck, searchIndex }) => {
      const matchesCategory =
        selectedCategory === 'All' || deck.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      return searchIndex.includes(q);
    }).map(({ deck }) => deck);
  }, [selectedCategory, searchQuery]);

// Unbiased Fisher-Yates shuffle
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

  // Quick Random Card from any deck
  const handleRandomDraw = () => {
    const randomDeck = DECKS_DATA[Math.floor(Math.random() * DECKS_DATA.length)];
    // Unbiased shuffle of the random deck
    const shuffledQuestions = shuffleArray(randomDeck.questions);
    setActiveDeck({
      ...randomDeck,
      questions: shuffledQuestions,
    });
  };

  // If a deck is open, render CardPlayerScreen
  if (activeDeck) {
    return (
      <CardPlayerScreen
        deck={activeDeck}
        onBack={() => setActiveDeck(null)}
        onNavigateToChat={onNavigateToChat}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeftWrap}>
            <View style={styles.headerIconCircle}>
              <Layers size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Card Decks</Text>
              <Text style={styles.headerSubtitle}>34 bespoke decks • 850 prompts</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.profileBtn}
            accessibilityLabel="Open profile and settings"
          >
            <Avatar
              name={userProfile?.displayName || 'You'}
              photoURL={userProfile?.photoURL}
              size="sm"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Draw Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleRandomDraw}
          style={styles.randomHeroBanner}
        >
          <View style={styles.randomHeroContent}>
            <View style={styles.randomHeroBadge}>
              <Shuffle size={13} color="#FFF" />
              <Text style={styles.randomHeroBadgeText}>Spontaneous Draw</Text>
            </View>
            <Text style={styles.randomHeroTitle}>Draw a Random Card</Text>
            <Text style={styles.randomHeroSub}>
              Pick an unexpected prompt across all 34 decks for tonight.
            </Text>
          </View>
          <View style={styles.randomHeroAction}>
            <ChevronRight size={22} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search decks or questions..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const catTheme = cat === 'All' ? null : getCategoryTheme(cat);
            const activeColor = catTheme ? catTheme.color : colors.primary;
            const activeBg = catTheme ? catTheme.color : colors.primary;
            const emoji = catTheme ? catTheme.emoji : '✨';

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  isSelected && {
                    backgroundColor: activeBg,
                    borderColor: activeColor,
                    shadowColor: activeColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextSelected,
                  ]}
                >
                  {cat === 'All' ? '✨ All Decks' : `${emoji} ${cat}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Decks Grid / List */}
        <View style={styles.decksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Decks' : selectedCategory}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredDecks.length} {filteredDecks.length === 1 ? 'Deck' : 'Decks'}
            </Text>
          </View>

          {filteredDecks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No matching decks found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or category filter.</Text>
            </View>
          ) : (
            filteredDecks.map((deck) => {
              const theme = getCategoryTheme(deck.category);
              const IconComponent = ICON_MAP[deck.iconName] || theme.icon || Sparkles;

              return (
                <TouchableOpacity
                  key={deck.id}
                  activeOpacity={0.82}
                  onPress={() => setActiveDeck(deck)}
                  style={[
                    styles.deckCard,
                    { borderLeftColor: theme.color, borderLeftWidth: 4 },
                  ]}
                >
                  <View style={[styles.deckIconCircle, { backgroundColor: theme.bgLight }]}>
                    <IconComponent size={22} color={theme.color} />
                  </View>

                  <View style={styles.deckInfo}>
                    <View style={styles.deckTopRow}>
                      <Text style={styles.deckTitle}>{deck.title}</Text>
                      <View style={[styles.cardCountBadge, { backgroundColor: theme.bgLight }]}>
                        <Text style={[styles.cardCountText, { color: theme.color }]}>
                          {deck.questions.length} cards
                        </Text>
                      </View>
                    </View>

                    {deck.subtitle ? (
                      <Text style={styles.deckSubtitle} numberOfLines={2}>
                        "{deck.subtitle}"
                      </Text>
                    ) : null}

                    <View style={styles.categoryTagWrap}>
                      <View style={[styles.categoryTagPill, { backgroundColor: theme.bgLight }]}>
                        <Text style={[styles.deckCategoryTag, { color: theme.badgeText }]}>
                          {theme.emoji} {deck.category}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Profile and Settings Modal */}
      <ProfileSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileBtn: {
    borderRadius: radii.full,
    ...shadows.sm,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 4,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  randomHeroBanner: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    ...shadows.glowRose,
  },
  randomHeroContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  randomHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: spacing.xs + 2,
  },
  randomHeroBadgeText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  randomHeroTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  randomHeroSub: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },
  randomHeroAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  searchClearBtn: {
    padding: spacing.xs,
  },
  categoriesScroll: {
    paddingVertical: 4,
    gap: spacing.xs + 4,
    marginBottom: spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  categoryPillTextSelected: {
    color: colors.textLight,
    fontWeight: typography.weights.bold,
  },
  decksSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  deckIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deckInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  deckTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  deckTitle: {
    fontSize: typography.sizes.md - 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  cardCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  cardCountText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  deckSubtitle: {
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  categoryTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryTagPill: {
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 1.5,
    borderRadius: radii.xs,
  },
  deckCategoryTag: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.semiBold,
  },
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
