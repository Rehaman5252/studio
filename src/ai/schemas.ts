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

export const GenerateQuizOutputSchema = z.array(QuizQuestionSchema).length(5);
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
export const GenerateQuizAnalysisInputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  userAnswers: z.array(z.string()),
  timePerQuestion: z.array(z.number()).optional().describe('Time taken in seconds for each question.'),
  usedHintIndices: z.array(z.number()).optional().describe('Indices of questions where a hint was used.'),
});
export type GenerateQuizAnalysisInput = z.infer<typeof GenerateQuizAnalysisInputSchema>;


export const GenerateQuizAnalysisOutputSchema = z.object({
    analysis: z.string().describe('A detailed analysis of the user quiz performance, including strengths, weaknesses, and tips for improvement. The analysis should be formatted as markdown.'),
});
export type GenerateQuizAnalysisOutput = z.infer<typeof GenerateQuizAnalysisOutputSchema>;

// Schemas for send-otp-flow
export const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The email address to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

// Schemas for verify-otp-flow
export const VerifyOtpInputSchema = z.object({
  email: z.string().email().describe("The user's email address."),
  otp: z.string().min(6).describe('The 6-digit OTP submitted by the user.'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

export const VerifyOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;
