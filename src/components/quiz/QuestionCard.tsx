
'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/mockData';

const QuizOption = memo(({ option, index, isSelected, isCorrect, isRevealed, handleAnswerSelect }: {
    option: string;
    index: number;
    isSelected: boolean;
    isCorrect: boolean;
    isRevealed: boolean;
    handleAnswerSelect: (option: string) => void;
}) => {
    return (
        <Button
            onClick={() => handleAnswerSelect(option)}
            disabled={isRevealed}
            variant="outline"
            className={cn(
                'relative w-full h-auto py-3 text-sm whitespace-normal justify-start text-left transition-all duration-300 ease-in-out border-2',
                !isRevealed && 'hover:bg-primary/10 hover:border-primary',
                isRevealed && {
                    'bg-green-500/20 border-green-500 text-foreground': isCorrect,
                    'bg-red-500/20 border-red-500 text-foreground': isSelected && !isCorrect,
                    'opacity-60 border-input': !isSelected && !isCorrect,
                }
            )}
        >
            <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
        </Button>
    );
});
QuizOption.displayName = 'QuizOption';

const QuestionCardComponent = ({ question, isHintVisible, options, selectedOption, handleAnswerSelect, isAnswerLocked, correctAnswer }: {
    question: QuizQuestion;
    isHintVisible: boolean;
    options: string[];
    selectedOption: string | null;
    handleAnswerSelect: (option: string) => void;
    isAnswerLocked: boolean;
    correctAnswer: string;
}) => (
    <Card className="w-full bg-card shadow-lg min-h-[360px]">
        <CardHeader>
            <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                {question.question}
            </CardTitle>
            {isHintVisible && question.hint && (
                <p className="text-sm text-primary pt-2 animate-in fade-in">
                    <strong>Hint:</strong> {question.hint}
                </p>
            )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option, index) => (
                <QuizOption
                    key={`${option}-${index}`}
                    option={option}
                    index={index}
                    isSelected={selectedOption === option}
                    isCorrect={correctAnswer === option}
                    isRevealed={isAnswerLocked}
                    handleAnswerSelect={handleAnswerSelect}
                />
            ))}
        </CardContent>
    </Card>
);

QuestionCardComponent.displayName = 'QuestionCard';
export const QuestionCard = memo(QuestionCardComponent);
