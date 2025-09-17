
'use server';

/**
 * @fileOverview Provides AI-powered hints for quiz questions.
 *
 * This flow generates a contextual hint for a given quiz question, helping the user
 * without giving away the answer directly. It includes robust error handling to provide
 * a helpful fallback hint if the AI generation fails.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuizQuestion as QuizQuestionType, HintOutput } from '@/ai/schemas';
import { QuizQuestion as QuestionSchema, HintOutputSchema } from '@/ai/schemas';

const IS_DEV = process.env.NODE_ENV !== "production";

const HintInputSchema = z.object({
  question: QuestionSchema,
});

export type HintInput = z.infer<typeof HintInputSchema>;

// The main function exported to the client. It wraps the Genkit flow.
export async function getAIPoweredHint(input: HintInput): Promise<HintOutput> {
  return getAIPoweredHintFlow(input);
}

function fallbackHintForQuestion(q?: QuizQuestionType): string {
  if (!q) return 'Review relevant topics and eliminate clearly incorrect options.';
  if (q.correctAnswer) return 'Focus on the most plausible options and discard unlikely ones.';
  if (Array.isArray(q.options) && q.options.length)
    return 'Exclude options irrelevant to the question stem.';
  return 'Consider the key facts and make an informed choice.';
}

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

// Defines the full Genkit flow with robust error handling.
const getAIPoweredHintFlow = ai.defineFlow(
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
      return { hint: fallbackHintForQuestion(), source: 'fallback', debug: IS_DEV ? 'invalid_input' : undefined };
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
        hint: fallbackHintForQuestion(parseResult.data.question),
        source: 'fallback',
        debug: IS_DEV ? (error instanceof Error ? error.message : String(error)) : undefined,
      };
    }
  }
);
