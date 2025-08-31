
import type { ReactNode } from 'react';
import { memo } from 'react';
import { Card } from '@/components/ui/card';

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <main className="w-full max-w-6xl">
            <Card className="bg-card shadow-lg">
                {children}
            </Card>
        </main>
    </div>
  );
}

export default memo(AdminLayout);
