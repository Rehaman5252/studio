'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/app/lib/logger';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  retry?: () => void; // optional retry handler
}

interface ClientOnlyState {
  hasError: boolean;
  error?: Error;
  resetKey: number;
}

const DefaultFallback = ({
  error,
  retry,
}: {
  error?: Error;
  retry?: () => void;
}) => (
  <div className="flex items-center justify-center p-4">
    <Alert variant="destructive" role="alert" className="max-w-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 mt-0.5" />
        <div>
          <AlertTitle>Component Failed to Load</AlertTitle>
          <AlertDescription className="mt-1 space-y-2">
            <p>
              A client-side error occurred while rendering this part of the
              page. This can happen due to network issues or unexpected browser behavior.
            </p>
            {process.env.NODE_ENV === 'development' && error && (
              <pre className="mt-2 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {error.message}
              </pre>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={retry || (() => window.location.reload())}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retry ? 'Try Again' : 'Refresh Page'}
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  </div>
);

class ClientOnly extends Component<ClientOnlyProps, ClientOnlyState> {
  constructor(props: ClientOnlyProps) {
    super(props);
    this.state = { hasError: false, error: undefined, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ClientOnlyState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ClientOnly Boundary Caught Error', { 
        error: error.message, 
        componentStack: errorInfo.componentStack 
    });
  }

  handleRetry = () => {
    if (this.props.retry) {
        this.props.retry();
    }
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <DefaultFallback error={this.state.error} retry={this.handleRetry} />
      );
    }

    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

export default ClientOnly;
