'use server';
/**
 * @fileOverview A flow that serves 5 cricket quiz questions from a predefined bank.
 *
 * - generateQuiz - A function that fetches quiz questions based on a format.
 */
import {z} from 'genkit';
import {
  GenerateQuizInputSchema,
  QuizQuestion,
} from '@/ai/schemas';
import {allQuestions, PredefinedQuestion} from '@/lib/question-bank';

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function generateQuiz(
  input: z.infer<typeof GenerateQuizInputSchema>
): Promise<QuizQuestion[]> {
  const {format} = input;

  // Filter questions by the selected format.
  // Fallback logic for formats without dedicated questions.
  let filteredQuestions: PredefinedQuestion[];
  if (format === 'IPL' || format === 'T20' || format === 'WPL') {
    filteredQuestions = allQuestions.filter(q => q.format === 'IPL');
  } else if (format === 'Test' || format === 'ODI' || format === 'Mixed') {
    filteredQuestions = allQuestions.filter(q => q.format === 'Test');
  } else {
    // Default fallback to all questions if format is unknown
    filteredQuestions = allQuestions;
  }

  // If not enough questions for a specific format, fallback to all questions. This is a safe guard.
  if (filteredQuestions.length < 5) {
    filteredQuestions = allQuestions;
  }

  // Shuffle the filtered questions and pick the first 5
  const selectedQuestions = shuffleArray(filteredQuestions).slice(0, 5);

  // Ensure we have 5 questions.
  if (selectedQuestions.length < 5) {
    // This should not happen with the current question bank size
    throw new Error(`Not enough questions for format: ${format}`);
  }

  // Map to the QuizQuestion schema (omitting format) and shuffle options for each question
  return selectedQuestions.map(q => {
    const {format, ...rest} = q;
    return {
      ...rest,
      options: shuffleArray([...q.options]),
    };
  });
}
