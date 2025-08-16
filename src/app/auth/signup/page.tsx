
'use client';

import SignUpForm from "@/components/auth/SignUpForm";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SignUpPageContent() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    return <SignUpForm from={from} />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageContent />
    </Suspense>
  )
}
