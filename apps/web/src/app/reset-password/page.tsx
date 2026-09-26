'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCw,
  Check,
  X,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ResetPasswordSchema } from '@stocksense/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Resend Cooldown Timer (60s)
  const [cooldown, setCooldown] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Password Policy Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setIsResending(true);
    setError(null);

    try {
      await apiClient.post('auth/forgot-password', { email: email.trim() }, { skipAuth: true });
      setCooldown(60);
      setSuccess('A new verification code has been dispatched to your email.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to resend code. Please wait and try again.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const validation = ResetPasswordSchema.safeParse({
      email,
      otp: otp.trim(),
      newPassword,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please check your input.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{ message: string }>(
        'auth/reset-password',
        validation.data,
        {
          skipAuth: true,
        },
      );

      setSuccess(res.message || 'Password successfully updated! Redirecting to sign in…');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please check your verification code.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F9F9FB] dark:bg-background">
      <div className="w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Boxes className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">StockSense</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the 6-digit OTP sent to your email to verify and update your credentials.
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

          {success && (
            <div className="mb-5 flex items-start gap-3 p-3 text-xs rounded-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{success}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  All previous sessions have been securely terminated.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
                Account Email
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="otp" className="text-xs font-semibold text-foreground">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending || !email.trim()}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  <RotateCw className={`size-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</span>
                </button>
              </div>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-11 px-3 text-center text-lg tracking-[6px] font-mono font-bold rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                New Master Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />

              {newPassword.length > 0 && (
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
                    <span>1 uppercase</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                  >
                    {hasLowercase ? <Check className="size-3" /> : <X className="size-3" />}
                    <span>1 lowercase</span>
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !!success || !isPasswordValid || otp.length !== 6}
              className="w-full h-9 mt-2 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Updating credentials…</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to sign in</span>
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
