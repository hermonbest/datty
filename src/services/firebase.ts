import '../polyfills';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available in react-native entrypoint
import { getReactNativePersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId;

if (!apiKey || !projectId) {
  console.warn(
    '[Firebase Config] Warning: EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID is missing from environment. Verify .env is configured correctly.'
  );
}

const firebaseConfig = {
  apiKey: apiKey || 'mock-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.firebaseAuthDomain || 'mock-app.firebaseapp.com',
  projectId: projectId || 'mock-project-id',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || extra.firebaseDatabaseURL || undefined,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.firebaseStorageBucket || 'mock-project-id.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.firebaseMessagingSenderId || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId || '1:123456789:web:mockappid',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const rtdb: Database = getDatabase(app);
export default app;
