import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "./firebaseClient";

const db = getFirestore(app);

export async function fetchQuizQuestions() {
  const snapshot = await getDocs(collection(db, "quizQuestions"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
