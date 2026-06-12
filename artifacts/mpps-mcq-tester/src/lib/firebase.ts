import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey            = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain        = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId         = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket     = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId             = import.meta.env.VITE_FIREBASE_APP_ID;

const missing = [
  !apiKey            && "VITE_FIREBASE_API_KEY",
  !authDomain        && "VITE_FIREBASE_AUTH_DOMAIN",
  !projectId         && "VITE_FIREBASE_PROJECT_ID",
  !storageBucket     && "VITE_FIREBASE_STORAGE_BUCKET",
  !messagingSenderId && "VITE_FIREBASE_MESSAGING_SENDER_ID",
  !appId             && "VITE_FIREBASE_APP_ID",
].filter(Boolean);

if (missing.length > 0) {
  console.error(
    "[MPPS Firebase] ⚠️  Missing environment variables:",
    missing.join(", "),
    "\nSet these in Netlify → Site configuration → Environment variables, then redeploy."
  );
}

export const firebaseConfigValid = missing.length === 0;

const firebaseConfig = {
  apiKey:            apiKey            || "not-configured",
  authDomain:        authDomain        || "not-configured.firebaseapp.com",
  projectId:         projectId         || "not-configured",
  storageBucket:     storageBucket     || "not-configured.appspot.com",
  messagingSenderId: messagingSenderId || "000000000000",
  appId:             appId             || "1:000000000000:web:notconfigured",
};

const app = initializeApp(firebaseConfig);

// Use a persistence chain: IndexedDB → localStorage → in-memory
// This ensures Firebase Auth works on all browsers including:
// - Safari private mode (blocks IndexedDB)
// - Android WebView (may block localStorage)
// - Desktop Chrome/Firefox/Edge (full support)
export const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    inMemoryPersistence,
  ],
});

export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
