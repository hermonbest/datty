import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Couple, UserProfile } from '../types';

export interface CoupleContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  partnerProfile: UserProfile | null;
  couple: Couple | null;
  coupleId: string | null;
  myUid: string | null;
  partnerUid: string | null;
  isLinked: boolean;
  loading: boolean;
  error: string | null;
  refreshCouple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue>({
  user: null,
  userProfile: null,
  partnerProfile: null,
  couple: null,
  coupleId: null,
  myUid: null,
  partnerUid: null,
  isLinked: false,
  loading: true,
  error: null,
  refreshCouple: async () => {},
  signOut: async () => {},
});

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sign out helper
  const handleSignOut = useCallback(async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setPartnerProfile(null);
      setCouple(null);
      setCoupleId(null);
      setPartnerUid(null);
    } catch (e: any) {
      console.error('[CoupleContext] Sign out error:', e);
    }
  }, []);

  // Fetch partner profile
  const fetchPartnerProfile = useCallback(async (pUid: string) => {
    try {
      const partnerDocRef = doc(db, 'users', pUid);
      const snap = await getDoc(partnerDocRef);
      if (snap.exists()) {
        const data = snap.data();
        setPartnerProfile({
          uid: pUid,
          displayName: data.displayName || 'Partner',
          email: data.email || '',
          photoURL: data.photoURL || null,
          coupleId: data.coupleId || null,
          createdAt: data.createdAt,
        });
      }
    } catch (err: any) {
      console.log('[CoupleContext] Partner profile read:', err?.message);
    }
  }, []);

  // Main listener for auth & couple doc
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeCoupleDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Tear down previous listeners to prevent memory leaks & Firestore permission errors on logout
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      if (unsubscribeCoupleDoc) {
        unsubscribeCoupleDoc();
        unsubscribeCoupleDoc = null;
      }

      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setPartnerProfile(null);
        setCouple(null);
        setCoupleId(null);
        setPartnerUid(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Listen to users/{myUid}
      const userRef = doc(db, 'users', currentUser.uid);
      unsubscribeUserDoc = onSnapshot(
        userRef,
        async (userSnap) => {
          if (!userSnap.exists()) {
            // User doc doesn't exist yet, wait for creation or signup
            setUserProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || null,
              coupleId: null,
              createdAt: new Date(),
            });
            setCoupleId(null);
            setLoading(false);
            return;
          }

          const userData = userSnap.data();
          const currentCoupleId = userData.coupleId || null;

          setUserProfile({
            uid: currentUser.uid,
            displayName: userData.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
            email: userData.email || currentUser.email || '',
            photoURL: userData.photoURL || currentUser.photoURL || null,
            coupleId: currentCoupleId,
            createdAt: userData.createdAt,
          });

          setCoupleId(currentCoupleId);

          if (!currentCoupleId) {
            if (unsubscribeCoupleDoc) {
              unsubscribeCoupleDoc();
              unsubscribeCoupleDoc = null;
            }
            setCouple(null);
            setPartnerUid(null);
            setPartnerProfile(null);
            setLoading(false);
            return;
          }

          // Clean up any existing couple listener before subscribing to the new one
          if (unsubscribeCoupleDoc) {
            unsubscribeCoupleDoc();
            unsubscribeCoupleDoc = null;
          }

          const coupleRef = doc(db, 'couples', currentCoupleId);
          unsubscribeCoupleDoc = onSnapshot(
            coupleRef,
            (coupleSnap) => {
              if (coupleSnap.exists()) {
                const cData = coupleSnap.data();
                const members = (cData.memberUids || []) as [string, string];
                const pUid = members.find((uid) => uid !== currentUser.uid) || null;

                setCouple({
                  id: coupleSnap.id,
                  memberUids: members,
                  createdAt: cData.createdAt,
                  timezone: cData.timezone || 'UTC',
                });
                setPartnerUid(pUid);

                if (pUid) {
                  fetchPartnerProfile(pUid);
                }
              }
              setLoading(false);
            },
            (cErr) => {
              console.warn('[CoupleContext] Couple listener error:', cErr);
              setError(cErr.message);
              setLoading(false);
            }
          );
        },
        (uErr) => {
          console.warn('[CoupleContext] User listener error:', uErr);
          setError(uErr.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      if (unsubscribeCoupleDoc) {
        unsubscribeCoupleDoc();
        unsubscribeCoupleDoc = null;
      }
    };
  }, [fetchPartnerProfile]);

  const refreshCouple = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const cId = userSnap.data()?.coupleId || null;
        setCoupleId(cId);
        if (cId) {
          const cRef = doc(db, 'couples', cId);
          const cSnap = await getDoc(cRef);
          if (cSnap.exists()) {
            const cData = cSnap.data();
            const members = (cData.memberUids || []) as [string, string];
            const pUid = members.find((uid) => uid !== user.uid) || null;
            setCouple({
              id: cSnap.id,
              memberUids: members,
              createdAt: cData.createdAt,
              timezone: cData.timezone || 'UTC',
            });
            setPartnerUid(pUid);
            if (pUid) fetchPartnerProfile(pUid);
          }
        }
      }
    } catch (e: any) {
      console.error('[CoupleContext] Refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPartnerProfile]);

  const isLinked = Boolean(coupleId && partnerUid);

  return (
    <CoupleContext.Provider
      value={{
        user,
        userProfile,
        partnerProfile,
        couple,
        coupleId,
        myUid: user ? user.uid : null,
        partnerUid,
        isLinked,
        loading,
        error,
        refreshCouple,
        signOut: handleSignOut,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => useContext(CoupleContext);
