'use server';

import { generate } from '@genkit-ai/ai';
import { z } from 'zod';

const quizSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answer: z.string(),
  })
);

export async function generateQuizFromAI(): Promise<
  { question: string; options: string[]; answer: string }[]
> {
  try {
    const result = await generate({
      model: 'googleai/gemini-pro',
      prompt: `
Generate 5 very tough cricket multiple choice questions in the following JSON format:

[
  {
    "question": "Which player scored the most runs in IPL 2023?",
    "options": ["Virat Kohli", "Shubman Gill", "Faf du Plessis", "David Warner"],
    "answer": "Shubman Gill"
  },
  ...
]
Only return valid JSON. Do NOT include markdown or extra text.
      `,
    });

    const raw = result.text();

    // Try to extract the JSON part only
    const match = raw.match(/\[.*\]/s);
    if (!match) throw new Error('No JSON found in AI response.');

    const cleaned = match[0];
    const parsed = JSON.parse(cleaned);
    const validated = quizSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('❌ AI Quiz Generation Failed:', error);

    // Fallback questions
    return [
      {
        question: 'Who won the ICC Cricket World Cup in 2019?',
        options: ['India', 'New Zealand', 'England', 'Australia'],
        answer: 'England',
      },
      {
        question: 'Which country hosted the 2023 Cricket World Cup?',
        options: ['India', 'England', 'Australia', 'South Africa'],
        answer: 'India',
      },
      {
        question: 'Which bowler took the most wickets in IPL 2022?',
        options: ['Jasprit Bumrah', 'Mohammed Shami', 'Yuzvendra Chahal', 'Rashid Khan'],
        answer: 'Yuzvendra Chahal',
      },
      {
        question: 'Which Indian batsman has the most centuries in Tests?',
        options: ['Sachin Tendulkar', 'Virat Kohli', 'Sunil Gavaskar', 'Rahul Dravid'],
        answer: 'Sachin Tendulkar',
      },
      {
        question: 'What does LBW stand for?',
        options: ['Leg by wicket', 'Leg before wicket', 'Long back wicket', 'Low back wicket'],
        answer: 'Leg before wicket',
      },
    ];
  }
}
