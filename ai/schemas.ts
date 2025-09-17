import { z } from 'zod';

/**
 * Centralized schema definitions for the cricket quiz application.
 * Ensures consistent validation and typing across the application.
 */

export const QuizQuestion = z.object({
  id: z.string().describe('Unique question identifier'),
  question: z.string().describe('Question text'),
  options: z.array(z.string()).length(4).describe('Four answer options'),
  correctAnswer: z.string().describe('Correct answer'),
  explanation: z.string().describe('Explanation for the correct answer'),
  hint: z.string().optional().describe('Hint for the question'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Expert']).optional().describe('Question difficulty'),
  format: z.string().optional().describe('Cricket format label'),
});

export const QuizData = z.object({
  questions: z.array(QuizQuestion).length(5).describe('Set of exactly five quiz questions'),
});

export const QuizAttempt = z.object({
  userId: z.string().min(1).describe("User's unique ID"),
  slotId: z.string().describe('10-minute quiz slot ID'),
  brand: z.string().optional().default('unknown').describe('Brand associated with the quiz'),
  format: z.string().describe('Cricket format'),
  questions: z.array(QuizQuestion).min(1).describe('Questions presented in the quiz'),
  userAnswers: z.array(z.string()).describe('User responses'),
  score: z.number().int().describe('Final score'),
  totalQuestions: z.number().int().describe('Total questions'),
  timestamp: z.number().describe('Completion timestamp'),
  timePerQuestion: z.optional(z.array(z.number())).describe('Time taken per question'),
  unanswered: z.optional(z.number().int()).describe('Number of unanswered questions'),
  reason: z.optional(z.string().nullable()).describe('Disqualification reason'),
  source: z.optional(z.enum(['ai', 'fallback'])).describe('Source of quiz data'),
  reviewed: z.boolean().optional().default(false).describe('If the user has reviewed answers'),
});

export const QuizAnalysisOutputSchema = z.object({
  summary: z.string().describe('Overall performance summary'),
  strengths: z.array(z.string()).min(1).max(3).describe('Key strengths'),
  weaknesses: z.array(z.string()).min(1).max(3).describe('Key weaknesses'),
  recommendations: z.array(z.string()).min(1).max(3).describe('Recommended next steps'),
  source: z.enum(['ai', 'fallback']).default('fallback').describe('Source of analysis'),
});

export const HintOutputSchema = z.object({
  hint: z.string().min(1),
  source: z.enum(['ai', 'fallback']),
  debug: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestion>;
export type QuizData = z.infer<typeof QuizData>;
export type QuizAttempt = z.infer<typeof QuizAttempt>;
export type QuizAnalysisOutput = z.infer<typeof QuizAnalysisOutputSchema>;
export type HintOutput = z.infer<typeof HintOutputSchema>;
    