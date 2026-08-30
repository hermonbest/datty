import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { CardDeck, DECKS_DATA, CATEGORIES } from './decksData';
import { getCategoryTheme, ICON_MAP } from './categoryTheme';
import { CardPlayerScreen } from './CardPlayerScreen';
import { colors, radii, shadows, spacing } from '../../theme';
import { Avatar, ProfileSettingsModal } from '../../components';
import { useCouple } from '../../services/coupleContext';
import {
  Sparkles,
  Search,
  X,
  Heart,
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
  const { partnerProfile } = useCouple();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDeck, setActiveDeck] = useState<CardDeck | null>(null);

  // Fast filtered decks using pre-computed search index
  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DECKS_DATA;
    return PRE_INDEXED_DECKS.filter(({ searchIndex }) => searchIndex.includes(q))
      .map(({ deck }) => deck);
  }, [searchQuery]);

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

  const renderHeader = () => (
    <View style={styles.topAppBar}>
      <View style={styles.headerLeft}>
        <Avatar
          name={partnerProfile?.displayName || 'Partner'}
          photoURL={partnerProfile?.photoURL}
          size="sm"
          style={styles.headerAvatar}
        />
      </View>
      <Text style={styles.headerTitle}>Datty</Text>
      <TouchableOpacity style={styles.heartBtn} activeOpacity={0.7}>
        <Heart size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="rgba(84, 66, 69, 0.6)" style={styles.searchIcon} />
            <TextInput
              placeholder="Search decks..."
              placeholderTextColor="rgba(84, 66, 69, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <X size={16} color="rgba(84, 66, 69, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Decks Grid / List */}
        <View style={styles.decksSection}>
          <Text style={styles.sectionTitle}>Explore Decks</Text>

          {filteredDecks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No matching decks found</Text>
              <Text style={styles.emptySub}>Try adjusting your search.</Text>
            </View>
          ) : (
            <View style={styles.decksGrid}>
              {filteredDecks.map((deck, index) => {
                const IconComponent = ICON_MAP[deck.iconName] || Sparkles;
                const styleType = index % 4;

                switch (styleType) {
                  case 0:
                    // Style 1: Primary Container
                    return (
                      <TouchableOpacity
                        key={deck.id}
                        activeOpacity={0.9}
                        onPress={() => setActiveDeck(deck)}
                        style={styles.cardType0}
                      >
                        <View style={styles.card0IconBg}>
                          <IconComponent size={120} color={colors.onPrimaryContainer} />
                        </View>
                        <View style={styles.card0Content}>
                          <IconComponent size={24} color={colors.onPrimaryContainer} style={{ marginBottom: 8 }} />
                          <Text style={styles.card0Title}>{deck.title}</Text>
                          <Text style={styles.card0Subtitle}>{deck.subtitle}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  case 1:
                    // Style 2: Tertiary Container
                    return (
                      <TouchableOpacity
                        key={deck.id}
                        activeOpacity={0.9}
                        onPress={() => setActiveDeck(deck)}
                        style={styles.cardType1}
                      >
                        <IconComponent size={24} color={colors.onTertiaryContainer || '#d8aeae'} style={{ marginBottom: 16 }} />
                        <View>
                          <Text style={styles.card1Title}>{deck.title}</Text>
                          <Text style={styles.card1Subtitle}>{deck.subtitle}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  case 2:
                    // Style 3: Surface Variant
                    return (
                      <TouchableOpacity
                        key={deck.id}
                        activeOpacity={0.9}
                        onPress={() => setActiveDeck(deck)}
                        style={styles.cardType2}
                      >
                        <IconComponent size={24} color={colors.primary} style={{ marginBottom: 16 }} />
                        <View>
                          <Text style={styles.card2Title}>{deck.title}</Text>
                          <Text style={styles.card2Subtitle}>{deck.subtitle}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  case 3:
                    // Style 4: Spicy (Error themed)
                    return (
                      <TouchableOpacity
                        key={deck.id}
                        activeOpacity={0.9}
                        onPress={() => setActiveDeck(deck)}
                        style={styles.cardType3}
                      >
                        <View style={styles.card3IconWrap}>
                          <IconComponent size={24} color="#93000a" fill="#93000a" />
                        </View>
                        <View style={styles.card3Content}>
                          <Text style={styles.card3Title}>{deck.title}</Text>
                          <Text style={styles.card3Subtitle}>{deck.subtitle}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  default:
                    return null;
                }
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#fff8f7',
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 248, 247, 0.8)',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh || '#f6e4e4',
  },
  headerTitle: {
    fontFamily: 'ebGaramond',
    fontSize: 28,
    fontWeight: '500',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  heartBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120, // Space for bottom nav
  },
  searchSection: {
    marginBottom: 24, // mb-lg
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 221, 223, 0.3)', // secondary-container/30
    borderRadius: 24, // rounded-full
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.5)', // outline-variant/50
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'manrope',
    color: colors.onSurface || '#221919',
  },
  searchClearBtn: {
    padding: 8,
  },
  decksSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 28, // md:text-headline-lg, let's use 28 for mobile
    fontFamily: 'ebGaramond',
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 16,
  },
  decksGrid: {
    gap: 16, // gap-4
  },
  
  // Style 1: Primary Container
  cardType0: {
    backgroundColor: colors.primaryContainer || '#7d2d44',
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    minHeight: 160,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: colors.primary || '#60162e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  card0IconBg: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.2,
  },
  card0Content: {
    zIndex: 10,
    width: '80%',
  },
  card0Title: {
    fontFamily: 'ebGaramond',
    fontSize: 24, // headline-md
    fontWeight: '500',
    color: colors.onPrimaryContainer || '#ff9bb2',
    marginBottom: 4,
  },
  card0Subtitle: {
    fontFamily: 'manrope',
    fontSize: 14, // text-sm
    color: colors.onPrimaryContainer || '#ff9bb2',
    opacity: 0.8,
  },

  // Style 2: Tertiary Container
  cardType1: {
    backgroundColor: colors.tertiaryContainer || '#604141',
    borderRadius: 12,
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: colors.tertiary || '#472b2c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  card1Title: {
    fontFamily: 'ebGaramond',
    fontSize: 24,
    fontWeight: '500',
    color: colors.onTertiaryContainer || '#d8aeae',
    marginBottom: 4,
  },
  card1Subtitle: {
    fontFamily: 'manrope',
    fontSize: 14,
    color: colors.onTertiaryContainer || '#d8aeae',
    opacity: 0.8,
  },

  // Style 3: Surface Variant
  cardType2: {
    backgroundColor: colors.surfaceVariant || '#f0dfde',
    borderRadius: 12,
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)', // outline-variant/30
  },
  card2Title: {
    fontFamily: 'ebGaramond',
    fontSize: 24,
    fontWeight: '500',
    color: colors.primary || '#60162e',
    marginBottom: 4,
  },
  card2Subtitle: {
    fontFamily: 'manrope',
    fontSize: 14,
    color: colors.onSurfaceVariant || '#544245',
    opacity: 0.8,
  },

  // Style 4: Spicy Theme
  cardType3: {
    backgroundColor: colors.surfaceContainerLow || '#fff0f0',
    borderRadius: 12,
    padding: 24,
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.errorContainer || '#ffdad6',
  },
  card3IconWrap: {
    padding: 16,
    borderRadius: 32, // full
    backgroundColor: 'rgba(255, 218, 214, 0.5)', // error-container/50
  },
  card3Content: {
    flex: 1,
  },
  card3Title: {
    fontFamily: 'ebGaramond',
    fontSize: 24,
    fontWeight: '500',
    color: colors.onErrorContainer || '#93000a',
    marginBottom: 4,
  },
  card3Subtitle: {
    fontFamily: 'manrope',
    fontSize: 14,
    color: colors.onErrorContainer || '#93000a',
    opacity: 0.8,
  },

  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 4,
    fontFamily: 'manrope',
  },
  emptySub: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    fontFamily: 'manrope',
  },
});
