
import type { QuizQuestion as QQType } from '@/ai/schemas';

// Re-exporting the schema-defined type for use in other parts of the app.
export type QuizQuestion = QQType;

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
