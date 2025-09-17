
import { NextResponse } from "next/server";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { z, ZodError } from "zod";
import type { QuizData, FallbackQuestion } from "@/lib/fallback-quiz";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, getDocs, orderBy, startAt, documentId } from 'firebase/firestore';

export const dynamic = 'force_dynamic';

const ApiQuizInputSchema = z.object({
  format: z.enum(["mixed", "odi", "t20", "test", "ipl", "wpl"]),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

const getQuestionsFromFirestore = async (format: string): Promise<QuizData> => {
    if (!db) {
        // Fallback to local file if DB is not available
        return getFallbackQuiz(format);
    }
    try {
        const q = query(
          collection(db, "fallback_questions"), 
          where('format', '==', format.toLowerCase()),
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.warn(`[quiz] No questions found for format "${format}" in Firestore, using local fallback.`);
            return getFallbackQuiz(format);
        }

        const allQuestions = snapshot.docs.map(doc => doc.data() as FallbackQuestion);
        
        // Simple shuffle and pick 5
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 5).map(q => ({...q, id: Math.random().toString(36).substring(7)}));

        return { questions: selectedQuestions };

    } catch (error) {
        console.error(`[quiz] Firestore query failed for format "${format}", using local fallback.`, error);
        return getFallbackQuiz(format);
    }
}


export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let body;
  
  try {
    body = await req.json();
  } catch (e) {
    const err = e as Error;
    console.error(`[quiz][${reqId}] Invalid JSON`, err.message);
    return NextResponse.json({ ok: false, error: { message: "Invalid request format." } }, { status: 400 });
  }

  try {
    const parsed = ApiQuizInputSchema.parse(body);
    const { format } = parsed;

    console.info(`[quiz][${reqId}] Generating fallback quiz for ${parsed.userId} (${format})`);
    const quiz = await getQuestionsFromFirestore(format);
    
    // As we are now always using the fallback, the source is always 'fallback'.
    return NextResponse.json({ ok: true, quiz, source: "fallback", reqId });

  } catch (err: any) {
     if (err instanceof ZodError) {
        console.error(`[quiz][${reqId}] Invalid payload`, err.flatten());
        return NextResponse.json({ ok: false, error: { message: "Invalid payload provided." } }, { status: 400 });
     }
     
     console.error(`[quiz][${reqId}] Fatal API error`, err.message);
     return NextResponse.json({ ok: false, error: { message: "An unexpected server error occurred." } }, { status: 500 });
  }
}
