
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // ensure the route is always dynamic

export async function POST(request: Request) {
  try {
    const { format, askedQuestions } = await request.json();
    const quizData = await generateQuiz({ format, askedQuestions });
    return NextResponse.json(quizData);
  } catch (error) {
    console.error('API Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
