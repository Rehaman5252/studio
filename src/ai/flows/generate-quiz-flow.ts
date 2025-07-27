
'use server';

/**
 * @fileOverview A flow that generates a unique quiz on-the-fly using an AI model.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';


const GenerateQuizInputSchema = z.object({
  format: z.string().describe("The cricket format for the quiz (e.g., T20, IPL, Test)."),
  count: z.number().min(1).max(10).default(5).describe("The number of questions to generate."),
  userId: z.string().describe("The unique ID of the user requesting the quiz to ensure some personalization if needed."),
  previouslyAskedQuestions: z.array(z.string()).optional().describe("A list of questions already asked in the user's current session to ensure variety."),
});

// This is the schema for a single question that the AI will generate.
// Note: 'format' is removed from here because the AI doesn't need to generate it.
const AIGeneratedQuestionSchema = z.object({
  question: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
  correctAnswer: z.string().describe("The correct answer, which must be one of the strings from the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct.")
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(AIGeneratedQuestionSchema).describe("An array of generated quiz questions."),
});

// This is the final schema for a question, including the id and format we add in code.
const FinalQuestionSchema = AIGeneratedQuestionSchema.extend({
    id: z.string(),
    format: z.string(),
});

const FinalOutputSchema = z.object({
    questions: z.array(FinalQuestionSchema),
});


export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<z.infer<typeof FinalOutputSchema>> {
  return generateQuizFlow(input);
}

const quizGenerationPrompt = ai.definePrompt({
    name: "generateQuizPrompt",
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are a master cricket quiz creator. Generate {{count}} unique, high-quality, and engaging multiple-choice quiz questions about the "{{format}}" cricket format.

Each question must:
1.  Have exactly four options.
2.  Have one correct answer clearly indicated.
3.  Include a brief, clear explanation for the correct answer.
4.  Be completely new and not similar to any of the questions in this list:
    {{#if previouslyAskedQuestions}}
    Previously Asked:
    {{#each previouslyAskedQuestions}}
    - "{{this}}"
    {{/each}}
    {{/if}}

Your response must be structured in the requested JSON format.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: FinalOutputSchema,
  },
  async (input) => {
    
    const { output } = await quizGenerationPrompt(input);

    if (!output || !output.questions || output.questions.length < input.count) {
        throw new Error("The AI failed to generate the required number of questions. Please try again.");
    }
    
    // Ensure the generated questions are valid and the correct answer exists in options.
    const validatedQuestions = output.questions
        .filter(q => q.options.includes(q.correctAnswer))
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
