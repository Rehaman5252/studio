
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { reportQuestion } from '@/ai/flows/report-question-flow';
import type { QuizQuestion } from '@/ai/schemas';
import { Loader2 } from 'lucide-react';

interface ReportQuestionDialogProps {
  question: QuizQuestion;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportReasons = [
  "The correct answer is wrong.",
  "There is a typo in the question or options.",
  "The question is ambiguous or unclear.",
  "The question is offensive or inappropriate.",
  "Other reason (please specify).",
];

export function ReportQuestionDialog({ question, children, open, onOpenChange }: ReportQuestionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Not Logged In', description: 'You must be logged in to report a question.', variant: 'destructive' });
      return;
    }
    if (!reason) {
      toast({ title: 'No Reason Selected', description: 'Please select a reason for the report.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await reportQuestion({
        questionId: question.id,
        questionText: question.question,
        reason,
        comment,
        userId: user.uid,
      });

      if (result.success) {
        toast({ title: 'Report Submitted', description: result.message });
        onOpenChange(false); // Close dialog on success
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message || 'Could not submit your report.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue with a Question</DialogTitle>
          <DialogDescription>
            Help us improve by telling us what's wrong with this question. Your feedback is valuable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-md border bg-muted p-3 text-sm">
            <p className="font-semibold">Question:</p>
            <p>{question.question}</p>
          </div>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {reportReasons.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r}>{r}</Label>
              </div>
            ))}
          </RadioGroup>
          {reason === 'Other reason (please specify).' && (
            <Textarea
              placeholder="Please describe the issue..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
            />
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading || !reason}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
