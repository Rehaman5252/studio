
'use client';
import LoginForm from '@/components/auth/LoginForm';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginPageContent() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    return <LoginForm from={from} />;
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <LoginPageContent/>
    </Suspense>
  )
}
