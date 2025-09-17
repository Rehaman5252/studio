import { z } from 'zod';

/**
 * @fileOverview Zod schemas for the indcric application.
 *
 * This file defines the core data structures used throughout the app,
 * ensuring type safety and consistent data validation. These schemas are kept
 * strict; any malformed input should be fixed by a sanitizer before validation.
 */

export const QuizQuestion = z.object({
  id: z.string().describe('Unique question identifier.'),
  question: z.string().describe('Text of the quiz question.'),
  options: z.array(z.string()).length(4).describe('Four distinct answer options.'),
  correctAnswer: z.string().describe('Valid correct answer string.'),
  explanation: z.string().describe('Detailed explanation of the answer.'),
});

export const QuizData = z.object({
  questions: z.array(QuizQuestion).length(5).describe('Array of exactly five quiz questions.'),
});

export const QuizAttempt = z.object({
  userId: z.string().min(1).describe("User's unique identifier."),
  slotId: z.string().describe("10-minute quiz slot ID."),
  brand: z.string().optional().default("unknown").describe("Quiz brand."),
  format: z.string().min(1).describe("Cricket format."),
  questions: z.array(QuizQuestion).min(1).describe("Questions in the quiz attempt."),
  userAnswers: z.array(z.string()).describe("User's selected answers."),
  score: z.number().int().describe("User's final score."),
  totalQuestions: z.number().int().describe("Total questions attempted."),
  timestamp: z.number().describe("Timestamp of completion."),
  timePerQuestion: z.optional(z.array(z.number())).describe("Time per question in seconds."),
  unanswered: z.optional(z.number().int()).describe("Number of unanswered questions."),
  reason: z.optional(z.string().nullable()).describe("Disqualification reason if any."),
  source: z.enum(['ai', 'fallback']).optional().describe("Source of quiz data."),
  reviewed: z.boolean().optional().default(false).describe("Review status."),
});

export const QuizAnalysisOutputSchema = z.object({
  summary: z.string().describe("Concise performance summary."),
  strengths: z.array(z.string()).min(1).max(3).describe("User strengths."),
  weaknesses: z.array(z.string()).min(1).max(3).describe("User weaknesses."),
  recommendations: z.array(z.string()).min(1).max(3).describe("Next steps."),
  source: z.enum(['ai', 'fallback']).default('fallback'),
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
