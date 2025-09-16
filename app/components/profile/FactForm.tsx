
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { submitContribution } from '@/ai/flows/submit-contribution';
import { refineText } from '@/ai/flows/refine-text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FactFormSchema = z.object({
    content: z.string().min(10, "Fact must be at least 10 characters.").max(280, "Fact cannot exceed 280 characters."),
});

type FactFormValues = z.infer<typeof FactFormSchema>;

export default function FactForm({ onSubmitted }: { onSubmitted: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isRefining, setIsRefining] = useState(false);

    const form = useForm<FactFormValues>({
        resolver: zodResolver(FactFormSchema),
        defaultValues: { content: '' },
    });

    const { isSubmitting } = form.formState;

    const handleRefine = async () => {
        const content = form.getValues('content');
        if (!content) {
            toast({ title: "Nothing to refine", description: "Please write a fact first.", variant: "destructive"});
            return;
        }
        setIsRefining(true);
        try {
            const refinedContent = await refineText({ text: content });
            form.setValue('content', refinedContent, { shouldValidate: true });
        } catch (error) {
            toast({ title: "Error", description: "Could not refine the text.", variant: "destructive"});
        } finally {
            setIsRefining(false);
        }
    };

    const onSubmit = async (values: FactFormValues) => {
        if (!user) return;
        try {
            const result = await submitContribution({
                userId: user.uid,
                type: 'fact',
                ...values,
            });
            if (result.success) {
                toast({ title: "Fact Submitted!", description: result.message });
                form.reset();
                onSubmitted();
            } else {
                toast({ title: "Submission Failed", description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: 'destructive' });
        }
    };

    return (
        <Card className="border-0">
            <CardHeader>
                <CardTitle>Submit a Cricket Fact</CardTitle>
                <CardDescription>Share an interesting and verifiable cricket fact.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Fact</FormLabel>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleRefine} disabled={isRefining}>
                                            {isRefining ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                            <span className="ml-2">Refine with AI</span>
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Sachin Tendulkar is the only player to have scored 100 international centuries." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={!user || isSubmitting || isRefining} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Fact
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
