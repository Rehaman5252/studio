
'use client';
import { ReactNode } from "react";
import { motion } from 'framer-motion';
import BackButton from "./BackButton";

interface PageWrapperProps {
  title?: string;
  children: ReactNode;
  showBackButton?: boolean;
  breadcrumb?: string;
  actions?: ReactNode;
}

export default function PageWrapper({ title, children, showBackButton, breadcrumb, actions }: PageWrapperProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 max-w-7xl mx-auto w-full">
            <header className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                {showBackButton && <BackButton />}
                <div>
                    {title && <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>}
                    {breadcrumb && <p className="text-sm text-muted-foreground">{breadcrumb}</p>}
                </div>
                </div>
                {actions && <div className="flex-shrink-0">{actions}</div>}
            </header>
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