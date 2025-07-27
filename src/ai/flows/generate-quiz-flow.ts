
'use server';

/**
 * @fileOverview A flow that generates a 5-question cricket quiz.
 * This flow attempts to generate a valid quiz from an AI model.
 * If generation or validation fails, it throws an error to be handled by the calling API route.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { QuizQuestion } from '@/lib/mockData';

const GenerateQuizInputSchema = z.object({
  format: z.string().describe("The cricket format for the quiz (e.g., T20, IPL, Test)."),
  userId: z.string().describe("The unique ID of the user requesting the quiz."),
  askedQuestionIds: z.array(z.string()).optional().describe("An array of question IDs that the user has already seen to ensure variety."),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      format: z.string(),
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswer: z.string(),
      explanation: z.string().optional(),
    })
  ).length(5),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

// AIGeneratedQuestionSchema defines the structure we expect from the AI *before* validation and ID assignment.
const AIGeneratedQuestionSchema = z.object({
  question: z.string().describe("The full text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answer options."),
  correctAnswer: z.string().describe("The correct answer. CRITICALLY: This MUST be an exact, case-sensitive match to one of the strings in the 'options' array."),
  explanation: z.string().optional().describe("A brief, interesting explanation for the correct answer."),
});

// AIGeneratedResponseSchema defines the overall structure of the AI's JSON output.
const AIGeneratedResponseSchema = z.object({
    questions: z.array(AIGeneratedQuestionSchema).min(5).max(5),
});

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  // NOTE: No output schema here. We will parse the text response manually for robustness.
  prompt: `You are an expert cricket quiz creator. Your task is to generate a JSON object containing exactly 5 unique, challenging, and interesting questions for a quiz about "{{format}}" cricket.

Ensure the questions cover a range of topics including player records, famous matches, and historical events related to the "{{format}}" format.

The user has already answered questions with the following IDs, so please generate completely new questions:
{{#if askedQuestionIds}}
{{#each askedQuestionIds}}
- {{this}}
{{/each}}
{{else}}
(No questions seen yet)
{{/if}}

Your response MUST be a single, valid JSON object that conforms to this structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

CRITICALLY: The value for 'correctAnswer' MUST be an exact, case-sensitive match to one of the strings in the 'options' array. Do not add any extra text or conversational pleasantries. Only output the JSON object.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    console.log('generateQuizFlow started with input:', input);

    const llmResponse = await prompt(input);
    const text = llmResponse.text();

    if (!text) {
        console.error("AI returned empty response.");
        throw new Error("AI did not return any output.");
    }
    
    let rawQuestions: any[];

    try {
        // Find the start and end of the JSON object.
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("AI response did not contain a JSON object.");
        }
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const parsedJson = JSON.parse(jsonString);

        // Check if the parsed JSON has the 'questions' property and it's an array.
        if (parsedJson && Array.isArray(parsedJson.questions)) {
            rawQuestions = parsedJson.questions;
        } else {
            throw new Error("Parsed JSON does not have a 'questions' array.");
        }
    } catch (e: any) {
        console.error("Failed to parse JSON from AI response:", e.message);
        console.error("Raw AI response:", text);
        throw new Error(`AI returned invalid JSON: ${e.message}`);
    }

    // Validate and transform the questions
    const validatedQuestions: QuizQuestion[] = rawQuestions
        .map(q => {
            const parsed = AIGeneratedQuestionSchema.safeParse(q);
            if (!parsed.success) {
                console.warn('AI generated an invalid question, filtering out:', parsed.error);
                return null;
            }
            if (!parsed.data.options.includes(parsed.data.correctAnswer)) {
                console.warn('AI generated a question where correctAnswer is not in options, filtering out:', parsed.data);
                return null;
            }
            return {
                ...parsed.data,
                id: uuidv4(),
                format: input.format,
            };
        })
        .filter((q): q is QuizQuestion => q !== null);

    // If, after validation, we don't have 5 questions, throw an error.
    if (validatedQuestions.length < 5) {
        console.error(`AI generated only ${validatedQuestions.length} valid questions.`);
        throw new Error("The AI failed to generate a complete and valid quiz.");
    }

    console.log('Successfully generated and validated 5 questions.');
    return { questions: validatedQuestions };
  }
);
