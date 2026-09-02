import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCouple } from '../services/coupleContext';
import { usePasscode } from '../services/passcodeContext';
import { PasscodeScreen } from '../features/passcode/PasscodeScreen';
import { colors, radii, shadows, spacing, typography } from '../theme';

// Auth screens
import { SignInScreen } from '../features/auth/SignInScreen';
import { SignUpScreen } from '../features/auth/SignUpScreen';
import { UnlinkedCoupleScreen } from '../features/auth/UnlinkedCoupleScreen';

// Feature screens
import { DailyQuestionScreen } from '../features/dailyQuestion/DailyQuestionScreen';
import { PastQuestionsScreen } from '../features/dailyQuestion/PastQuestionsScreen';
import { DecksScreen } from '../features/cards/DecksScreen';
import { GamesScreen } from '../features/games/GamesScreen';
import { MomentsFeedScreen } from '../features/moments/MomentsFeedScreen';
import { ChatScreen } from '../features/chat/ChatScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';

// Icons
import {
  Sparkles,
  Layers,
  Gamepad2,
  Camera,
  MessageCircle,
  Calendar as CalendarIcon,
  Heart,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Daily Question Stack (for History Screen navigation)
function DailyQuestionStack({ navigation }: any) {
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <PastQuestionsScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <DailyQuestionScreen
      onOpenHistory={() => setShowHistory(true)}
      onOpenDecks={() => navigation.navigate('CardsTab')}
    />
  );
}

// Cards Stack
function CardsStack({ navigation }: any) {
  return (
    <DecksScreen
      onNavigateToChat={(replyTo?: any) => navigation.navigate('ChatTab', { replyTo })}
    />
  );
}

// Games Stack
function GamesStack({ navigation }: any) {
  return (
    <GamesScreen
      onNavigateToChat={(replyTo?: any) => navigation.navigate('ChatTab', { replyTo })}
    />
  );
}

// Custom Tab Bar replicating HTML design
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;
        
        const onPress = () => {
          console.log('[navigation-ui] Tab tapped:', route.name);
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.tabItem, isFocused && styles.tabItemFocused]}
          >
            {options.tabBarIcon?.({ 
               focused: isFocused, 
               color: isFocused ? colors.onPrimaryFixedVariant : colors.onSecondaryFixedVariant, 
               size: 24 
            })}
            <Text style={[styles.tabLabel, isFocused ? styles.tabLabelFocused : styles.tabLabelInactive]}>
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Main 6-Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={DailyQuestionStack}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CardsTab"
        component={CardsStack}
        options={{
          tabBarLabel: 'Cards',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesStack}
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ color, size }) => <Gamepad2 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MomentsTab"
        component={MomentsFeedScreen}
        options={{
          tabBarLabel: 'Moments',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => <CalendarIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}


// Auth Stack
function AuthStack() {
  const [screen, setScreen] = useState<'signin' | 'signup'>('signin');

  if (screen === 'signup') {
    return <SignUpScreen onNavigateToSignIn={() => setScreen('signin')} />;
  }
  return <SignInScreen onNavigateToSignUp={() => setScreen('signup')} />;
}

// Full-screen overlay that locks the app while keeping MainTabs mounted, so
// in-progress work (voice recordings, drafts, picked images) survives a lock.
function LockOverlay() {
  useEffect(() => {
    // Android hardware back must not exit the app while locked.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  return (
    <View style={styles.lockOverlay} pointerEvents="auto">
      <PasscodeScreen mode="unlock" />
    </View>
  );
}

// Root Navigator
export const RootNavigator: React.FC = () => {
  const { user, isLinked, loading: coupleLoading } = useCouple();
  const { isConfigured, isLocked, loading: passcodeLoading } = usePasscode();

  // 1. Splash loading state
  if (passcodeLoading || coupleLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashIconCircle}>
          <Heart size={44} color={colors.primary} fill={colors.primary} />
        </View>
        <Text style={styles.splashTitle}>Us</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // 2. Unauthenticated -> Auth Stack
  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // 3. Authenticated: First-time passcode setup
  if (!isConfigured) {
    return <PasscodeScreen mode="setup" />;
  }

  // 4/5. Authenticated & configured: the app stays mounted at all times; the
  //      passcode locks it via a full-screen overlay. Nothing unmounts on a
  //      lock trip, so recordings/drafts/picked images are preserved.
  return (
    <View style={styles.lockedRoot}>
      <View style={styles.appLayer}>
        <NavigationContainer>
          {!isLinked ? <UnlinkedCoupleScreen /> : <MainTabs />}
        </NavigationContainer>
      </View>
      {isLocked && <LockOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  splashTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  lockedRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appLayer: {
    flex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: colors.background,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 247, 0.9)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.sm,
    shadowColor: colors.surfaceTint,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  tabItemFocused: {
    backgroundColor: colors.primaryFixed,
  },
  tabLabel: {
    ...typography.labelSm,
    marginTop: 4,
  },
  tabLabelFocused: {
    color: colors.onPrimaryFixedVariant,
  },
  tabLabelInactive: {
    color: colors.onSecondaryFixedVariant,
  },
});
