import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/services/firebase/config';
import { UserProfile } from '@/types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  emailVerified: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (workspaceId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_SANDBOX_USER: UserProfile = {
  uid: 'usr_alex_mercer_01',
  email: 'alex.mercer@deployhq.dev',
  displayName: 'Alex Mercer',
  title: 'Principal Cloud Architect',
  company: 'Acme Cloud Engineering',
  timezone: 'UTC-05:00 (America/New_York)',
  onboardingCompleted: true,
  preferences: {
    theme: 'dark',
    emailAlerts: true,
    pushAlerts: true,
    deploymentNotifications: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_SANDBOX_USER);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  useEffect(() => {
    const theme = user?.preferences?.theme || 'dark';
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [user?.preferences?.theme]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setEmailVerified(fbUser.emailVerified || true);
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUser(snap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@deployhq.dev',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
            photoURL: fbUser.photoURL || undefined,
            onboardingCompleted: false,
            preferences: {
              theme: 'dark',
              emailAlerts: true,
              pushAlerts: true,
              deploymentNotifications: true,
            },
          };
          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUser(newProfile);
        }
      } catch {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || 'user@deployhq.dev',
          displayName: fbUser.displayName || 'Developer',
          onboardingCompleted: true,
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (isFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }
    setUser({
      ...DEFAULT_SANDBOX_USER,
      email: email.trim(),
      displayName: email.split('@')[0].replace(/[._]/g, ' '),
      onboardingCompleted: true,
    });
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    if (isFirebaseConfigured) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Ignore verification email error in emulator
      }
      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName: name,
        onboardingCompleted: false,
        preferences: {
          theme: 'dark',
          emailAlerts: true,
          pushAlerts: true,
          deploymentNotifications: true,
        },
      };
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUser(profile);
      return;
    }

    setUser({
      uid: `usr_${Date.now().toString(36)}`,
      email: email.trim(),
      displayName: name.trim(),
      onboardingCompleted: false,
      preferences: {
        theme: 'dark',
        emailAlerts: true,
        pushAlerts: true,
        deploymentNotifications: true,
      },
    });
  };

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return;
    }
    setUser({
      ...DEFAULT_SANDBOX_USER,
      onboardingCompleted: true,
    });
  };

  const sendPasswordReset = async (email: string) => {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const resendVerificationEmail = async () => {
    if (isFirebaseConfigured && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
    setEmailVerified(true);
  };

  const updateUserProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const merged: UserProfile = {
      ...user,
      ...updates,
      preferences: {
        ...user.preferences,
        ...(updates.preferences || {}),
      },
    };
    setUser(merged);

    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const completeOnboarding = async (workspaceId: string) => {
    await updateUserProfileData({
      defaultWorkspaceId: workspaceId,
      onboardingCompleted: true,
    });
  };

  const signOut = async () => {
    if (isFirebaseConfigured) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        emailVerified,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        updateUserProfileData,
        completeOnboarding,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

