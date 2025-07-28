
import type { QuizQuestion as QQType, QuizAttempt as QAType } from '@/ai/schemas';

// Re-exporting the schema-defined types for use in other parts of the app.
export type QuizQuestion = QQType;
export type QuizAttempt = QAType;
