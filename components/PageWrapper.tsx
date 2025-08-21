
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
    <div className="flex flex-col space-y-6 pb-20 px-4 pt-6">
        {(title || showBackButton || actions) && (
            <header className="flex items-center justify-between gap-4 -mx-4 px-4 sticky top-0 bg-background/80 backdrop-blur-lg py-3 z-10 border-b -mt-6 mb-0">
                <div className="flex items-center gap-2">
                {showBackButton && <BackButton />}
                <div>
                    {title && <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>}
                    {breadcrumb && <p className="text-sm text-muted-foreground">{breadcrumb}</p>}
                </div>
                </div>
                {actions && <div className="flex-shrink-0">{actions}</div>}
            </header>
        )}
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {children}
        </motion.div>
    </div>
  );
}
