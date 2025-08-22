
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { submitContribution } from '@/ai/flows/submit-contribution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const PostFormSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
    content: z.string().min(50, "Post must be at least 50 characters.").max(5000, "Post cannot exceed 5000 characters."),
});

type PostFormValues = z.infer<typeof PostFormSchema>;

export default function PostForm({ onSubmitted }: { onSubmitted: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const form = useForm<PostFormValues>({
        resolver: zodResolver(PostFormSchema),
        defaultValues: { title: '', content: '' },
    });

    const { isSubmitting } = form.formState;

    const onSubmit = async (values: PostFormValues) => {
        if (!user) return;
        try {
            const result = await submitContribution({
                userId: user.uid,
                type: 'post',
                ...values,
            });
            if (result.success) {
                toast({ title: "Post Submitted!", description: result.message });
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
        <Card className="border-dashed">
             <CardHeader>
                <CardTitle>Write a Post</CardTitle>
                <CardDescription>Share your analysis, opinion, or a short story about cricket.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., The evolution of T20 batting" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Write your post here..." {...field} rows={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Post
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
