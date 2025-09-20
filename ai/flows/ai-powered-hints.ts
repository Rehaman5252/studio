
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuizQuestion, HintOutput } from '@/ai/schemas';
import { QuizQuestion as QuestionSchema, HintOutputSchema } from '@/ai/schemas';

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

const HintInputSchema = z.object({
  question: QuestionSchema,
});

export type HintInput = z.infer<typeof HintInputSchema>;

export async function getAIPoweredHint(input: HintInput): Promise<HintOutput> {
  return getHintFlow(input);
}

const fallbackHint = (question?: QuizQuestion): string => {
  if (!question) {
    return 'Review relevant topics and eliminate clearly incorrect options.';
  }
  if (question.correctAnswer) {
    return 'Focus on eliminating unlikely choices.';
  }
  if (Array.isArray(question.options) && question.options.length)
    return 'Try to exclude options unrelated to the question.';
  return 'Consider basic principles before choosing.';
};

const prompt = ai.definePrompt({
  name: 'GenerateHint',
  input: { schema: HintInputSchema },
  output: { schema: z.object({ hint: z.string() }) },
  prompt: `
You are a helpful assistant generating a subtle hint for the following cricket quiz question.
Do not reveal the correct answer "{{question.correctAnswer}}".

Question: "{{question.question}}"
Options:
{{#each question.options}}
- {{this}}
{{/each}}

Provide one concise, indirect hint.
`,
  config: {
    retries: 2,
  },
});

const getHintFlow = ai.defineFlow(
  {
    name: 'HintGenerationFlow',
    inputSchema: HintInputSchema,
    outputSchema: HintOutputSchema,
  },
  async (input: HintInput) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const parsed = HintInputSchema.safeParse(input);
    if (!parsed.success) {
      console.warn(`[HintFlow][${requestId}] Invalid input: `, parsed.error.format());
      return {
        hint: fallbackHint(),
        source: 'fallback',
        debug: IS_DEVELOPMENT ? 'Invalid input schema' : undefined,
      };
    }

    try {
      console.info(`[HintFlow][${requestId}] Requesting hint from AI`);
      const { output } = await prompt(parsed.data);

      if (!output?.hint || output.hint.trim().length < 5) {
        throw new Error('Invalid or empty hint from AI');
      }

      console.info(`[HintFlow][${requestId}] Hint generated`);
      return {
        hint: output.hint.trim(),
        source: 'ai',
      };
    } catch (error: any) {
      console.error(`[HintFlow][${requestId}] Error generating hint:`, error);
      return {
        hint: fallbackHint(parsed.data.question),
        source: 'fallback',
        debug: IS_DEVELOPMENT ? (error instanceof Error ? error.message : String(error)) : undefined,
      };
    }
  }
);
    
