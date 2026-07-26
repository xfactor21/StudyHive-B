import { useState, useEffect } from 'react';
import { auth, googleProvider, db, FIREBASE_READY } from './config';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getCountFromServer } from 'firebase/firestore';

function normalizeHandle(handle) {
  const cleaned = handle.trim().replace(/^@+/, '').replace(/\s+/g, '');
  return cleaned ? `@${cleaned}` : '';
}

/**
 * Real Firebase auth hook. Returns { user, profile, loading, signIn, signOut, isNewUser }.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!FIREBASE_READY || !auth || !db) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const ref = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setProfile(snap.data());
            setIsNewUser(false);
          } else {
            setProfile(null);
            setIsNewUser(true);
          }
        } catch (err) {
          // Most likely cause: Firestore security rules were never deployed
          // to the live project (firebase deploy --only firestore:rules),
          // so this read gets denied. Without this catch, that error was
          // silently swallowed and loading never resolved — a permanent
          // blank screen with no clue why.
          console.error('Failed to load user profile:', err);
          setProfile(null);
          setIsNewUser(false);
          setProfileError(err.message || 'Could not load your profile.');
        }
      } else {
        setProfile(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn() {
    if (!FIREBASE_READY || !auth || !googleProvider) {
      throw new Error('Firebase environment variables are missing.');
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async function signOutUser() {
    if (!auth) return;
    await signOut(auth);
  }

  async function createProfile({ displayName, handle, grade, school }) {
    if (!user || !db) throw new Error('createProfile called with no signed-in user');
    const ref = doc(db, 'users', user.uid);

    // Founding Bee: genuinely check how many accounts exist before this one.
    let isFoundingUser = false;
    try {
      const countSnap = await getCountFromServer(collection(db, 'users'));
      isFoundingUser = countSnap.data().count < 10;
    } catch (e) {
      console.error('Founding Bee check failed:', e);
    }

    const data = {
      displayName: displayName.trim(),
      handle: normalizeHandle(handle),
      grade: grade.trim(),
      school: school.trim(),
      bio: '',
      hunnies: 50,
      photoURL: user.photoURL || null,
      dob: null,
      status: 'online',
      badges: ['welcome'],
      counters: {
        hunniesEarnedLifetime: 50,
        isFoundingUser,
      },
    };
    await setDoc(ref, data);
    setProfile(data);
    setIsNewUser(false);
  }

  return { user, profile, loading, isNewUser, profileError, signIn, signOut: signOutUser, createProfile };
}
