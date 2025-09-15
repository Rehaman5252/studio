
import type { ReactNode } from 'react';
import { memo } from 'react';
import AdminNav from '@/app/components/admin/AdminNav';
import { Card } from '@/components/ui/card';

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 w-full bg-gradient-to-br from-background to-secondary/30">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-64">
                <AdminNav />
            </aside>
            <main className="flex-1">
                <Card className="shadow-lg h-full">
                    {children}
                </Card>
            </main>
        </div>
    </div>
  );
}

export default memo(AdminLayout);
