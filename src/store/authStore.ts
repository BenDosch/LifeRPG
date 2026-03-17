import { create } from 'zustand';
import { getFirebaseAuth } from '../lib/firebase';
import { Platform } from 'react-native';

// Unified user type (works across native and web Firebase SDK)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  _setUser: (user: AuthUser | null) => void;
  _setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  _setUser: (user) => set({ user }),
  _setLoading: (loading) => set({ loading }),

  signInWithEmail: async (email, password) => {
    const auth = await getFirebaseAuth();
    if (Platform.OS === 'web') {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth as any, email, password);
    } else {
      await (auth as any).signInWithEmailAndPassword(email, password);
    }
  },

  signUpWithEmail: async (email, password) => {
    const auth = await getFirebaseAuth();
    if (Platform.OS === 'web') {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      await createUserWithEmailAndPassword(auth as any, email, password);
    } else {
      await (auth as any).createUserWithEmailAndPassword(email, password);
    }
  },

  signInWithGoogle: async () => {
    const auth = await getFirebaseAuth();
    if (Platform.OS === 'web') {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth as any, provider);
    } else {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const { idToken } = await GoogleSignin.signIn();
      // Dynamic import to get native auth credential
      const firebaseAuth = await import('@react-native-firebase/auth');
      const googleCredential = firebaseAuth.default.GoogleAuthProvider.credential(idToken);
      await (auth as any).signInWithCredential(googleCredential);
    }
  },

  signOut: async () => {
    // Tear down real-time listeners BEFORE revoking the auth token.
    // If listeners are still active when the token expires, Firestore fires
    // permission-denied errors on every pending snapshot callback.
    try {
      const { unmountCharacterListener } = require('./characterStore');
      const { unmountQuestListeners } = require('./questStore');
      const { unmountShopListeners } = require('./shopStore');
      unmountCharacterListener();
      unmountQuestListeners();
      unmountShopListeners();
    } catch (e) {
      console.warn('[authStore] Failed to unmount listeners before sign-out:', e);
    }

    const auth = await getFirebaseAuth();
    if (Platform.OS === 'web') {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth as any);
    } else {
      await (auth as any).signOut();
    }
  },
}));
