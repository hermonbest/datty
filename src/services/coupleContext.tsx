import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Couple, UserProfile } from '../types';
import { cache, CacheKeys } from './cache';

interface CachedCoupleState {
  userProfile: UserProfile | null;
  partnerProfile: UserProfile | null;
  couple: Couple | null;
  coupleId: string | null;
  partnerUid: string | null;
}

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
  updateProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) => Promise<void>;
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
  updateProfile: async () => {},
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
      await cache.clear();
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

  // Fetch partner profile with caching
  const fetchPartnerProfile = useCallback(async (pUid: string, cUid?: string) => {
    try {
      const cached = cache.getMemory<UserProfile>(CacheKeys.partnerProfile(pUid));
      if (cached) {
        setPartnerProfile(cached);
      }
      const partnerDocRef = doc(db, 'users', pUid);
      const snap = await getDoc(partnerDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const prof: UserProfile = {
          uid: pUid,
          displayName: data.displayName || 'Partner',
          email: data.email || '',
          photoURL: data.photoURL || null,
          coupleId: data.coupleId || null,
          expoPushToken: data.expoPushToken || null,
          notificationPreferences: data.notificationPreferences || undefined,
          createdAt: data.createdAt,
        };
        setPartnerProfile(prof);
        cache.set(CacheKeys.partnerProfile(pUid), prof);
        if (cUid) {
          const current = cache.getMemory<CachedCoupleState>(CacheKeys.couple(cUid));
          if (current) {
            cache.set(CacheKeys.couple(cUid), { ...current, partnerProfile: prof });
          }
        }
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

      // Check for cached couple state for 0ms cold start
      const cached = await cache.get<CachedCoupleState>(CacheKeys.couple(currentUser.uid));
      if (cached) {
        setUserProfile(cached.userProfile);
        setPartnerProfile(cached.partnerProfile);
        setCouple(cached.couple);
        setCoupleId(cached.coupleId);
        setPartnerUid(cached.partnerUid);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);

      // Listen to users/{myUid}
      const userRef = doc(db, 'users', currentUser.uid);
      unsubscribeUserDoc = onSnapshot(
        userRef,
        async (userSnap) => {
          if (!userSnap.exists()) {
            // User doc doesn't exist yet, wait for creation or signup
            const fallbackProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || null,
              coupleId: null,
              createdAt: new Date(),
            };
            setUserProfile(fallbackProfile);
            setCoupleId(null);
            setLoading(false);
            return;
          }

          const userData = userSnap.data();
          const currentCoupleId = userData.coupleId || null;

          const updatedProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: userData.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
            email: userData.email || currentUser.email || '',
            photoURL: userData.photoURL || currentUser.photoURL || null,
            coupleId: currentCoupleId,
            expoPushToken: userData.expoPushToken || null,
            notificationPreferences: userData.notificationPreferences || undefined,
            createdAt: userData.createdAt,
          };

          setUserProfile(updatedProfile);
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
            cache.set(CacheKeys.couple(currentUser.uid), {
              userProfile: updatedProfile,
              partnerProfile: null,
              couple: null,
              coupleId: null,
              partnerUid: null,
            });
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

                const loadedCouple: Couple = {
                  id: coupleSnap.id,
                  memberUids: members,
                  createdAt: cData.createdAt,
                  timezone: cData.timezone || 'UTC',
                };

                setCouple(loadedCouple);
                setPartnerUid(pUid);

                // Persist combined couple state to cache
                const currentCache = cache.getMemory<CachedCoupleState>(CacheKeys.couple(currentUser.uid));
                cache.set(CacheKeys.couple(currentUser.uid), {
                  userProfile: updatedProfile,
                  partnerProfile: currentCache?.partnerProfile || null,
                  couple: loadedCouple,
                  coupleId: currentCoupleId,
                  partnerUid: pUid,
                });

                if (pUid) {
                  fetchPartnerProfile(pUid, currentUser.uid);
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

  // Update the current user's profile document (e.g. displayName, photoURL).
  // Firestore onSnapshot above keeps userProfile in sync automatically.
  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) => {
      if (!user) throw new Error('Not authenticated');
      await updateDoc(doc(db, 'users', user.uid), patch);
    },
    [user]
  );

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
        updateProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => useContext(CoupleContext);
