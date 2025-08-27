
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
import type { QuizQuestion as QuizQuestionType } from '@/ai/schemas';
import { QuizQuestion as QuestionSchema } from '@/ai/schemas';

const IS_DEV = process.env.NODE_ENV !== "production";

const HintInputSchema = z.object({
  question: QuestionSchema,
});
export type HintInput = z.infer<typeof HintInputSchema>;

export const HintOutputSchema = z.object({
  hint: z.string().min(1),
  source: z.enum(["ai", "fallback"]),
  debug: z.string().optional(),
});
export type HintOutput = z.infer<typeof HintOutputSchema>;

// The main function exported to the client. It wraps the Genkit flow.
export async function getAIPoweredHint(input: HintInput): Promise<HintOutput> {
  return getAIPoweredHintFlow(input);
}


function fallbackHintForQuestion(q?: QuizQuestionType): string {
    if (!q) return "Review the topic related to this question and try eliminating obviously incorrect options.";
    if (q.correctAnswer) {
      return "Think about which option directly answers the question. Eliminate options that are clearly unrelated and choose the best match.";
    }
    if (Array.isArray(q.options) && q.options.length) {
      return "Try eliminating choices that are factually incorrect or irrelevant to the question. Trust the option that directly addresses the question stem.";
    }
    return "Review the basics for this topic, then try answering by eliminating unlikely options.";
}


const prompt = ai.definePrompt({
    name: 'getAIPoweredHintPrompt',
    input: { schema: HintInputSchema },
    output: { schema: z.object({ hint: z.string() }) },
    prompt: `
    You are a helpful cricket quiz assistant. Your goal is to provide a single, smart, and indirect hint for the following cricket question.

    The hint MUST NOT give away the correct answer ("{{question.correctAnswer}}").
    Instead, it should guide the user by providing context, a related fact, or helping them eliminate one or two incorrect options.
    Be creative and encouraging.

    Question: "{{question.question}}"

    Options:
    {{#each question.options}}
    - {{this}}
    {{/each}}

    Generate a single, smart hint.
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
        
        const validatedInput = HintInputSchema.safeParse(input);

        if (!validatedInput.success) {
            console.warn(`[hints][${reqId}] invalid question shape, returning fallback hint`, validatedInput.error.format());
            return { hint: fallbackHintForQuestion(), source: "fallback", debug: IS_DEV ? "invalid_question_shape" : undefined };
        }

        try {
            console.info(`[hints][${reqId}] calling AI for hint`);
            const { output } = await prompt(validatedInput.data);
            
            if (!output || !output.hint || output.hint.trim().length < 5) {
                throw new Error("AI returned an empty or invalid hint.");
            }

            console.info(`[hints][${reqId}] AI hint generated`);
            return { hint: output.hint.trim(), source: "ai" };

        } catch (error: any) {
            console.error(`[hints][${reqId}] AI hint failed:`, error?.message ?? error);
            const fbHint = fallbackHintForQuestion(validatedInput.data.question);
            return {
                hint: fbHint,
                source: "fallback",
                debug: IS_DEV ? String(error?.message ?? error) : undefined,
            };
        }
    }
);
