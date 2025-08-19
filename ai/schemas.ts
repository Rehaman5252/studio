import { z } from 'zod';

/**
 * @fileOverview Zod schemas for the CricBlitz application.
 *
 * This file defines the core data structures used throughout the app,
 * ensuring type safety and consistent data validation.
 */

// Schema for a single quiz question
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
export const QuizAttempt = z.object({
  userId: z.string().describe("The user's unique ID."),
  slotId: z.string().describe("The ID of the 10-minute quiz slot."),
  brand: z.string().describe("The brand associated with the quiz."),
  format: z.string().describe("The cricket format of the quiz."),
  questions: z.array(QuizQuestion).describe("The array of questions that were in the quiz."),
  userAnswers: z.array(z.string()).describe("The answers provided by the user."),
  score: z.number().int().describe("The final score of the user."),
  totalQuestions: z.number().int().describe("The total number of questions in the quiz."),
  timestamp: z.number().describe("The Unix timestamp when the quiz was completed."),
  timePerQuestion: z.optional(z.array(z.number())).describe("Time taken in seconds for each question."),
  reason: z.optional(z.string()).describe("Reason for disqualification, if any (e.g., 'no-ball')."),
});

// Infer TypeScript types from the Zod schemas
export type QuizQuestion = z.infer<typeof QuizQuestion>;
export type QuizData = z.infer<typeof QuizData>;
export type QuizAttempt = z.infer<typeof QuizAttempt>;
