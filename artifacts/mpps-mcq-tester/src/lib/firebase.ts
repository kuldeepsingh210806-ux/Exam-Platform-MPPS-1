import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey     = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId  = import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (import.meta.env.DEV && (!apiKey || apiKey === "not-configured")) {
  console.error(
    "[MPPS] Firebase is not configured.\n" +
    "Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, " +
    "VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID " +
    "as environment variables (Replit Secrets or Netlify environment variables)."
  );
}

const firebaseConfig = {
  apiKey:            apiKey            || "not-configured",
  authDomain:        authDomain        || "not-configured.firebaseapp.com",
  projectId:         projectId         || "not-configured",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET         || "not-configured.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID    || "000000000000",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID                  || "1:000000000000:web:notconfigured",
};

const app = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
