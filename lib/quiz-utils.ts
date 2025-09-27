
'use client';

import type { QuizAttempt, QuizData } from '@/ai/schemas';
import type { User } from 'firebase/auth';
import { getQuizSlotId } from '@/lib/utils';
import { sanitizeQuizAttempt as sanitizeAttemptData } from './sanitizeUserProfile';

/**
 * Encodes a QuizAttempt object into a Base64 string for URL transport.
 */
export const encodeAttempt = (attempt: QuizAttempt): string => {
    try {
        const sanitized = sanitizeAttemptData(attempt);
        // Using native btoa for browser environments.
        return encodeURIComponent(btoa(JSON.stringify(sanitized)));
    } catch (e) {
        console.error("Failed to encode attempt:", e);
        return "";
    }
}

/**
 * Decodes a Base64 string from a URL into a QuizAttempt object.
 */
export const decodeAttempt = (encodedAttempt: string): QuizAttempt | null => {
    try {
        // Using native atob for browser environments.
        return JSON.parse(atob(decodeURIComponent(encodedAttempt)));
    } catch (e) {
        console.error("Failed to decode attempt:", e);
        return null;
    }
}


interface BuildAttemptArgs {
    user: User;
    quizData: QuizData;
    brand: string;
    format: string;
    userAnswers: string[];
    timePerQuestion: number[];
    overrides?: Partial<QuizAttempt>;
    source: 'ai' | 'fallback';
}

/**
 * Counts the number of unanswered questions.
 */
export const countUnanswered = (answers: Array<string | null | undefined>): number =>
  answers.filter((a) => !a || String(a).trim() === "").length;


/**
 * Constructs a fully-formed QuizAttempt object.
 */
export const buildAttempt = ({
    user,
    quizData,
    brand,
    format,
    userAnswers,
    timePerQuestion,
    overrides = {},
    source,
}: BuildAttemptArgs): QuizAttempt => {
    const score = overrides.score ?? quizData.questions.reduce((acc, q, i) => userAnswers[i] === q.correctAnswer ? acc + 1 : acc, 0);
    
    const unansweredCount = countUnanswered(userAnswers);

    const attemptObject: QuizAttempt = {
        userId: user.uid,
        slotId: getQuizSlotId(),
        brand,
        format,
        questions: quizData.questions,
        userAnswers,
        score,
        totalQuestions: quizData.questions.length,
        timestamp: Date.now(),
        timePerQuestion,
        source,
        unanswered: unansweredCount,
        reviewed: false, // Always initialize as not reviewed
        ...overrides,
    };

    // Sanitize before returning to ensure no undefined fields are ever present.
    return sanitizeAttemptData(attemptObject) as QuizAttempt;
};
    