import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Brain, Camera, PenTool, ArrowRight, Grid, Gamepad2, Home } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { GameId } from '../../types/games';
import { TopAppBar } from '../../components/TopAppBar';

import { TruthOrDareScreen } from './truthOrDare/TruthOrDareScreen';
import { WordGameScreen } from './word/WordGameScreen';
import { ChessGameScreen } from './chess/ChessGameScreen';
import { CoupleTriviaScreen } from './trivia/CoupleTriviaScreen';
import { TicTacToeScreen } from './tictactoe/TicTacToeScreen';
import { DreamHouseScreen } from './dreamHouse/DreamHouseScreen';

interface GamesScreenProps {
  onNavigateToChat?: (replyTo?: any) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface GameCardConfig {
  id: GameId;
  title: string;
  desc: string;
  tag: string;
  icon: any;
  imageUrl: any;
  tagBg: string;
  tagText: string;
  cardBg: string;
}

const GAMES: GameCardConfig[] = [
  {
    id: 'truth_or_dare',
    title: 'Truth or Dare',
    desc: 'Dive into secrets and bold challenges. Perfect for a cozy night in to test your boundaries playfully.',
    tag: 'Spicy',
    icon: Flame,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB38wTvT_hqffiQ2dd5BEata4FdbjVM9cihunacLUyUYY70WmV6W5-0kwzZ4WKyAek4D2-Zs8k4zqwDfw_hbmmJpbzqLkZdLciUGY2DXRf-G6lbfoonNSSRDdjHs1pPZqhQ6aemaBAvZuwG1Ef8nrEdEt0stxBS0Aflh1JiQiEkAixGwqGr783Yw4jceCLu3zl4CHuaKPyV5BXwoWfk0uwMbtzPtfdS1-LxS-S9OZaEs1w8jO46ko7d',
    tagBg: colors.primary,
    tagText: colors.onPrimary,
    cardBg: colors.surfaceContainer,
  },
  {
    id: 'couple_trivia',
    title: 'Trivia Night',
    desc: 'How well do you really know each other? Test your knowledge on your shared history.',
    tag: 'Brain',
    icon: Brain,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Zo8pACJyWsxm0QC3a60o6mNf07ipGXHjv-g7gQ5yaSt_RLkHyrXwlr79aXRnUS3wy-uKDlhVTBOYoC5mVTTGuUs0D4ZJlPsuL1125yrtKfbxBf9zAP7NUdA1VcHb6DJmP2_oYrIxsTzUPJUMP6zboe4KhQO4dB5GNeu01DaOS2SzbsvuHcbN6-0bd2v_kcqLr68X-mXZnQq-e_7C7PvzSwxc_ucKVTzTMmcwoq_1xozIW4ZHLjQ4',
    tagBg: colors.secondaryContainer,
    tagText: colors.onSecondaryContainer,
    cardBg: colors.surfaceContainerLow,
  },
  {
    id: 'word_guess',
    title: 'Word Guess',
    desc: 'Challenge your partner to a word guessing duel. Find the secret word in 6 tries!',
    tag: 'Brain',
    icon: Brain,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4qvXhnc10BSswQ6auUmXC9jBgqIQoitHuWIRkVVDYdgPvah_W1tifPVYlJwK30JNiO-gR3bKqqMZvCYOTf6vRHZORYnI1Zqs1-_Y35IXIwtii_aCN2UqeLXmxzAgZ8kKcnT-iYYDpHFX86CT7MKEcV0VJBgBoc-sRJxThQ6YDOCzDcEKCves_FlR8LdDs9YBqg7-IwLiREeYOn_6yN5LPwvfTekwPiqMaup7L3IcE5gVWaSrT0dN4',
    tagBg: colors.tertiaryFixed,
    tagText: colors.onTertiaryFixed,
    cardBg: '#f8ecee',
  },
  {
    id: 'tic_tac_toe',
    title: 'Tic Tac Toe',
    desc: 'A classic game of strategy. Play against each other in real-time!',
    tag: 'Classic',
    icon: Grid,
    imageUrl: require('../../../assets/tictactoe_card.jpg'),
    tagBg: colors.secondaryFixed,
    tagText: colors.onSecondaryFixed,
    cardBg: colors.surfaceContainer,
  },
  {
    id: 'chess',
    title: 'Chess',
    desc: 'The ultimate mind game. Test your strategy and planning in a classic match.',
    tag: 'Classic',
    icon: Gamepad2,
    imageUrl: require('../../../assets/chess_card.jpg'),
    tagBg: colors.secondaryFixed,
    tagText: colors.onSecondaryFixed,
    cardBg: colors.surfaceContainerLow,
  },
  {
    id: 'dream_house',
    title: 'Dream Sanctuary',
    desc: 'Design and build your dream love nest together in real-time. Drag and arrange cozy furniture in an isometric room.',
    tag: 'Cozy',
    icon: Home,
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    tagBg: colors.primary,
    tagText: colors.onPrimary,
    cardBg: colors.surfaceContainer,
  },
];

// Helper for hover/press animations
const AnimatedCard = ({ children, style, onPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.05)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
      }),
      Animated.spring(shadowOpacity, {
        toValue: 0.15,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(shadowOpacity, {
        toValue: 0.05,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const GamesScreen: React.FC<GamesScreenProps> = ({ onNavigateToChat }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const insets = useSafeAreaInsets();

  const handleShareToChat = (text: string) => {
    if (onNavigateToChat) {
      onNavigateToChat({ type: 'message', text });
    }
  };

  if (activeGame === 'truth_or_dare') {
    return <TruthOrDareScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }
  if (activeGame === 'word_guess') {
    return <WordGameScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }
  if (activeGame === 'chess') {
    return <ChessGameScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }
  if (activeGame === 'couple_trivia') {
    return <CoupleTriviaScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }
  if (activeGame === 'tic_tac_toe') {
    return <TicTacToeScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }
  if (activeGame === 'dream_house') {
    return <DreamHouseScreen onBack={() => setActiveGame(null)} onShareToChat={handleShareToChat} />;
  }

  return (
    <View style={styles.container}>
      <TopAppBar />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 64 + insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Play Together</Text>
          <Text style={styles.headerSubtitle}>
            Discover new ways to connect. Choose a game to spark joy, laughter, and deeper intimacy.
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Game 1: Truth or Dare (Hero) */}
          <AnimatedCard 
            onPress={() => setActiveGame('truth_or_dare')}
            style={[styles.heroCard, { backgroundColor: GAMES[0].cardBg }]}
          >
            <View style={isTablet ? styles.heroCardInnerTablet : styles.heroCardInnerMobile}>
              <View style={isTablet ? styles.heroImageWrapperTablet : styles.heroImageWrapperMobile}>
                <ImageBackground 
                  source={typeof GAMES[0].imageUrl === 'string' ? { uri: GAMES[0].imageUrl } : GAMES[0].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={isTablet ? styles.heroContentTablet : styles.heroContentMobile}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[0].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[0].tagText }]}>{GAMES[0].tag}</Text>
                  </View>
                  <Flame size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{GAMES[0].title}</Text>
                <Text style={styles.cardDesc}>{GAMES[0].desc}</Text>
                <View style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Play Now</Text>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* Row 2: 2 Column Squares */}
          <View style={styles.squareRow}>
            {/* Game 2: Trivia Night */}
            <AnimatedCard 
              onPress={() => setActiveGame('couple_trivia')}
              style={[styles.squareCard, { backgroundColor: GAMES[1].cardBg }]}
            >
              <View style={styles.squareImageWrapper}>
                <ImageBackground 
                  source={typeof GAMES[1].imageUrl === 'string' ? { uri: GAMES[1].imageUrl } : GAMES[1].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={styles.squareContent}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[1].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[1].tagText }]}>{GAMES[1].tag}</Text>
                  </View>
                  <Brain size={18} color={colors.secondary} />
                </View>
                <Text style={styles.cardTitleSm}>{GAMES[1].title}</Text>
                <Text style={styles.cardDescSm} numberOfLines={2}>{GAMES[1].desc}</Text>
                <View style={styles.arrowIcon}>
                  <ArrowRight size={20} color={colors.primary} />
                </View>
              </View>
            </AnimatedCard>

            {/* Game 3: Word Guess */}
            <AnimatedCard 
              onPress={() => setActiveGame('word_guess')}
              style={[styles.squareCard, { backgroundColor: GAMES[2].cardBg }]}
            >
              <View style={styles.squareImageWrapper}>
                <ImageBackground 
                  source={typeof GAMES[2].imageUrl === 'string' ? { uri: GAMES[2].imageUrl } : GAMES[2].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={styles.squareContent}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[2].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[2].tagText }]}>{GAMES[2].tag}</Text>
                  </View>
                  <Brain size={18} color={colors.secondary} />
                </View>
                <Text style={styles.cardTitleSm}>{GAMES[2].title}</Text>
                <Text style={styles.cardDescSm} numberOfLines={2}>{GAMES[2].desc}</Text>
                <View style={styles.arrowIcon}>
                  <ArrowRight size={20} color={colors.primary} />
                </View>
              </View>
            </AnimatedCard>
          </View>

          {/* Row 3: Tic Tac Toe and Chess */}
          <View style={styles.squareRow}>
            {/* Game 4: Tic Tac Toe */}
            <AnimatedCard 
              onPress={() => setActiveGame('tic_tac_toe')}
              style={[styles.squareCard, { backgroundColor: GAMES[3].cardBg }]}
            >
              <View style={styles.squareImageWrapper}>
                <ImageBackground 
                  source={typeof GAMES[3].imageUrl === 'string' ? { uri: GAMES[3].imageUrl } : GAMES[3].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={styles.squareContent}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[3].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[3].tagText }]}>{GAMES[3].tag}</Text>
                  </View>
                  <Grid size={18} color={colors.secondary} />
                </View>
                <Text style={styles.cardTitleSm}>{GAMES[3].title}</Text>
                <Text style={styles.cardDescSm} numberOfLines={2}>{GAMES[3].desc}</Text>
                <View style={styles.arrowIcon}>
                  <ArrowRight size={20} color={colors.primary} />
                </View>
              </View>
            </AnimatedCard>

            {/* Game 5: Chess */}
            <AnimatedCard 
              onPress={() => setActiveGame('chess')}
              style={[styles.squareCard, { backgroundColor: GAMES[4].cardBg }]}
            >
              <View style={styles.squareImageWrapper}>
                <ImageBackground 
                  source={typeof GAMES[4].imageUrl === 'string' ? { uri: GAMES[4].imageUrl } : GAMES[4].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={styles.squareContent}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[4].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[4].tagText }]}>{GAMES[4].tag}</Text>
                  </View>
                  <Gamepad2 size={18} color={colors.secondary} />
                </View>
                <Text style={styles.cardTitleSm}>{GAMES[4].title}</Text>
                <Text style={styles.cardDescSm} numberOfLines={2}>{GAMES[4].desc}</Text>
                <View style={styles.arrowIcon}>
                  <ArrowRight size={20} color={colors.primary} />
                </View>
              </View>
            </AnimatedCard>
          </View>

          {/* Row 4: Dream Sanctuary */}
          <AnimatedCard 
            onPress={() => setActiveGame('dream_house')}
            style={[styles.heroCard, { backgroundColor: GAMES[5].cardBg }]}
          >
            <View style={isTablet ? styles.heroCardInnerTablet : styles.heroCardInnerMobile}>
              <View style={isTablet ? styles.heroImageWrapperTablet : styles.heroImageWrapperMobile}>
                <ImageBackground 
                  source={typeof GAMES[5].imageUrl === 'string' ? { uri: GAMES[5].imageUrl } : GAMES[5].imageUrl} 
                  style={styles.bgImage} 
                />
              </View>
              <View style={isTablet ? styles.heroContentTablet : styles.heroContentMobile}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagBadge, { backgroundColor: GAMES[5].tagBg }]}>
                    <Text style={[styles.tagText, { color: GAMES[5].tagText }]}>{GAMES[5].tag}</Text>
                  </View>
                  <Home size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{GAMES[5].title}</Text>
                <Text style={styles.cardDesc}>{GAMES[5].desc}</Text>
                <View style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Build Together</Text>
                </View>
              </View>
            </View>
          </AnimatedCard>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xxl + 80, // Accounts for bottom nav
  },
  headerSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    alignItems: isTablet ? 'flex-start' : 'center',
  },
  headerTitle: {
    ...typography.displayLg,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: isTablet ? 'left' : 'center',
  },
  headerSubtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: isTablet ? 'left' : 'center',
    maxWidth: 600,
  },
  bentoGrid: {
    gap: spacing.lg,
  },
  heroCard: {
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroCardInnerMobile: {
    flexDirection: 'column',
  },
  heroCardInnerTablet: {
    flexDirection: 'row',
  },
  heroReverseInnerTablet: {
    flexDirection: 'row-reverse',
  },
  heroImageWrapperMobile: {
    width: '100%',
    height: 192, // h-48
  },
  heroImageWrapperTablet: {
    width: '50%',
    minHeight: 320,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroContentMobile: {
    padding: spacing.xl,
    backgroundColor: 'rgba(252, 234, 233, 0.9)', // surface-container with opacity
  },
  heroContentTablet: {
    width: '50%',
    padding: spacing.xl,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  tagText: {
    ...typography.labelSm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  cardDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.lg,
    alignSelf: 'flex-start',
  },
  primaryBtnText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.lg,
    alignSelf: 'flex-start',
  },
  outlineBtnText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  squareRow: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: spacing.lg,
  },
  squareCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 193, 196, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  squareImageWrapper: {
    width: '100%',
    height: 160,
  },
  squareContent: {
    padding: spacing.lg,
    flex: 1,
  },
  cardTitleSm: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  cardDescSm: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    flex: 1,
  },
  arrowIcon: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 'auto',
  }
});
