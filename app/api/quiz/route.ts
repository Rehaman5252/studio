
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { QuizData, QuizQuestion } from "@/ai/schemas";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer, startAt } from 'firebase/firestore';
import { getLocalFallbackQuiz } from "@/lib/fallback-quiz";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/app/lib/logger";

const ApiQuizInputSchema = z.object({
  format: z.string(),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

const getQuestionsFromFirestore = async (format: string): Promise<QuizData> => {
    if (!db) {
        logger.warn(`[quiz] DB not available, using local fallback for "${format}".`);
        return getLocalFallbackQuiz(format);
    }
    try {
        const normalizedFormat = format.toLowerCase();
        
        const formatQuery = query(collection(db, "fallback_questions"), where('format', '==', normalizedFormat));
        const countSnapshot = await getCountFromServer(formatQuery);
        const docCount = countSnapshot.data().count;

        if (docCount < 5) {
            logger.warn(`[quiz] Not enough questions for format "${format}" in Firestore (${docCount}), using local fallback.`);
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
        logger.error(`[quiz] Firestore query failed for format "${format}", using local fallback.`, { error });
        return getLocalFallbackQuiz(format);
    }
}


export async function POST(req: Request) {
  const reqId = uuidv4();
  let body;
  
  try {
    body = await req.json();
  } catch (e) {
    const err = e as Error;
    logger.error(`[quiz][${reqId}] Invalid JSON`, { message: err.message });
    const quiz = getLocalFallbackQuiz('mixed');
    return NextResponse.json({ ok: true, quiz, source: "fallback", reqId, errorDetails: { message: "Invalid JSON body.", originalError: err.message, code: "INVALID_JSON"} });
  }

  try {
    const parsed = ApiQuizInputSchema.parse(body);
    const { format, userId } = parsed;

    // --- Step 1: Try AI Flow ---
    try {
        logger.info(`[quiz][${reqId}] Requesting AI-generated quiz`, { userId, format });
        const quiz = await generateQuizFlow({ format, userId });
        logger.event('quiz_start', { format, brand: body.brand || 'Unknown', source: 'ai' });
        return NextResponse.json({ ok: true, quiz, source: "ai", reqId });
    } catch (aiError: any) {
        // --- Step 2: Firestore Fallback ---
        logger.warn(`[quiz][${reqId}] AI generation failed, falling back to Firestore.`, { userId, format, reason: aiError.message });
        const quiz = await getQuestionsFromFirestore(format);
        logger.event('quiz_start', { format, brand: body.brand || 'Unknown', source: 'fallback' });
        return NextResponse.json({ ok: true, quiz, source: "fallback", reqId, errorDetails: { message: "AI generation failed, using fallback.", originalError: aiError.message, code: "AI_FLOW_FAILED"} });
    }

  } catch (err: any) {
     // --- Step 3: Total Failure ---
     logger.error(`[quiz][${reqId}] Quiz API request failed`, {
        error: err instanceof ZodError ? err.flatten() : err.message
     });
     const quiz = getLocalFallbackQuiz('mixed');
     const errorCode = err instanceof ZodError ? "INVALID_PAYLOAD" : "FATAL";
     return NextResponse.json({ ok: true, quiz, source: "fallback", reqId, errorDetails: { message: "An unexpected server error occurred.", originalError: err.message, code: errorCode} });
  }
}
    