'use client';

import * as React from 'react';
import { Button } from '@stocksense/ui';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Application Error Encountered
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected rendering error occurred in this route.'}
      </p>
      {error.digest && (
        <span className="mt-2 rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          Digest: {error.digest}
        </span>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button size="sm" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
