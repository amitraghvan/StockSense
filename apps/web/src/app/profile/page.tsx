'use client';

import * as React from 'react';
import {
  Building2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../../providers/auth-provider';
import { apiClient } from '../../lib/api-client';

export default function ProfilePage() {
  const {
    user,
    activeTenant,
    activeRole,
    availableTenants,
    permissions,
    switchTenant,
    refetchUser,
  } = useAuth();

  const [name, setName] = React.useState(user?.name || '');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient.put('profile', { name: name.trim() });
      await refetchUser();
      setSuccessMessage('Display name successfully updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMessage(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      {/* Page Title & Breadcrumbs */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Settings</span>
          <span>/</span>
          <span className="text-foreground font-medium">User Profile & Access</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Account Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Card & Display Name */}
        <div className="lg:col-span-1 space-y-6">
          <div className="erp-panel p-6 bg-card border border-border rounded-lg shadow-xs">
            <div className="flex items-center gap-4 mb-5">
              <div className="size-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{user?.name}</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                  {user?.status || 'ACTIVE'}
                </div>
              </div>
            </div>

            <hr className="border-border my-4" />

            {/* Profile update form */}
            <form onSubmit={handleUpdateName} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Edit Display Name
              </h3>

              {successMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Primary Email (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating || name.trim() === user?.name}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Name</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Account Meta */}
          <div className="erp-panel p-5 bg-card border border-border rounded-lg shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Account Attributes
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-[11px]">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security State:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Argon2id Hashed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Multi-Tenant Workspaces & Role Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspaces card */}
          <div className="erp-panel p-6 bg-card border border-border rounded-lg shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="size-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Workspace Memberships</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Your identity has authenticated access to the following organization workspaces.
              Switching workspaces changes your current tenant context and permission boundary.
            </p>

            <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {availableTenants.map((membership) => {
                const isActive = membership.tenant.id === activeTenant?.id;
                return (
                  <div
                    key={membership.tenant.id}
                    className={`p-4 flex items-center justify-between transition-colors ${
                      isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {membership.tenant.name}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                            ACTIVE WORKSPACE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>
                          Slug:{' '}
                          <code className="font-mono text-[11px]">{membership.tenant.slug}</code>
                        </span>
                        <span>&bull;</span>
                        <span>
                          Role: <strong className="text-foreground">{membership.role.name}</strong>
                        </span>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => switchTenant(membership.tenant.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-surface-hover hover:border-primary/50 text-foreground transition-all cursor-pointer"
                      >
                        <span>Switch Workspace</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Role & Permissions */}
          <div className="erp-panel p-6 bg-card border border-border rounded-lg shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Current Role & Permissions</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground border border-border">
                {activeRole?.name || 'VIEWER'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {activeRole?.description ||
                'Assigned permissions for the currently selected workspace.'}
            </p>

            <div className="border border-border rounded-md p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="size-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Authorized Capabilities ({permissions.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-card border border-border text-xs font-mono"
                  >
                    <CheckCircle2 className="size-3 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="truncate">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
