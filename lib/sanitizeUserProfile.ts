
import { Timestamp } from "firebase/firestore";
import type { QuizAttempt } from '@/ai/schemas';

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
 * @returns A sanitized QuizAttempt object.
 */
export function sanitizeQuizAttempt(raw: any): Partial<QuizAttempt> {
  const sanitized: Partial<QuizAttempt> = {};

  sanitized.userId = String(raw?.userId ?? "");
  sanitized.slotId = String(raw?.slotId ?? "");
  sanitized.brand = String(raw?.brand ?? "Unknown");
  sanitized.format = String(raw?.format ?? "Mixed");

  sanitized.questions = Array.isArray(raw?.questions)
    ? raw.questions.map((q: any) => ({
        id: String(q?.id ?? Math.random().toString(36).substring(2)),
        question: String(q?.question ?? ""),
        options: Array.isArray(q?.options) ? q.options.map(String) : [],
        correctAnswer: String(q?.correctAnswer ?? ""),
        explanation: String(q?.explanation ?? ""),
      }))
    : [];
  
  sanitized.totalQuestions = sanitized.questions.length;

  const answers = Array.isArray(raw?.userAnswers) ? raw.userAnswers.map(String) : [];
  while (answers.length < sanitized.totalQuestions) {
    answers.push(""); // Pad with empty string for unanswered
  }
  sanitized.userAnswers = answers;

  const score = Number(raw?.score);
  sanitized.score = Number.isFinite(score) ? Math.floor(score) : 0;

  sanitized.timestamp = Number(raw?.timestamp) || Date.now();
  
  const timePer = Array.isArray(raw?.timePerQuestion) ? raw.timePerQuestion.map(Number) : [];
   while (timePer.length < sanitized.totalQuestions) {
    timePer.push(0);
  }
  sanitized.timePerQuestion = timePer;

  sanitized.unanswered = raw?.unanswered ?? (sanitized.totalQuestions - answers.filter(a => a).length);
  
  // Explicitly handle the 'reason' field to prevent 'undefined' values.
  if (raw?.reason && typeof raw.reason === 'string') {
    sanitized.reason = raw.reason;
  }

  sanitized.source = raw?.source === 'ai' ? 'ai' : 'fallback';
  sanitized.reviewed = !!raw?.reviewed;

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
