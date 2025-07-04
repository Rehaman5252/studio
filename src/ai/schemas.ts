import {z} from 'genkit';

// Schemas for generateQuizFlow
export const GenerateQuizInputSchema = z.object({
  format: z.string().describe('The cricket format for the quiz (e.g., IPL, T20, Test).'),
  brand: z.string().describe('The brand associated with the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export const QuizQuestionSchema = z.object({
    questionText: z
      .string()
      .describe('A unique and very difficult cricket trivia question.'),
    options: z
      .array(z.string())
      .length(4)
      .describe(
        'An array of four very close, plausible options for the question.'
      ),
    correctAnswer: z
      .string()
      .describe(
        'The single correct answer, which must exactly match one of the options.'
      ),
    hint: z
        .string()
        .describe('A helpful, single-sentence hint for the question that does not give away the answer directly.'),
    explanation: z
        .string()
        .describe('A brief explanation of why the correct answer is right.')
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const GenerateQuizOutputSchema = z.array(QuizQuestionSchema).length(5);
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// Schemas for ai-powered-hints
export const GenerateHintInputSchema = z.object({
  question: z.string().describe('The quiz question to generate a hint for.'),
  format: z.string().describe('The quiz format (e.g., T20, ODI, Test).'),
  brand: z.string().describe('The brand associated with the quiz.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

export const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('A helpful hint for the quiz question.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;


// Schemas for generateQuizAnalysisFlow
export const GenerateQuizAnalysisInputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  userAnswers: z.array(z.string()),
});
export type GenerateQuizAnalysisInput = z.infer<typeof GenerateQuizAnalysisInputSchema>;


export const GenerateQuizAnalysisOutputSchema = z.object({
    analysis: z.string().describe('A detailed analysis of the user quiz performance, including strengths, weaknesses, and tips for improvement. The analysis should be formatted as markdown.'),
});
export type GenerateQuizAnalysisOutput = z.infer<typeof GenerateQuizAnalysisOutputSchema>;
