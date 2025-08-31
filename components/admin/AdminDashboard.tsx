
'use client';

import React from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <>
        <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Welcome to the IndCric Admin Panel.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Admin features will be built here.</p>
        </CardContent>
    </>
  );
}
