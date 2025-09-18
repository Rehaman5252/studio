
import { allFallbackQuestions, getLocalFallbackQuiz } from '../fallback-quiz';

describe('Fallback quiz data integrity', () => {
  it('should export a non-empty array of fallback questions', () => {
    expect(Array.isArray(allFallbackQuestions)).toBe(true);
    expect(allFallbackQuestions.length).toBeGreaterThan(0);
  });

  it('should ensure every question has required fields', () => {
    const ids = new Set();
    for (const q of allFallbackQuestions) {
      // ID must exist and be unique
      expect(q).toHaveProperty('id');
      expect(typeof q.id).toBe('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);

      // Question must be a non-empty string
      expect(q).toHaveProperty('question');
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);

      // Options must be an array of at least 2 strings
      expect(q).toHaveProperty('options');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      q.options.forEach(opt => expect(typeof opt).toBe('string'));
      
      // Correct answer must be a string and exist in the options
      expect(q).toHaveProperty('correctAnswer');
      expect(typeof q.correctAnswer).toBe('string');
      expect(q.options).toContain(q.correctAnswer);

      // Explanation and format must be non-empty strings
      expect(q).toHaveProperty('explanation');
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(0);

      expect(q).toHaveProperty('format');
      expect(typeof q.format).toBe('string');
      expect(q.format.length).toBeGreaterThan(0);
    }
  });

  it('getLocalFallbackQuiz should return 5 unique questions', () => {
    const quiz = getLocalFallbackQuiz('mixed');
    expect(quiz.questions.length).toBe(5);
    const questionIds = new Set(quiz.questions.map(q => q.id));
    expect(questionIds.size).toBe(5);
  });
});
