
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
    return 'Focus on the most plausible options and discard unlikely ones.';
  }
  if (Array.isArray(question.options) && question.options.length)
    return 'Exclude options irrelevant to the question stem.';
  return 'Consider the key facts and make an informed choice.';
};

const prompt = ai.definePrompt({
  name: 'getAIPoweredHintPrompt',
  input: { schema: HintInputSchema },
  output: { schema: z.object({ hint: z.string() }) },
  prompt: `
You are a helpful cricket quiz assistant. Provide a single, smart, and indirect hint without revealing the correct answer "{{question.correctAnswer}}".

Question: "{{question.question}}"
Options:
{{#each question.options}}
- {{this}}
{{/each}}

Generate one concise, indirect hint.
  `,
  config: {
    retries: 2,
  },
});

const getHintFlow = ai.defineFlow(
  {
    name: 'getAIPoweredHintFlow',
    inputSchema: HintInputSchema,
    outputSchema: HintOutputSchema,
  },
  async (input) => {
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const parseResult = HintInputSchema.safeParse(input);
    if (!parseResult.success) {
      console.warn(`[hints][${reqId}] invalid question input`, parseResult.error.format());
      return { hint: fallbackHint(), source: 'fallback', debug: IS_DEV ? 'invalid_input' : undefined };
    }

    try {
      console.info(`[hints][${reqId}] requesting AI hint`);
      const { output } = await prompt(parseResult.data);

      if (!output?.hint || output.hint.trim().length < 5) {
        throw new Error('AI returned invalid or empty hint');
      }

      console.info(`[hints][${reqId}] AI hint generated`);
      return { hint: output.hint.trim(), source: 'ai' };
    } catch (error: any) {
      console.error(`[hints][${reqId}] AI hint failed:`, error?.message ?? error);
      return {
        hint: fallbackHint(parseResult.data.question),
        source: 'fallback',
        debug: IS_DEV ? (error instanceof Error ? error.message : String(error)) : undefined,
      };
    }
  }
);
    