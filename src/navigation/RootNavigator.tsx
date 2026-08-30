import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Main 6-Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          ...shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: typography.weights.medium,
        },
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

  // 4. Authenticated: App locked
  if (isLocked) {
    return <PasscodeScreen mode="unlock" />;
  }

  // 5. Authenticated & Unlocked -> Main navigation
  return (
    <NavigationContainer>
      {!isLinked ? <UnlinkedCoupleScreen /> : <MainTabs />}
    </NavigationContainer>
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
});
