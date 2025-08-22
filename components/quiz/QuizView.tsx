
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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


const QUESTION_TIME_LIMIT = 15; // seconds

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
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    const [isMuted, setIsMuted] = useState(!soundEnabled);
    const [showNoBallAlert, setShowNoBallAlert] = useState(false);
    
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({
        tick: null
    });

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
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onAnswer(selectedOption || ""); 
                    return 0;
                }
                if(prev <= 6 && !isMuted) {
                    audioRefs.current.tick?.play().catch(e => console.log("Audio play failed", e));
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [question, onAnswer, isMuted, selectedOption]);


    const handleSubmit = () => {
        if (selectedOption !== null) {
            onAnswer(selectedOption);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground p-4 relative">
            {typeof window !== 'undefined' && (
                <>
                    <audio ref={el => audioRefs.current.tick = el} src="/sounds/tick.mp3" preload="auto" />
                </>
            )}

            <header className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-bold text-primary">{brand} - {format}</p>
                    <h1 className="text-lg font-semibold">Question {questionNumber}/{totalQuestions}</h1>
                </div>
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
            </header>

            <main className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl md:text-2xl">{question.question}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} className="space-y-3">
                                    {question.options.map((option, index) => (
                                        <motion.div
                                            key={option}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <Label 
                                                htmlFor={`option-${index}`} 
                                                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOption === option ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                                            >
                                                <RadioGroupItem value={option} id={`option-${index}`} className="mr-4" />
                                                <span className="flex-1 text-base">{option}</span>
                                            </Label>
                                        </motion.div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                 {hint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-accent/20 border border-accent rounded-lg text-sm text-center"
                    >
                       <span className="font-bold">Hint:</span> {hint}
                    </motion.div>
                )}

            </main>

            <footer className="mt-auto grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={onHintRequest} disabled={isHintLoading || !!hint}>
                    {isHintLoading ? <Loader2 className="animate-spin text-primary" /> : <Lightbulb className="text-primary" />}
                    Get a Hint
                </Button>
                <Button onClick={handleSubmit} disabled={!selectedOption}>
                    Submit Answer
                </Button>
                 <Button variant="ghost" className="absolute bottom-4 right-4" size="icon" onClick={() => setIsMuted(prev => !prev)}>
                    {isMuted ? <VolumeX className="text-primary"/> : <Volume2 className="text-primary"/>}
                </Button>
            </footer>

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
