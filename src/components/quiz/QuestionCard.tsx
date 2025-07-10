
'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/ai/schemas';

const QuizOption = memo(({ option, index, isSelected, selectedOption, handleAnswerSelect }: {
    option: string;
    index: number;
    isSelected: boolean;
    selectedOption: string | null;
    handleAnswerSelect: (option: string) => void;
}) => {
    return (
        <Button
            onClick={() => handleAnswerSelect(option)}
            disabled={!!selectedOption}
            variant="outline"
            className={cn(
                'relative w-full h-auto py-3 text-sm whitespace-normal justify-start text-left transition-all duration-300 ease-in-out',
                !selectedOption && 'hover:bg-primary/10 hover:border-primary',
                selectedOption && {
                    'opacity-50': !isSelected,
                    'bg-primary text-primary-foreground border-primary': isSelected,
                }
            )}
        >
            <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
        </Button>
    );
});
QuizOption.displayName = 'QuizOption';

const QuestionCardComponent = ({ question, isHintVisible, options, selectedOption, handleAnswerSelect }: {
    question: QuizQuestion;
    isHintVisible: boolean;
    options: string[];
    selectedOption: string | null;
    handleAnswerSelect: (option: string) => void;
}) => (
    <Card className="w-full bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                {question.questionText}
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
                    selectedOption={selectedOption}
                    handleAnswerSelect={handleAnswerSelect}
                />
            ))}
        </CardContent>
    </Card>
);

QuestionCardComponent.displayName = 'QuestionCard';
export const QuestionCard = memo(QuestionCardComponent);
