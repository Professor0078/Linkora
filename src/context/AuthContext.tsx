import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  ensureUserAccountAndProfile,
  fetchOwnerLinks,
} from '../lib/firestoreService';
import {
  BioLink,
  ProfileConfig,
  SubscriptionRecord,
  UserAccount,
} from '../types/linkora';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  account: UserAccount | null;
  profile: ProfileConfig | null;
  subscription: SubscriptionRecord | null;
  links: BioLink[];
  isAdmin: boolean;
  loading: boolean;
  needsEmailVerification: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function formatFriendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing login.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/operation-not-allowed':
      return 'PROVIDER_NOT_ENABLED: Email/Password sign-in is not yet enabled in your Firebase Console. Enable it under Firebase Console > Authentication > Sign-in method, or sign in with Google right now.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<ProfileConfig | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAccountBundle = useCallback(async (user: FirebaseUser) => {
    if (!user.emailVerified) {
      setAccount(null);
      setProfile(null);
      setSubscription(null);
      setLinks([]);
      setIsAdmin(false);
      return;
    }

    const bundle = await ensureUserAccountAndProfile(user);
    const ownerLinks = await fetchOwnerLinks(user.uid);
    setAccount(bundle.account);
    setProfile(bundle.profile);
    setSubscription(bundle.subscription);
    setLinks(ownerLinks);
    setIsAdmin(bundle.isAdmin);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAccount(null);
        setProfile(null);
        setSubscription(null);
        setLinks([]);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        await loadAccountBundle(user);
      } catch (err) {
        console.error('Failed to load account bundle:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadAccountBundle]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      throw new Error(formatFriendlyAuthError(err));
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      throw new Error(formatFriendlyAuthError(err));
    }
  };

  const registerWithEmail = async (displayName: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 80) });
      }
      await sendEmailVerification(cred.user);
    } catch (err) {
      throw new Error(formatFriendlyAuthError(err));
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(formatFriendlyAuthError(err));
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw new Error(formatFriendlyAuthError(err));
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const updatedUser = auth.currentUser;
    setFirebaseUser({ ...updatedUser } as FirebaseUser);
    if (updatedUser.emailVerified) {
      setLoading(true);
      try {
        await loadAccountBundle(updatedUser);
      } finally {
        setLoading(false);
      }
      return true;
    }
    return false;
  };

  const refreshUserData = useCallback(async () => {
    if (!auth.currentUser) return;
    await loadAccountBundle(auth.currentUser);
  }, [loadAccountBundle]);

  const logout = async () => {
    await signOut(auth);
  };

  const needsEmailVerification = Boolean(firebaseUser && !firebaseUser.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        account,
        profile,
        subscription,
        links,
        isAdmin,
        loading,
        needsEmailVerification,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        refreshVerificationStatus,
        refreshUserData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
