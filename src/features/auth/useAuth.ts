import { useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const signIn = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      // Ensure user document exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          displayName: user.displayName || email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || null,
          coupleId: null,
          createdAt: serverTimestamp(),
        });
      }
      return user;
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err.code || '');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    setError(null);
    let createdUser: any = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;
      createdUser = user;

      // Update auth profile
      await updateProfile(user, { displayName: displayName.trim() });

      // Create initial Firestore user document with coupleId: null
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: displayName.trim(),
        email: user.email,
        photoURL: null,
        coupleId: null,
        createdAt: serverTimestamp(),
      });

      return user;
    } catch (err: any) {
      if (createdUser && err?.code !== 'auth/email-already-in-use') {
        // Rollback orphaned auth user if Firestore profile document failed to write
        await createdUser.delete().catch(() => {});
      }
      const msg = getFriendlyErrorMessage(err.code || '');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err.code || '');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    resetPassword,
    loading,
    error,
    clearError: () => setError(null),
  };
};
