
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
        // Use a simple JSON stringify and btoa for transport. The data is already sanitized
        // before this function is called.
        const jsonString = JSON.stringify(attempt);
        return btoa(jsonString);
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
        const decodedJsonString = atob(encodedAttempt);
        return JSON.parse(decodedJsonString);
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
    
    const unansweredCount = userAnswers.filter(a => a === "").length;

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
