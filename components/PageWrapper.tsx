
'use client';
import { ReactNode } from "react";
import { motion } from 'framer-motion';
import BackButton from "./BackButton";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  title?: string;
  children: ReactNode;
  showBackButton?: boolean;
  breadcrumb?: string;
  actions?: ReactNode;
  hideBorder?: boolean;
}

export default function PageWrapper({ title, children, showBackButton, breadcrumb, actions, hideBorder }: PageWrapperProps) {
  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-6 sm:px-6 lg:px-8">
        {(title || showBackButton || actions) && (
            <header className={cn(
                "flex items-center justify-between gap-4 -mx-4 px-4 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8 sticky top-0 bg-background/80 backdrop-blur-lg py-3 z-40 -mt-6 mb-0",
                !hideBorder && "border-b"
            )}>
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
