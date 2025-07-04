
'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginScreen() {
  useEffect(() => {
    redirect('/home');
  }, []);
  
  return null;
}
