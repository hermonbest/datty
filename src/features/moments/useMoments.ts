import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadFileToCloudinary, getFileSizeBytes } from '../../services/fileToBytes';
import { useCouple } from '../../services/coupleContext';
import { Moment } from '../../types';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // mirrors storage.rules cap

export const useMoments = () => {
  const { coupleId, myUid } = useCouple();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Realtime subscription to moments
  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const momentsCol = collection(db, 'couples', coupleId, 'moments');
    const q = query(momentsCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Moment[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            authorUid: data.authorUid,
            imageURL: data.imageURL,
            caption: data.caption || '',
            createdAt: data.createdAt,
          };
        });
        setMoments(items);
        setLoading(false);
      },
      (err) => {
        console.warn('[useMoments] Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coupleId]);

  // Real manual refresh for pull-to-refresh
  const refreshMoments = useCallback(async () => {
    if (!coupleId) return;
    try {
      const momentsCol = collection(db, 'couples', coupleId, 'moments');
      const q = query(momentsCol, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const items: Moment[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          authorUid: data.authorUid,
          imageURL: data.imageURL,
          caption: data.caption || '',
          createdAt: data.createdAt,
        };
      });
      setMoments(items);
    } catch (err: any) {
      console.warn('[useMoments] Refresh error:', err);
    }
  }, [coupleId]);

  // Upload image via Cloudinary (no Firebase Storage)
  const uploadImage = useCallback(
    async (uri: string, pathPrefix: string = 'moments'): Promise<string> => {
      if (!coupleId) throw new Error('Couple not found');

      setUploadProgress(0);
      const size = await getFileSizeBytes(uri);
      if (size !== null && size > MAX_UPLOAD_BYTES) {
        throw new Error('Photo is too large to post (max 15MB).');
      }

      const folder = `couples/${coupleId}/${pathPrefix}`;
      const downloadURL = await uploadFileToCloudinary(uri, 'image', folder);
      setUploadProgress(100);
      return downloadURL;
    },
    [coupleId]
  );

  // Create a new moment
  const createMoment = useCallback(
    async (imageUri: string, caption: string) => {
      if (!coupleId || !myUid) throw new Error('Not authenticated');

      setUploading(true);
      setUploadProgress(0);
      setError(null);
      try {
        const imageURL = await uploadImage(imageUri, 'moments');
        const momentsCol = collection(db, 'couples', coupleId, 'moments');

        await addDoc(momentsCol, {
          authorUid: myUid,
          imageURL,
          caption: caption.trim(),
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.error('[useMoments] Create moment error:', err);
        setError(err.message || 'Failed to post moment.');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [coupleId, myUid, uploadImage]
  );

  // Delete own moment
  const deleteMoment = useCallback(
    async (momentId: string) => {
      if (!coupleId) return;
      try {
        const momentRef = doc(db, 'couples', coupleId, 'moments', momentId);
        await deleteDoc(momentRef);
      } catch (err: any) {
        console.error('[useMoments] Delete moment error:', err);
        throw err;
      }
    },
    [coupleId]
  );

  return {
    moments,
    loading,
    uploading,
    uploadProgress,
    error,
    uploadImage,
    createMoment,
    deleteMoment,
    refreshMoments,
  };
};
