
'use server';

/**
 * @fileOverview A flow that generates a 5-question quiz on a given cricket topic.
 *
 * - generateQuiz - A function that generates a quiz.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateQuizInput,
    GenerateQuizOutput,
    GenerateQuizInputSchema,
    GenerateQuizOutputSchema,
} from '@/ai/schemas';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are a master cricket quiz creator. Your primary goal is to generate 5 completely unique and exceptionally difficult trivia questions for an expert-level quiz.

**CRITICAL INSTRUCTIONS for Uniqueness and Quality:**
1.  **ABSOLUTE UNIQUENESS**: The questions you generate MUST be original and obscure. Do NOT use common, widely-known cricket trivia. The user should feel like they have never encountered these questions before.
2.  **DEEP SPECIFICITY**: Questions should target very specific moments, statistics, or niche rules from the requested cricket format. Avoid broad or general knowledge questions.
3.  **NO REPETITION**: You must ensure that the 5 questions in this set are completely different from each other.

The user has requested a quiz for the following context:
- Format: {{{format}}}
- Brand: {{{brand}}}

For each of the 5 questions, you MUST provide the following structure:
- "questionText": The unique and difficult trivia question.
- "options": An array of exactly four plausible, closely-related options. One must be correct.
- "correctAnswer": The single correct answer, which MUST exactly match one of the provided options.
- "hint": A clever, single-sentence hint that points towards the answer without giving it away.
- "explanation": A brief, clear explanation of the correct answer.

The quiz must be challenging even for the most dedicated cricket enthusiasts. The tone should be engaging and fun.
`,
  config: {
    // Set extremely permissive safety settings to prevent the model from blocking valid responses.
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    return output;
  }
);
