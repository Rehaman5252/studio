
'use client';

import { useEffect, useState } from 'react';
import { isFirebaseOnline, isFirebaseConfigured } from '@/lib/firebaseClient';

export function useFirebaseReady() {
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isFirebaseConfigured) {
        setReady(false);
        return;
      };
      const online = await isFirebaseOnline();
      setOffline(!online);
      setReady(online);
    };
    check();
  }, []);

  return { firebaseReady: ready, isOffline: offline };
}
