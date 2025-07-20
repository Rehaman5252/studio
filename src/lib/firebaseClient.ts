
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh35l6QoFhYoTUWDc7vA_LpnHN7ZaB92A",
  authDomain: "cricblitz.firebaseapp.com",
  projectId: "cricblitz",
  storageBucket: "cricblitz.appspot.com",
  messagingSenderId: "370076403121",
  appId: "1:370076403121:web:514b379a7fd3f3d491a990"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence not supported by this browser");
    }
  });
}

export { db, auth, app };
