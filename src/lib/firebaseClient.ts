// lib/firebaseClient.ts
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { app } from "./firebase";

// These variables will be null on the server and initialized on the client.
export const auth: Auth | null = typeof window !== "undefined" && app ? getAuth(app) : null;
export const db: Firestore | null = typeof window !== "undefined" && app ? getFirestore(app) : null;
