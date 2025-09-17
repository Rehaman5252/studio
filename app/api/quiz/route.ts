
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { QuizData, QuizQuestion } from "@/ai/schemas";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer, startAt } from 'firebase/firestore';
import { getLocalFallbackQuiz } from "@/lib/fallback-quiz";

export const dynamic = 'force_dynamic';

const ApiQuizInputSchema = z.object({
  format: z.enum(["mixed", "odi", "t20", "test", "ipl", "wpl"]),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

const getQuestionsFromFirestore = async (format: string): Promise<QuizData> => {
    if (!db) {
        console.warn(`[quiz] DB not available, using local fallback for "${format}".`);
        return getLocalFallbackQuiz(format);
    }
    try {
        const normalizedFormat = format.toLowerCase();
        
        const formatQuery = query(collection(db, "fallback_questions"), where('format', '==', normalizedFormat));
        const countSnapshot = await getCountFromServer(formatQuery);
        const docCount = countSnapshot.data().count;

        if (docCount < 5) {
            console.warn(`[quiz] Not enough questions for format "${format}" in Firestore (${docCount}), using local fallback.`);
            return getLocalFallbackQuiz(format);
        }

        const randomIndex = Math.floor(Math.random() * (docCount > 5 ? docCount - 5 : docCount));
        
        const randomDocQuery = query(collection(db, "fallback_questions"), where('format', '==', normalizedFormat), orderBy('__name__'), limit(1), startAt(randomIndex.toString()));
        
        let startingDoc;
        const randomDocSnap = await getDocs(randomDocQuery);
        if (!randomDocSnap.empty) {
            startingDoc = randomDocSnap.docs[0];
        }

        const finalQuery = query(
            collection(db, "fallback_questions"), 
            where('format', '==', normalizedFormat),
            orderBy('__name__'), 
            ...(startingDoc ? [startAt(startingDoc)] : []),
            limit(5)
        );

        const snapshot = await getDocs(finalQuery);
        
        let questions = snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure no embedded ID from the data object conflicts with the document ID
            delete (data as any).id;
            return {
              id: doc.id,
              ...data,
            } as QuizQuestion;
        });
        
        // If we still don't have enough questions (e.g., reached the end of the collection), fetch from the beginning.
        if (questions.length < 5) {
            const wrapAroundQuery = query(collection(db, "fallback_questions"), where('format', '==', normalizedFormat), orderBy('__name__'), limit(5));
            const wrapAroundSnapshot = await getDocs(wrapAroundQuery);
            questions = wrapAroundSnapshot.docs.map(doc => {
                 const data = doc.data();
                 delete (data as any).id;
                 return {
                    id: doc.id,
                    ...data,
                 } as QuizQuestion;
            });
        }

        return { questions };

    } catch (error) {
        console.error(`[quiz] Firestore query failed for format "${format}", using local fallback.`, error);
        return getLocalFallbackQuiz(format);
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
    
    // Always use the fallback source.
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
