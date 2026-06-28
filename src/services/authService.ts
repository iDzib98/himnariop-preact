import type { User } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

let currentUser: User | null = null;
const listeners: Array<(user: User | null) => void> = [];

export function initAuth(): void {
  const auth = getFirebaseAuth();
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    listeners.forEach(cb => cb(user));
  });
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  listeners.push(callback);
  callback(currentUser);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    return result.user;
  } catch (err) {
    console.error('Google sign-in error:', err);
    return null;
  }
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await fbSignOut(auth);
  currentUser = null;
}
