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
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { reportQuestion, ReportQuestionInputSchema } from '@/ai/flows/report-question-flow';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ReportQuestionDialogProps {
  questionId: string;
  questionText: string;
}

const reportReasons = [
  "Incorrect Answer",
  "Typo in Question/Options",
  "Question is Ambiguous",
  "Inappropriate Content",
  "Technical Issue",
  "Other",
];

type ReportFormValues = z.infer<typeof ReportQuestionInputSchema>;

export default function ReportQuestionDialog({ questionId, questionText }: ReportQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportQuestionInputSchema),
    defaultValues: {
      questionId,
      questionText,
      reason: "",
      comment: "",
      userId: user?.uid || "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be signed in to report a question.', variant: 'destructive' });
      return;
    }
    
    try {
      const result = await reportQuestion({ ...data, userId: user.uid });
      if (result.success) {
        toast({ title: 'Report Submitted', description: result.message });
        setOpen(false);
        form.reset();
      } else {
        toast({ title: 'Submission Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="mr-2 h-4 w-4" /> Report Question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve the quiz by reporting any issues with this question.
            <p className="text-xs italic mt-2 bg-muted p-2 rounded-md">"{questionText}"</p>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="report-question-form">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason for your report" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportReasons.map(reason => (
                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Comment</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder="Provide any additional details..."
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="report-question-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
