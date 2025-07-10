
import {z} from 'genkit';

// Schemas for generateQuizFlow
export const GenerateQuizInputSchema = z.object({
  format: z.string().describe('The cricket format for the quiz (e.g., IPL, T20, Test, Mixed).'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export const QuizQuestionSchema = z.object({
    questionText: z
      .string()
      .describe('A unique and very difficult cricket trivia question, focusing on specific statistics, player records, obscure moments, or historic match details.'),
    options: z
      .array(z.string())
      .length(4)
      .describe(
        'An array of four very close, plausible options for the question, designed to challenge an expert.'
      ),
    correctAnswer: z
      .string()
      .describe(
        'The single correct answer, which must exactly match one of the options.'
      ),
    hint: z
        .string()
        .describe('A helpful, single-sentence hint for the question that does not give away the answer directly.')
        .optional(),
    explanation: z
        .string()
        .describe('A brief explanation of why the correct answer is right.')
        .optional()
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(5),
  facts: z.array(z.string()).length(5).describe('An array of 5 interesting, little-known, and engaging facts about the specified cricket format.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// Schemas for ai-powered-hints
export const GenerateHintInputSchema = z.object({
  question: z.string().describe('The quiz question to generate a hint for.'),
  format: z.string().describe('The quiz format (e.g., T20, ODI, Test).'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

export const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('A helpful hint for the quiz question.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;


// Schemas for generateQuizAnalysisFlow
const IncorrectAnswerSchema = z.object({
    questionNumber: z.number(),
    questionText: z.string(),
    userAnswer: z.string(),
    correctAnswer: z.string(),
});

export const GenerateQuizAnalysisInputSchema = z.object({
  format: z.string().describe("The format of the quiz (e.g., T20, IPL)."),
  score: z.number().describe("The user's final score."),
  totalQuestions: z.number().describe("The total number of questions in the quiz."),
  incorrectAnswers: z.array(IncorrectAnswerSchema).describe("A list of questions the user answered incorrectly."),
  timePerQuestion: z.array(z.number()).optional().describe('Time taken in seconds for each question.'),
  usedHintIndices: z.array(z.number()).optional().describe('Indices of questions where a hint was used.'),
});

// The input for the flow wrapper will still be the raw data
export const FlowGenerateQuizAnalysisInputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  userAnswers: z.array(z.string()),
  format: z.string(),
  timePerQuestion: z.array(z.number()).optional().describe('Time taken in seconds for each question.'),
  usedHintIndices: z.array(z.number()).optional().describe('Indices of questions where a hint was used.'),
});
export type GenerateQuizAnalysisInput = z.infer<typeof FlowGenerateQuizAnalysisInputSchema>;


export const GenerateQuizAnalysisOutputSchema = z.object({
    analysis: z.string().describe('A detailed analysis of the user quiz performance, including strengths, weaknesses, and tips for improvement. The analysis should be formatted as markdown.'),
});
export type GenerateQuizAnalysisOutput = z.infer<typeof GenerateQuizAnalysisOutputSchema>;
