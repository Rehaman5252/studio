
// src/lib/getUserProfile.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("🔥 Error fetching profile:", error);
    throw error;
  }
};
