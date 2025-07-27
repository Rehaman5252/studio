
'use server';

/**
 * @fileOverview A flow that generates a unique quiz on-the-fly using an AI model.
 * This flow is designed to be pure; it accepts all necessary data and does not perform database lookups.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Input schema for the AI prompt, containing only what the AI needs.
const GenerateQuizPromptInputSchema = z.object({
  format: z.string().describe("The cricket format for the quiz (e.g., T20, IPL, Test)."),
  count: z.number().min(1).max(10).default(5).describe("The number of questions to generate."),
});

// This is the schema for a single question that the AI will generate.
const AIGeneratedQuestionSchema = z.object({
  question: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
  correctAnswer: z.string().describe("The correct answer, which must be one of the strings from the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct.")
});

// The output schema from the AI prompt. We expect an object containing a "questions" array.
const GenerateQuizOutputSchema = z.object({
  questions: z.array(AIGeneratedQuestionSchema).describe("An array of generated quiz questions."),
});

// This is the final schema for a question, including the id and format we add in code.
export const FinalQuestionSchema = AIGeneratedQuestionSchema.extend({
    id: z.string(),
    format: z.string(),
});

// The final output from the entire flow, ready for the client.
export const FinalOutputSchema = z.object({
    questions: z.array(FinalQuestionSchema),
});

export type GenerateQuizFlowInput = z.infer<typeof GenerateQuizPromptInputSchema>;
export type GenerateQuizFlowOutput = z.infer<typeof FinalOutputSchema>;


export async function generateQuiz(input: GenerateQuizFlowInput): Promise<GenerateQuizFlowOutput> {
  return generateQuizFlow(input);
}

const quizGenerationPrompt = ai.definePrompt({
    name: "generateQuizPrompt",
    input: { schema: GenerateQuizPromptInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are a master cricket quiz creator. Generate {{count}} unique, high-quality, and engaging multiple-choice quiz questions about the "{{format}}" cricket format.

Each question must:
1.  Have exactly four options.
2.  Have one correct answer clearly indicated.
3.  CRITICALLY: The value for 'correctAnswer' MUST be an exact, case-sensitive match to one of the strings in the 'options' array.
4.  Include a brief, clear explanation for the correct answer.

Your response must be structured in the requested JSON format. Do not deviate.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizPromptInputSchema,
    outputSchema: FinalOutputSchema,
  },
  async (input) => {
    
    const { output } = await quizGenerationPrompt(input);

    // AI can sometimes return the array directly instead of a nested object.
    // This robustly handles both cases.
    let rawQuestions: z.infer<typeof AIGeneratedQuestionSchema>[] = [];
    if (output && Array.isArray((output as any).questions)) {
        rawQuestions = (output as any).questions;
    } else if (output && Array.isArray(output)) {
        rawQuestions = output as any;
    }

    if (!rawQuestions || rawQuestions.length < input.count) {
        throw new Error("The AI failed to generate the required number of questions. Please try again.");
    }
    
    // Ensure the generated questions are valid and the correct answer exists in options.
    const validatedQuestions = rawQuestions
        .filter(q => q && q.options && Array.isArray(q.options) && q.options.includes(q.correctAnswer))
        .map(q => ({
            ...q,
            id: uuidv4(), // Assign a unique ID
            format: input.format, // Add the format back in
        }));
    
    if (validatedQuestions.length < input.count) {
      console.warn("AI generated some invalid questions which were filtered out.");
    }
    
    if (validatedQuestions.length === 0) {
      throw new Error("The AI failed to generate any valid questions. Please try again.");
    }

    return { questions: validatedQuestions };
  }
);
