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

function fallbackHint(question?: QuizQuestion): string {
  if (!question) {
    return 'Review the topic and eliminate obviously incorrect options.';
  }
  if (question.correctAnswer) {
    return 'Think carefully about the question and try to exclude unlikely options.';
  }
  if (Array.isArray(question.options) && question.options.length) {
    return 'Try to eliminate options that don’t match the question context.';
  }
  return 'Consider basic concepts and make your best guess.';
}

const prompt = ai.definePrompt({
  name: 'GenerateHint',
  input: { schema: HintInputSchema },
  output: { schema: z.object({ hint: z.string() }) },
  prompt: `
You are a helpful assistant generating a hint for the following cricket quiz question.
Do not reveal the correct answer "{{question.correctAnswer}}". Provide only one subtle hint.

Question: "{{question.question}}"
Options:
{{#each question.options}}
- {{this}}
{{/each}}

Generate a concise, indirect hint to assist the user.
`,
  config: {
    retries: 2,
  },
});

const getHintFlow = ai.defineFlow(
  {
    name: 'AIHintFlow',
    inputSchema: HintInputSchema,
    outputSchema: HintOutputSchema,
  },
  async (input) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const validation = HintInputSchema.safeParse(input);
    if (!validation.success) {
      console.warn(`[AI Hint][${requestId}] Invalid input:`, validation.error.format());
      return {
        hint: fallbackHint(),
        source: 'fallback',
        debug: IS_DEVELOPMENT ? 'Invalid input shape' : undefined,
      };
    }

    try {
      console.info(`[AI Hint][${requestId}] Requesting hint from AI`);
      const { output } = await prompt(validation.data);

      if (!output?.hint || output.hint.trim().length < 5) {
        throw new Error('Invalid or empty hint from AI');
      }

      console.info(`[AI Hint][${requestId}] Hint generated successfully`);
      return {
        hint: output.hint.trim(),
        source: 'ai',
      };
    } catch (error: any) {
      console.error(`[AI Hint][${requestId}] Error generating hint:`, error?.message || error);
      return {
        hint: fallbackHint(validation.data.question),
        source: 'fallback',
        debug: IS_DEVELOPMENT ? (error instanceof Error ? error.message : String(error)) : undefined,
      };
    }
  }
);
    