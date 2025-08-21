'use client';
import { ReactNode } from "react";
import { motion } from 'framer-motion';

interface PageWrapperProps {
  title?: string;
  children: ReactNode;
}

export default function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        {title && (
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                <h1 className="text-2xl font-bold text-center text-foreground">{title}</h1>
            </header>
        )}
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 max-w-7xl mx-auto w-full">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {children}
            </motion.div>
        </main>
    </div>
  );
}
