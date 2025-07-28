'use server';

import { generateQuizFromAI } from '@/ai/flows/generate-quiz-flow';
import { QuizQuestion } from '@/lib/mockData';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// This is the new, simplified API route for quizzes.
export async function POST(req: Request) {
  try {
    // We no longer need input from the request body for this simplified flow.
    // The generateQuizFromAI function handles everything internally.
    const questionsFromAI = await generateQuizFromAI();

    // The AI flow now includes its own fallback, so we can be confident
    // that we'll always have questions. We just need to format them
    // into the structure the frontend expects.
    const formattedQuestions: QuizQuestion[] = questionsFromAI.map(q => ({
        id: uuidv4(),
        format: 'Mixed', // Since the prompt is generic, we can default to 'Mixed'
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        explanation: `The correct answer is ${q.answer}.` // Basic explanation
    }));

    return NextResponse.json({ questions: formattedQuestions });

  } catch (error) {
    // This is a final safety net for any unexpected server errors.
    console.error('🔥 Unhandled error in /api/quiz route:', error);
    // In a catastrophic failure, we send a clear error message.
    // The frontend has its own fallback UI for this scenario.
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
