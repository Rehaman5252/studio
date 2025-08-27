
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';
import { mapFirestoreError } from '@/lib/utils';
import { isFirebaseConfigured } from '@/lib/firebase';

const GENERATION_TIMEOUT = 15000; // 15 seconds
const VALID_FORMATS = ['mixed', 'ipl', 't20', 'odi', 'wpl', 'test'];

export async function POST(req: NextRequest) {
  let requestedFormat = 'mixed';
  
  try {
    if (!isFirebaseConfigured) {
        throw new Error('server_not_configured');
    }

    const body = await req.json();
    const { userId, format } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User identification is missing.' }, { status: 400 });
    }
    
    requestedFormat = (format || 'mixed').toLowerCase();
    if (!VALID_FORMATS.includes(requestedFormat)) {
       console.warn(`[API /quiz] Invalid format '${format}' provided. Defaulting to 'mixed'.`);
       requestedFormat = 'mixed';
    }

    console.log(`[API /quiz] Generating quiz for format: ${requestedFormat}, userId: ${userId}`);
    const quizPromise = generateQuiz({ format: requestedFormat, userId });
    
    const quizData = await Promise.race([
        quizPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), GENERATION_TIMEOUT))
    ]);
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
        throw new Error('AI returned incomplete or invalid quiz data.');
    }
    
    console.log(`[API /quiz] Successfully generated AI quiz for userId: ${userId}, format: ${requestedFormat}`);
    return NextResponse.json({ ...quizData, source: 'ai' });

  } catch (error: any) {
    const isTimeout = error.message.toLowerCase().includes("timeout");
    let errorMessage = mapFirestoreError(error);

     if(error.message === 'server_not_configured') {
         errorMessage = 'The server is not properly configured. Using a classic quiz.';
         console.error("[API /quiz] Critical Error: Firebase server environment variables are not configured.");
    } else if (isTimeout) {
         errorMessage = `AI generation timed out after ${GENERATION_TIMEOUT}ms for format '${requestedFormat}'`;
    }

    console.error(`[Quiz API Error] for format ${requestedFormat}:`, errorMessage);

    const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
    
    return NextResponse.json({ 
        ...fallback, 
        source: 'fallback', 
        error: isTimeout ? 'timeout' : 'generation_failed',
        fallbackReason: errorMessage 
    }, { status: 200 }); // Return 200 with fallback data so client can handle it gracefully
  }
}

    