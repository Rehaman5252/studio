
import type { QuizQuestion as QuizDataQuestion } from '@/ai/schemas';

/**
 * @fileOverview Fallback quiz data source.
 * This file contains a curated list of high-quality questions used as a fallback
 * when the primary AI generation system fails or when Firestore is unavailable.
 */

// Helper to shuffle an array, used for local fallback.
export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export type QuizQuestion = Omit<QuizDataQuestion, 'id'> & { 
    id: string; // id is now mandatory here
    format: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Expert';
    hint: string;
};

// A smaller, local fallback in case Firestore fails.
export const localFallbackQuestions: QuizQuestion[] = [
    { id: 'lfb_mix_1', format: 'mixed', difficulty: 'Easy', question: 'How many players are there on a standard cricket team?', options: ['9', '10', '11', '12'], correctAnswer: '11', explanation: 'A standard cricket team consists of eleven players on the field.', hint: 'It\'s one more than a standard soccer team.' },
    { id: 'lfb_mix_2', format: 'mixed', difficulty: 'Easy', question: 'What is a "maiden over"?', options: ['An over with 1 wicket', 'An over with 6 wides', 'An over with no runs scored', 'An over bowled by a female cricketer'], correctAnswer: 'An over with no runs scored', explanation: 'A maiden over is an over in which the bowler does not concede any runs scored off the bat.', hint: 'Think about what "maiden" means in the context of being first or untouched.' },
    { id: 'lfb_ipl_1', format: 'ipl', difficulty: 'Easy', question: 'Which team has won the most IPL titles?', options: ['Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bangalore'], correctAnswer: 'Mumbai Indians', explanation: 'Mumbai Indians hold the record for the most IPL championship titles.', hint: 'This team is captained by Rohit Sharma.' },
    { id: 'lfb_t20_1', format: 't20', difficulty: 'Easy', question: 'Which team won the first-ever ICC Men\'s T20 World Cup in 2007?', options: ['Pakistan', 'Australia', 'England', 'India'], correctAnswer: 'India', explanation: 'India, under the captaincy of MS Dhoni, won the inaugural T20 World Cup by defeating Pakistan in the final.', hint: 'The final was decided in a thrilling last over bowled by Joginder Sharma.' },
    { id: 'lfb_odi_1', format: 'odi', difficulty: 'Easy', question: 'Who is the only player to have scored three double centuries in ODIs?', options: ['Sachin Tendulkar', 'Virender Sehwag', 'Chris Gayle', 'Rohit Sharma'], correctAnswer: 'Rohit Sharma', explanation: 'Rohit Sharma of India has uniquely scored three double hundreds in One Day Internationals.', hint: 'This Indian opener is nicknamed the "Hitman".' },
    { id: 'lfb_test_1', format: 'test', difficulty: 'Easy', question: 'Sir Donald Bradman famously finished his Test career with what batting average?', options: ['99.94', '100.00', '98.67', '95.14'], correctAnswer: '99.94', explanation: 'Requiring only four runs in his final innings to average 100, Don Bradman was famously bowled for a duck, finishing with an average of 99.94.', hint: 'It\'s famously just short of a perfect three-digit number.' },
    { id: 'lfb_wpl_1', format: 'wpl', difficulty: 'Easy', question: 'Which team won the inaugural Women\'s Premier League (WPL) in 2023?', options: ['Delhi Capitals', 'UP Warriorz', 'Mumbai Indians', 'Royal Challengers Bangalore'], correctAnswer: 'Mumbai Indians', explanation: 'Mumbai Indians, led by Harmanpreet Kaur, defeated Delhi Capitals in the final to become the champions of the first-ever WPL season.', hint: 'This team shares its name with a multiple-time men\'s IPL champion.' },
];

/**
 * Retrieves a fallback quiz from the small local array. This is only used
 * if Firestore is unavailable or fails.
 * @param format The cricket format (e.g., 'ipl', 't20').
 * @returns A QuizData object containing 5 questions.
 */
export function getFallbackQuiz(format: string): { questions: QuizQuestion[] } {
  const normalizedFormat = format.toLowerCase();
  const questionsForFormat = localFallbackQuestions.filter(
    (q) => q.format === normalizedFormat
  );

  const questions =
    questionsForFormat.length > 0
      ? questionsForFormat
      : localFallbackQuestions.filter((q) => q.format === 'mixed');

  return { questions: shuffleArray(questions).slice(0, 5) };
}
