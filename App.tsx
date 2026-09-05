import './src/polyfills';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from './src/components';
import { CoupleProvider } from './src/services/coupleContext';
import { PasscodeProvider } from './src/services/passcodeContext';
import { NotesModalProvider } from './src/services/notesModalContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <PasscodeProvider>
          <CoupleProvider>
            <NotesModalProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </NotesModalProvider>
          </CoupleProvider>
        </PasscodeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
