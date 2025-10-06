import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const requiredConfig: Record<string, string | undefined> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfigKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
  throw new Error(
    `Missing Firebase configuration values: ${missingConfigKeys.join(", ")}. ` +
      "Check your Vite environment variables.",
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requiredConfig.apiKey!,
  authDomain: requiredConfig.authDomain!,
  projectId: requiredConfig.projectId!,
  storageBucket: requiredConfig.storageBucket!,
  messagingSenderId: requiredConfig.messagingSenderId!,
  appId: requiredConfig.appId!,
};

if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  firebaseConfig.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
}

if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
  firebaseConfig.databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
