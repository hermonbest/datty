import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Us',
  slug: 'us-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  plugins: ['expo-asset', 'expo-audio'],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF7F5',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.usapp.couple',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FAF7F5',
    },
    package: 'com.usapp.couple',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'dummy-project-id',
    },
  },
});
