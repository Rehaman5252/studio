import { allFallbackQuestions, getLocalFallbackQuiz } from '../fallback-quiz';

describe('Fallback quiz data integrity', () => {
  it('should export a non-empty array of fallback questions', () => {
    expect(Array.isArray(allFallbackQuestions)).toBe(true);
    expect(allFallbackQuestions.length).toBeGreaterThan(0);
  });

  it('should ensure every question has required fields', () => {
    for (const q of allFallbackQuestions) {
      expect(typeof q.id).toBe('string');
      expect(q.id).not.toBe("");

      expect(typeof q.question).toBe('string');
      expect(q.question).not.toBe("");
      
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
      q.options.forEach(opt => expect(typeof opt).toBe('string'));
      
      expect(typeof q.correctAnswer).toBe('string');
      expect(q.correctAnswer).not.toBe("");
      expect(q.options).toContain(q.correctAnswer);

      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(0);

      expect(typeof q.format).toBe('string');
      expect(q.format.length).toBeGreaterThan(0);
    }
  });
  
  it('should enforce unique IDs across all fallback questions', () => {
    const ids = allFallbackQuestions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('getLocalFallbackQuiz should return 5 unique questions', () => {
    const quiz = getLocalFallbackQuiz('mixed');
    expect(quiz.questions.length).toBe(5);
    const questionIds = new Set(quiz.questions.map(q => q.id));
    expect(questionIds.size).toBe(5);
  });
});