
import { Timestamp } from "firebase/firestore";
import type { QuizAttempt } from '@/ai/schemas';
import { countUnanswered } from "./quiz-utils";

/**
 * @fileOverview User Profile and Data Sanitizer
 *
 * This utility function sanitizes objects before they are sent to Firestore or AI flows.
 * It performs key operations:
 * 1.  Removes any properties with `undefined` values.
 * 2.  Converts `Date` objects or specific date strings into Firestore `Timestamp` objects.
 * 3.  Pads missing arrays or fields in a QuizAttempt to ensure it meets a minimum structure before strict validation.
 */

/**
 * A comprehensive sanitizer for QuizAttempt objects before they are validated.
 * This function handles missing fields, incorrect types, and ensures the structure
 * is consistent for AI processing.
 * @param raw - The raw quiz attempt object from Firestore or client.
 * @returns A sanitized QuizAttempt object, or null if the input is invalid.
 */
export function sanitizeQuizAttempt(raw: any): Partial<QuizAttempt> | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const sanitized: Partial<QuizAttempt> = {};

  sanitized.userId = String(raw.userId ?? "");
  sanitized.slotId = String(raw.slotId ?? "");
  sanitized.brand = String(raw.brand ?? "Unknown");
  sanitized.format = String(raw.format ?? "Mixed");

  sanitized.questions = Array.isArray(raw.questions)
    ? raw.questions.map((q: any) => ({
        id: String(q?.id ?? Math.random().toString(36).substring(2)),
        question: String(q?.question ?? ""),
        options: Array.isArray(q?.options) ? q.options.map(String) : [],
        correctAnswer: String(q?.correctAnswer ?? ""),
        explanation: String(q?.explanation ?? ""),
      }))
    : [];
  
  sanitized.totalQuestions = sanitized.questions.length;

  const answers = Array.isArray(raw.userAnswers) ? raw.userAnswers.map(String) : [];
  while (answers.length < sanitized.totalQuestions) {
    answers.push("");
  }
  sanitized.userAnswers = answers.slice(0, sanitized.totalQuestions);

  const score = Number(raw.score);
  sanitized.score = Number.isFinite(score) ? Math.floor(score) : 0;

  if (raw.timestamp instanceof Timestamp) {
    sanitized.timestamp = raw.timestamp.toMillis();
  } else if (raw.timestamp && typeof raw.timestamp === 'object' && 'seconds' in raw.timestamp) {
    sanitized.timestamp = new Timestamp(raw.timestamp.seconds, raw.timestamp.nanoseconds).toMillis();
  } else if (typeof raw.timestamp === 'number') {
    sanitized.timestamp = raw.timestamp;
  } else {
    sanitized.timestamp = Date.now();
  }
  
  const timePer = Array.isArray(raw.timePerQuestion) ? raw.timePerQuestion.map(Number) : [];
   while (timePer.length < sanitized.totalQuestions) {
    timePer.push(0);
  }
  sanitized.timePerQuestion = timePer.slice(0, sanitized.totalQuestions);

  sanitized.unanswered = countUnanswered(sanitized.userAnswers);
  
  // Explicitly handle the 'reason' field: only include it if it's a non-empty string.
  if (raw.reason && typeof raw.reason === 'string') {
    sanitized.reason = raw.reason;
  }

  sanitized.source = raw.source === 'ai' ? 'ai' : 'fallback';
  sanitized.reviewed = !!raw.reviewed;

  // Final check to remove any top-level undefined properties
  Object.keys(sanitized).forEach(keyStr => {
    const key = keyStr as keyof typeof sanitized;
    if ((sanitized as any)[key] === undefined) {
      delete (sanitized as any)[key];
    }
  });

  return sanitized;
}


export function sanitizeUserProfile(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeUserProfile(item)).filter(item => item !== undefined);
  }

  const sanitizedObject: { [key: string]: any } = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      const value = data[key];

      if (key === 'dob' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          sanitizedObject[key] = Timestamp.fromDate(date);
        }
      } else if (value instanceof Date) {
        sanitizedObject[key] = Timestamp.fromDate(value);
      } else if (value instanceof Timestamp) {
        sanitizedObject[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitizedObject[key] = sanitizeUserProfile(value);
      } else {
        sanitizedObject[key] = value;
      }
    }
  }

  return sanitizedObject;
}
