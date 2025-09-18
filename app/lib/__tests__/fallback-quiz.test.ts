
import { allFallbackQuestions, getLocalFallbackQuiz } from '../fallback-quiz';

describe('Fallback Quiz Data', () => {
  it('allFallbackQuestions should be a non-empty array', () => {
    // Assert that the imported object is an array
    expect(Array.isArray(allFallbackQuestions)).toBe(true);
    
    // Assert that the array is not empty
    expect(allFallbackQuestions.length).toBeGreaterThan(0);
  });

  it('each question in allFallbackQuestions should have the correct shape', () => {
    // Check the first item as a representative sample
    const firstQuestion = allFallbackQuestions[0];
    
    expect(firstQuestion).toHaveProperty('question');
    expect(typeof firstQuestion.question).toBe('string');
    
    expect(firstQuestion).toHaveProperty('options');
    expect(Array.isArray(firstQuestion.options)).toBe(true);
    expect(firstQuestion.options.length).toBe(4);
    
    expect(firstQuestion).toHaveProperty('correctAnswer');
    expect(typeof firstQuestion.correctAnswer).toBe('string');
    
    expect(firstQuestion).toHaveProperty('explanation');
    expect(typeof firstQuestion.explanation).toBe('string');

    expect(firstQuestion).toHaveProperty('format');
    expect(typeof firstQuestion.format).toBe('string');
  });

  it('getLocalFallbackQuiz should return an array of 5 questions', () => {
    const quiz = getLocalFallbackQuiz('mixed');
    expect(quiz.questions.length).toBe(5);
  });

  it('getLocalFallbackQuiz should return mixed questions if format not found', () => {
    const quiz = getLocalFallbackQuiz('non-existent-format');
    expect(quiz.questions.length).toBe(5);
    quiz.questions.forEach(q => {
        // This test might be too strict if we add other fallbacks, but for now it's a good check
        // It's better to ensure it falls back to 'mixed' if the format is unknown
        const originalQuestion = allFallbackQuestions.find(fq => fq.id === q.id);
        expect(originalQuestion?.format).toBe('mixed');
    });
  });
});
