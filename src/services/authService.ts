import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseEnabled, getFirebaseAuth } from "@/config/firebase";
import type { AuthUser } from "@/types";

const DEMO_KEY = "devflow.demo-user";

const demoUser: AuthUser = {
  id: "demo-uid-0001",
  name: "Demo Developer",
  email: "developer@devflow.ai",
  avatar: null,
  provider: "demo",
};

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    avatar: user.photoURL,
    provider: user.providerData[0]?.providerId ?? "google.com",
  };
}

export const authService = {
  isFirebaseConfigured: firebaseEnabled,

  async signInWithGoogle(): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Firebase config is not present yet — fall back to a local demo identity
      // so the workspace remains explorable. Real Google auth activates as soon
      // as the VITE_FIREBASE_* variables are provided.
      localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
      return demoUser;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    return mapFirebaseUser(credential.user)!;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(DEMO_KEY);
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  getCurrentUser(): AuthUser | null {
    const auth = getFirebaseAuth();
    if (auth) return mapFirebaseUser(auth.currentUser);
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },

  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
    const auth = getFirebaseAuth();
    if (auth) return onAuthStateChanged(auth, (user) => cb(mapFirebaseUser(user)));
    cb(authService.getCurrentUser());
    return () => {};
  },
};