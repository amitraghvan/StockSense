'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, ArrowRight, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { SignupSchema } from '@stocksense/validation';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tenantName, setTenantName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Real-time password requirement checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    setError(null);

    const payload = {
      name,
      email,
      password,
      tenantName: tenantName.trim() ? tenantName.trim() : undefined,
    };

    const validation = SignupSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please check your input.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(validation.data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to create account. Please check your information.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F9F9FB] dark:bg-background">
      <div className="w-full max-w-[460px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Boxes className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">StockSense</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create your workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Initialize your organization, inventory accounts, and operational role.
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

          <form
            action="#"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="tenantName"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Workspace / Organization Name (Optional)
              </label>
              <input
                id="tenantName"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Acme Logistics Global"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Master Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters with symbols"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />

              {/* Password Policy Checklist */}
              {password.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-md bg-muted/40 border border-border/60 text-[11px] grid grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                  >
                    {hasMinLength ? <Check className="size-3" /> : <X className="size-3" />}
                    <span>8+ characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                  >
                    {hasUppercase ? <Check className="size-3" /> : <X className="size-3" />}
                    <span>1 uppercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                  >
                    {hasLowercase ? <Check className="size-3" /> : <X className="size-3" />}
                    <span>1 lowercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                  >
                    {hasNumber && hasSpecial ? (
                      <Check className="size-3" />
                    ) : (
                      <X className="size-3" />
                    )}
                    <span>1 number & symbol</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (password.length > 0 && !isPasswordValid)}
              className="w-full h-9 mt-2 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Provisioning workspace…</span>
                </>
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Already registered?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in to existing account
              </Link>
            </p>
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
