
import { z } from "zod";

export const QuizQuestion = z.object({
  id: z.string().describe("A unique identifier for the question."),
  format: z.string().describe("The cricket format this question belongs to (e.g., IPL, T20, Test)."),
  question: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
  correctAnswer: z.string().describe("The correct answer, which must be one of the strings from the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct."),
  hint: z.string().optional().describe("A helpful hint for the user.")
});
export type QuizQuestion = z.infer<typeof QuizQuestion>;


export const GenerateQuizInputSchema = z.object({
    format: z.string().describe("The cricket format for which to generate the quiz."),
    userId: z.string().describe("The unique ID of the user requesting the quiz.")
});

export const GenerateQuizOutputSchema = z.object({
    questions: z.array(QuizQuestion).length(5).describe("An array of exactly 5 quiz questions.")
});


export const GenerateHintInputSchema = z.object({
  question: z.string().describe("The quiz question for which a hint is needed."),
  format: z.string().describe("The format of the quiz (e.g., T20, ODI, Test)."),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

export const GenerateHintOutputSchema = z.object({
  hint: z.string().describe("A concise and relevant hint."),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;


export const FlowGenerateQuizAnalysisInputSchema = z.object({
  questions: z.array(QuizQuestion),
  userAnswers: z.array(z.string()),
  format: z.string(),
  timePerQuestion: z.array(z.number()).optional(),
  usedHintIndices: z.array(z.number()).optional(),
});
export type FlowGenerateQuizAnalysisInput = z.infer<typeof FlowGenerateQuizAnalysisInputSchema>;

export const GenerateQuizAnalysisPromptInputSchema = z.object({
  format: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  incorrectAnswers: z.array(
    z.object({
      questionNumber: z.number(),
      questionText: z.string(),
      userAnswer: z.string(),
      correctAnswer: z.string(),
    })
  ),
  timePerQuestion: z.array(z.number()).optional(),
  usedHintIndices: z.array(z.number()).optional(),
});

export const GenerateQuizAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A detailed, personalized performance analysis in Markdown format."),
});
export type GenerateQuizAnalysisOutput = z.infer<typeof GenerateQuizAnalysisOutputSchema>;

export const QuizAttemptSchema = z.object({
  slotId: z.string(),
  brand: z.string(),
  format: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  questions: z.array(QuizQuestion),
  userAnswers: z.array(z.string()),
  timestamp: z.number(),
  timePerQuestion: z.array(z.number()).optional(),
  usedHintIndices: z.array(z.number()).optional(),
  reason: z.string().optional(),
});
    
