
import { generateQuiz, GenerateQuizInput } from '@/ai/flows/generate-quiz-flow';
import { getFallbackQuestions } from '@/lib/fallback-quiz';
import { NextResponse } from 'next/server';

const API_TIMEOUT = 10000; // 10 seconds

export async function POST(req: Request) {
  try {
    const input: GenerateQuizInput = await req.json();

    if (!input.format || !input.userId) {
      return NextResponse.json({ error: 'Format and userId are required.' }, { status: 400 });
    }

    console.log(`API received request for format: ${input.format}`);

    const quizGenerationPromise = generateQuiz(input);

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ timeout: true }), API_TIMEOUT);
    });

    const result: any = await Promise.race([quizGenerationPromise, timeoutPromise]);

    if (result.timeout) {
      console.warn(`AI generation timed out for format: ${input.format}. Serving fallback quiz.`);
      const fallbackQuestions = getFallbackQuestions(input.format);
      return NextResponse.json({ questions: fallbackQuestions });
    }
    
    // The flow now only returns a valid object or throws an error.
    if (result && result.questions && result.questions.length === 5) {
        console.log('Successfully served AI-generated quiz.');
        return NextResponse.json(result);
    } else {
        // This case might be hit if the AI returns a malformed but not error-throwing response.
        console.warn(`AI generation returned invalid data for format: ${input.format}. Serving fallback quiz.`);
        const fallbackQuestions = getFallbackQuestions(input.format);
        return NextResponse.json({ questions: fallbackQuestions });
    }

  } catch (error: any) {
    // This will catch errors thrown from the AI flow itself (e.g., network issues, parsing failures).
    console.error('AI generation failed, serving fallback quiz.', error);
    const format = (await req.clone().json().catch(() => ({}))).format || 'Mixed';
    const fallbackQuestions = getFallbackQuestions(format);
    return NextResponse.json({ questions: fallbackQuestions });
  }
}
