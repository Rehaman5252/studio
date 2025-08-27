
import { z } from 'zod';

/**
 * @fileOverview Zod schemas for the indcric application.
 *
 * This file defines the core data structures used throughout the app,
 * ensuring type safety and consistent data validation. These schemas are kept
 * strict; any malformed input should be fixed by a sanitizer before validation.
 */

// Schema for a single quiz question, used within QuizAttempt
export const QuizQuestion = z.object({
  id: z.string().describe('A unique identifier for the question.'),
  question: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).length(4).describe('An array of exactly four multiple-choice options.'),
  correctAnswer: z.string().describe('The correct answer, which must match one of the options.'),
  explanation: z.string().describe('A brief explanation of the correct answer.'),
});

// Schema for a full quiz, containing 5 questions
export const QuizData = z.object({
  questions: z.array(QuizQuestion).length(5).describe('An array of exactly five quiz questions.'),
});

// Schema for a user's attempt at a quiz
// This is the source of truth for what a valid attempt object looks like for the AI analysis flow.
export const QuizAttempt = z.object({
  userId: z.string().min(1).describe("The user's unique ID."),
  slotId: z.string().describe("The ID of the 10-minute quiz slot."),
  brand: z.string().optional().default("unknown").describe("The brand associated with the quiz."),
  format: z.string().min(1).describe("The cricket format of the quiz."),
  questions: z.array(QuizQuestion).min(1).describe("The array of questions that were in the quiz."),
  userAnswers: z.array(z.string()).describe("The answers provided by the user (padded with empty strings for unanswered)."),
  score: z.number().int().describe("The final score of the user."),
  totalQuestions: z.number().int().describe("The total number of questions in the quiz."),
  timestamp: z.number().describe("The Unix timestamp when the quiz was completed."),
  timePerQuestion: z.optional(z.array(z.number())).describe("Time taken in seconds for each question."),
  unanswered: z.optional(z.number().int()).describe("The number of questions the user did not answer."),
  reason: z.optional(z.string()).describe("Reason for disqualification, if any (e.g., 'no-ball')."),
  source: z.enum(['ai', 'fallback']).optional().describe("The source of the quiz data."),
});


// Schema for the AI's analysis output.
export const QuizAnalysisOutputSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  source: z.enum(["ai", "fallback"]).default("fallback"),
});


// Infer TypeScript types from the Zod schemas
export type QuizQuestion = z.infer<typeof QuizQuestion>;
export type QuizData = z.infer<typeof QuizData>;
export type QuizAttempt = z.infer<typeof QuizAttempt>;
export type QuizAnalysisOutput = z.infer<typeof QuizAnalysisOutputSchema>;
