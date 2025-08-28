
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
  reason: z.optional(z.string().nullable()).describe("Reason for disqualification, if any (e.g., 'no-ball')."),
  source: z.enum(['ai', 'fallback']).optional().describe("The source of the quiz data."),
  reviewed: z.boolean().optional().default(false).describe("Whether the user has reviewed the answers."),
});

// Schema for the AI's analysis output.
const QuestionAnalysisSchema = z.object({
    question: z.string().describe("The original question text."),
    userAnswer: z.string().describe("The answer the user provided."),
    correctAnswer: z.string().describe("The correct answer."),
    isCorrect: z.boolean().describe("Whether the user's answer was correct."),
    timeTaken: z.number().describe("Time taken for this question in seconds."),
    category: z.string().describe("A specific category for the question (e.g., 'IPL History', 'Test Bowling Records', 'Player Nicknames', 'Cricket Rules').")
});

export const QuizAnalysisOutputSchema = z.object({
    overallPerformance: z.string().describe("A brief, encouraging summary of the user's overall performance in one or two sentences."),
    accuracy: z.number().describe("The user's accuracy percentage."),
    averageTimePerQuestion: z.number().describe("The average time the user took per question, in seconds."),
    keyStrengths: z.array(z.string()).describe("A list of 2-3 key strengths the user demonstrated, based on the categories they answered correctly and quickly."),
    areasForImprovement: z.array(z.string()).describe("A list of 2-3 specific, actionable areas for improvement, based on the categories where answers were incorrect or slowly."),
    coachTip: z.string().describe("A single, personalized, actionable tip from an AI coach to help the user improve next time."),
    analyzedQuestions: z.array(QuestionAnalysisSchema).describe("An array containing the analysis for each individual question."),
    source: z.enum(["ai", "fallback"]).default("fallback"),
});

// Infer TypeScript types from the Zod schemas
export type QuizQuestion = z.infer<typeof QuizQuestion>;
export type QuizData = z.infer<typeof QuizData>;
export type QuizAttempt = z.infer<typeof QuizAttempt>;
export type QuizAnalysisOutput = z.infer<typeof QuizAnalysisOutputSchema>;
export type HintOutput = import('./flows/ai-powered-hints').HintOutput;
