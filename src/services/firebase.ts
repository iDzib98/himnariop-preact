import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REVOCADA",
  authDomain: "himnariop.firebaseapp.com",
  databaseURL: "https://himnariop.firebaseio.com",
  projectId: "himnariop",
  storageBucket: "himnariop.firebasestorage.app",
  messagingSenderId: "515375809778",
  appId: "1:515375809778:web:233659d7bac78529f7fc6b",
  measurementId: "G-LRTB3RZMXC"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({})
    });
  }
  return db;
}
