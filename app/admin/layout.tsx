import type { ReactNode } from 'react';
import { memo } from 'react';

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background/95">
        <main className="w-full max-w-md">
            {children}
        </main>
    </div>
  );
}

export default memo(AdminLayout);
