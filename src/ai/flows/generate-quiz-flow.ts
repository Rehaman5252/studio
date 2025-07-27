
'use server';

/**
 * @fileOverview A flow that generates a unique quiz on-the-fly using an AI model.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizQuestion } from '../schemas';

const GenerateQuizInputSchema = z.object({
  format: z.string().describe("The cricket format for the quiz (e.g., T20, IPL, Test)."),
  count: z.number().min(1).max(10).default(5).describe("The number of questions to generate."),
  userId: z.string().describe("The unique ID of the user requesting the quiz to ensure some personalization if needed."),
  previouslyAskedQuestions: z.array(z.string()).optional().describe("A list of questions already asked in the user's current session to ensure variety."),
});

const GeneratedQuestionSchema = z.object({
  id: z.string().describe("A unique identifier for the question, which can be a random hash."),
  format: z.string().describe("The cricket format this question belongs to."),
  question: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
  correctAnswer: z.string().describe("The correct answer, which must be one of the strings from the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct.")
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).describe("An array of generated quiz questions."),
});

export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<z.infer<typeof GenerateQuizOutputSchema>> {
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
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    
    const { output } = await quizGenerationPrompt(input);

    if (!output || !output.questions || output.questions.length < input.count) {
        throw new Error("The AI failed to generate the required number of questions. Please try again.");
    }
    
    // Ensure the generated questions are valid and the correct answer exists in options.
    const validatedQuestions = output.questions.filter(q => q.options.includes(q.correctAnswer));
    
    if (validatedQuestions.length < input.count) {
      console.warn("AI generated some invalid questions which were filtered out.");
    }
    
    if (validatedQuestions.length === 0) {
      throw new Error("The AI failed to generate any valid questions. Please try again.");
    }

    return { questions: validatedQuestions };
  }
);
