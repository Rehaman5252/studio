
import type { QuizQuestion } from '@/ai/schemas';

export interface QuizAttempt {
  slotId: string;
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: string[];
  timestamp: number;
  timePerQuestion?: number[];
  usedHintIndices?: number[];
  reason?: `malpractice_${number}`;
}
