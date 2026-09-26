'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ForgotPasswordSchema } from '@stocksense/validation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validation = ForgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{ message: string }>(
        'auth/forgot-password',
        validation.data,
        {
          skipAuth: true,
        },
      );
      setSuccessMessage(
        res.message || 'If an account exists, a 6-digit verification code has been dispatched.',
      );

      // Auto-navigate to reset screen after 2.5 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(validation.data.email)}`);
      }, 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to dispatch verification code. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F9F9FB] dark:bg-background">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Boxes className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">StockSense</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your email to receive a secure 6-digit one-time code.
          </p>
        </div>

        {/* Card */}
        <div className="erp-panel p-6 bg-card border border-border rounded-lg shadow-sm">
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3 text-xs rounded-md bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-3 p-3 text-xs rounded-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Redirecting to verification entry…
                </p>
              </div>
            </div>
          )}

          <form
            action="#"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
                Registered Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !!successMessage}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Dispatching code…</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to sign in</span>
            </Link>

            <Link
              href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-primary font-semibold hover:underline"
            >
              Already have code?
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[11px] text-muted-foreground">
          StockSense Enterprise &bull; Modular Monolith Architecture &bull; Phase 02 Identity
        </div>
      </div>
    </div>
  );
}
