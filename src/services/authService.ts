// authService.ts
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/config/firebase";
import type { AuthUser } from "@/types";

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: user.photoURL,
    provider: user.providerData[0]?.providerId ?? "google.com",
  };
}

export const authService = {
  async signInWithGoogle(): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase is not configured. Please check your environment variables.");
    }
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    
    try {
      const credential = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(credential.user);
      if (!user) {
        throw new Error("Failed to map Firebase user");
      }
      return user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase is not configured.");
    }
    await firebaseSignOut(auth);
  },

  getCurrentUser(): AuthUser | null {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    return mapFirebaseUser(auth.currentUser);
  },

  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
    const auth = getFirebaseAuth();
    if (!auth) {
      cb(null);
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
      cb(mapFirebaseUser(user));
    });
  },
};