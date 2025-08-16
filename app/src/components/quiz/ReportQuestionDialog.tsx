
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthProvider';
import { reportQuestion, ReportQuestionInput, ReportQuestionInputSchema } from '@/ai/flows/report-question-flow';
import { useToast } from '@/hooks/use-toast';

interface ReportQuestionDialogProps {
  questionId: string;
  questionText: string;
}

const ReportFormSchema = ReportQuestionInputSchema.pick({ reason: true, comment: true });
type ReportFormValues = Pick<ReportQuestionInput, 'reason' | 'comment'>;

export default function ReportQuestionDialog({ questionId, questionText }: ReportQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(ReportFormSchema),
  });

  const onSubmit: SubmitHandler<ReportFormValues> = async (data) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to report a question.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const input: ReportQuestionInput = {
        ...data,
        questionId,
        questionText,
        userId: user.uid,
      };
      
      const result = await reportQuestion(input);

      if (result.success) {
        toast({ title: 'Report Submitted', description: result.message });
        setOpen(false);
        reset();
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error("Failed to submit report:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: 'Submission Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground flex items-center gap-1">
          <Flag className="h-3 w-3" /> Report this question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues with this question: "{questionText}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Textarea
              id="reason"
              placeholder="e.g., The correct answer is wrong, there's a typo, the question is unclear..."
              {...register('reason')}
              disabled={isSubmitting}
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Provide any other details here."
              {...register('comment')}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
                </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
