
"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

/**
 * Helper to dynamically import a component with fallback
 * @param importFunc Function returning a dynamic import promise
 * @param fallback Optional fallback ReactNode
 */
export function loadDynamic<T extends React.ReactNode>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  return dynamic(importFunc, {
    ssr: false,
    loading: () => fallback || <div>Loading...</div>,
  });
}

