
'use client';
import { ReactNode } from "react";
import { motion } from 'framer-motion';
import BackButton from "./BackButton";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  title?: ReactNode;
  children: ReactNode;
  showBackButton?: boolean;
  breadcrumb?: string;
  actions?: ReactNode;
  hideBorder?: boolean;
}

export default function PageWrapper({ title, children, showBackButton, breadcrumb, actions, hideBorder = false }: PageWrapperProps) {
  return (
    <div className="flex flex-col pb-24 px-4 pt-2 sm:px-6 lg:px-8">
        {(title || showBackButton || actions) && (
            <header className={cn(
                "relative flex items-center justify-between gap-4 py-3 z-40 mb-0 sticky top-0 bg-background/80 backdrop-blur-lg -mx-4 px-4",
                !hideBorder && "border-b"
            )}>
                <div className="absolute left-4">
                  {showBackButton && <BackButton />}
                </div>
                <div className="flex-1 text-center">
                    {title && (typeof title === 'string' ? <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1> : title)}
                    {breadcrumb && <p className="text-sm text-muted-foreground">{breadcrumb}</p>}
                </div>
                <div className="absolute right-4">
                  {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            </header>
        )}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
        >
            {children}
        </motion.div>
    </div>
  );
}
