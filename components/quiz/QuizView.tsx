
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';
import { QuizQuestion } from '@/ai/schemas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const QUESTION_TIME_LIMIT = 20; // seconds

interface QuizViewProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    onAnswer: (answer: string) => void;
    onNoBall: (reason: 'no-ball') => void;
    brand: string;
    format: string;
    onHintRequest: () => void;
    hint: string | null;
    isHintLoading: boolean;
    soundEnabled: boolean;
}

export default function QuizView({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    onNoBall,
    brand,
    format,
    onHintRequest,
    hint,
    isHintLoading,
    soundEnabled
}: QuizViewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    const [isMuted, setIsMuted] = useState(!soundEnabled);
    const [showNoBallAlert, setShowNoBallAlert] = useState(false);
    
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({
        tick: null
    });
    
    // Auto-advance logic
    const handleSelectOption = (option: string) => {
        if (isAnswered) return; // Prevent changing answer
        
        setIsAnswered(true);
        setSelectedOption(option);
        
        // Wait a moment to show selection, then advance
        setTimeout(() => {
            onAnswer(option);
        }, 800);
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setShowNoBallAlert(true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const handleNoBallConfirm = () => {
        setShowNoBallAlert(false);
        onNoBall('no-ball');
    };
    
    useEffect(() => {
        setTimeLeft(QUESTION_TIME_LIMIT);
        setSelectedOption(null);
        setIsAnswered(false);
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Time's up, advance with no answer
                    setTimeout(() => onAnswer(""), 100);
                    return 0;
                }
                if(prev <= 6 && !isMuted) {
                    audioRefs.current.tick?.play().catch(e => console.log("Audio play failed", e));
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [question, onAnswer, isMuted]);
    
    const progressValue = (questionNumber / totalQuestions) * 100;

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background to-secondary/50 text-foreground p-4 overflow-hidden">
            {typeof window !== 'undefined' && (
                <>
                    <audio ref={el => audioRefs.current.tick = el} src="/sounds/tick.mp3" preload="auto" />
                </>
            )}

            {/* Header */}
            <header className="flex flex-col gap-4 mb-4 shrink-0">
                 <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-primary animate-pulse">{brand} - {format}</p>
                    <div className="relative h-16 w-16">
                         <CircularProgressbar
                            value={timeLeft}
                            maxValue={QUESTION_TIME_LIMIT}
                            text={`${timeLeft}`}
                            styles={buildStyles({
                                textColor: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                                pathColor: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                                trailColor: 'hsl(var(--muted))',
                                textSize: '28px',
                            })}
                         />
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h1>
                        <span className="text-sm font-semibold text-muted-foreground">{questionNumber}/{totalQuestions}</span>
                    </div>
                    <Progress value={progressValue} className="h-2 w-full" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full max-w-2xl space-y-6"
                    >
                        <Card className="shadow-lg bg-transparent border-0 text-center">
                            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">{question.question}</h2>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((option) => {
                                const isSelected = selectedOption === option;

                                return (
                                <motion.div 
                                    key={option}
                                    whileHover={{ scale: isAnswered ? 1 : 1.03 }}
                                    whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                                >
                                    <button
                                        onClick={() => handleSelectOption(option)}
                                        disabled={isAnswered}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 text-lg font-semibold",
                                            "bg-card shadow-md disabled:cursor-not-allowed",
                                            isAnswered ? "opacity-50" : "hover:border-primary/50 hover:shadow-primary/20",
                                            isSelected && 'border-primary shadow-lg shadow-primary/30 opacity-100'
                                        )}
                                    >
                                        {option}
                                    </button>
                                </motion.div>
                            )})}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="shrink-0 mt-auto pt-4 pb-12 text-center space-y-2">
                 {isHintLoading ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="animate-spin" /> Fetching hint...
                    </div>
                 ) : hint ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-accent/20 rounded-lg text-sm text-center"
                    >
                       <span className="font-bold">Hint:</span> {hint}
                    </motion.div>
                ) : (
                    <Button variant="outline" size="lg" onClick={onHintRequest} disabled={isAnswered}>
                        <Lightbulb className="text-primary mr-2" />
                        <span>Get a Hint</span>
                    </Button>
                )}
            </footer>
            
            <div className="fixed bottom-4 right-4 z-50">
                <Button 
                    variant="ghost" 
                    className="rounded-full h-12 w-12 bg-card/50 hover:bg-card/90 shadow-md" 
                    size="icon" 
                    onClick={() => setIsMuted(prev => !prev)}
                >
                    {isMuted ? <VolumeX className="text-primary"/> : <Volume2 className="text-primary"/>}
                </Button>
            </div>

            <AlertDialog open={showNoBallAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Fair Play Warning!</AlertDialogTitle>
                        <AlertDialogDescription>
                           You switched tabs or minimized the window, which is against the rules. This will be counted as a "No Ball".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleNoBallConfirm}>I Understand</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
