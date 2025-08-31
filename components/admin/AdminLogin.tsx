
'use client';

import React from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLogin() {
  return (
    <>
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
            <CardDescription>IndCric Management Portal</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="admin@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                    Sign In
                </Button>
            </div>
        </CardContent>
    </>
  );
}
