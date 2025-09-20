'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/app/lib/logger';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ClientOnlyState {
  hasError: boolean;
  error?: Error;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-4">
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Component</AlertTitle>
        <AlertDescription>
            There was a problem loading a part of the page. Please check your connection.
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
            </Button>
        </AlertDescription>
    </Alert>
  </div>
);

class ClientOnly extends Component<ClientOnlyProps, ClientOnlyState> {
  constructor(props: ClientOnlyProps) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): ClientOnlyState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ClientOnly Boundary Caught Error:", { error: error.message, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultFallback />;
    }

    return this.props.children;
  }
}

export default ClientOnly;
