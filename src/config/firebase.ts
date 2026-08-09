import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  // `VITE_API_KEY` is kept as a legacy fallback for existing deployments.
  // New environments should use the explicit Firebase variable.
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] || import.meta.env["VITE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId,
);

let authInstance: Auth | null = null;
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!firebaseEnabled) {
    console.error(
      "Firebase is not configured. Set VITE_FIREBASE_API_KEY (or legacy VITE_API_KEY), " +
        "VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, " +
        "VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID.",
    );
    return null;
  }

  try {
    if (authInstance) return authInstance;

    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // IndexedDB persistence can be unavailable in embedded previews and may fail
    // with "Database is closing/hidden" after Google redirects back to the app.
    // Session storage survives refreshes without relying on IndexedDB.
    authInstance = initializeAuth(appInstance, {
      persistence: browserSessionPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    return authInstance;
  } catch (error) {
    // Firebase may already have initialized Auth for this app during hot reload.
    // In that case, retrieve the existing instance instead of failing sign-in.
    try {
      authInstance = getAuth(appInstance ?? undefined);
      return authInstance;
    } catch {
      console.error("Firebase initialization error:", error);
      return null;
    }
  }
}

export function getFirebaseFirestore(): Firestore | null {
  if (!firebaseEnabled) {
    console.warn("Firebase is not configured. Please check your environment variables.");
    return null;
  }

  try {
    if (firestoreInstance) return firestoreInstance;

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    console.error("Firestore initialization error:", error);
    return null;
  }
}
