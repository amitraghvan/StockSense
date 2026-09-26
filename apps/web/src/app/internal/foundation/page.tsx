'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { HealthResponse } from '@stocksense/types';
import { PageHeader, PageBody } from '../../../components/erp/common';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@stocksense/ui';
import {
  Server,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';

export default function EngineeringFoundationPage() {
  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<HealthResponse>({
    queryKey: ['system-health'],
    queryFn: () => apiClient.get<HealthResponse>('health'),
    refetchInterval: 10000,
  });

  return (
    <>
      <PageHeader
        title="Developer Diagnostics"
        breadcrumb="Internal Engineering"
        actions={
          <Badge variant="outline" className="px-2 py-0.5 font-mono text-[10px]">
            Fastify / Prisma / Redis
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Re-check</span>
          </Button>

          <a href="http://localhost:4000/docs" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 text-xs bg-primary text-primary-foreground">
              <span>OpenAPI / Swagger</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Connectivity Alert if API down */}
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>API Service Disconnected</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'Could not connect to the StockSense API at http://localhost:4000/api/v1.'}{' '}
              Ensure the backend service is started via <code>pnpm dev:api</code>.
            </AlertDescription>
          </Alert>
        )}

        {/* Infrastructure KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* API Core Card */}
          <Card className="border-border/60 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                API Runtime (Fastify)
              </CardTitle>
              <Server className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">
                  {isLoading
                    ? 'Checking...'
                    : health?.status === 'ok'
                      ? 'Healthy'
                      : health?.status || 'Offline'}
                </div>
                <Badge variant={health?.status === 'ok' ? 'success' : 'destructive'}>
                  {health?.service || 'api'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Uptime: {health?.uptime !== undefined ? `${health.uptime}s` : 'N/A'}</span>
                <span className="text-muted-foreground/40">•</span>
                <span>v{health?.version || '0.1.0'}</span>
              </p>
            </CardContent>
          </Card>

          {/* PostgreSQL Database Card */}
          <Card className="border-border/60 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PostgreSQL Database
              </CardTitle>
              <Database className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">
                  {isLoading
                    ? 'Pinging...'
                    : health?.checks?.database?.status === 'up'
                      ? 'Connected'
                      : 'Unavailable'}
                </div>
                <Badge
                  variant={health?.checks?.database?.status === 'up' ? 'success' : 'destructive'}
                >
                  {health?.checks?.database?.status === 'up' ? 'Prisma Active' : 'Disconnected'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                <span>Latency: {health?.checks?.database?.latencyMs ?? 0}ms</span>
                <span className="text-muted-foreground/40">•</span>
                <span>Connection Pool Ready</span>
              </p>
            </CardContent>
          </Card>

          {/* Redis Cache Card */}
          <Card className="border-border/60 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Redis Infrastructure
              </CardTitle>
              <Cpu className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">
                  {isLoading
                    ? 'Pinging...'
                    : health?.checks?.redis?.status === 'up'
                      ? 'Connected'
                      : 'Unavailable'}
                </div>
                <Badge variant={health?.checks?.redis?.status === 'up' ? 'success' : 'destructive'}>
                  {health?.checks?.redis?.status === 'up' ? 'ioredis Active' : 'Disconnected'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                <span>Latency: {health?.checks?.redis?.latencyMs ?? 0}ms</span>
                <span className="text-muted-foreground/40">•</span>
                <span>In-Memory Store Ready</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Architecture & Phase Boundary Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Architecture Blueprint Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Architecture: Modular Monolith</CardTitle>
              </div>
              <CardDescription>
                Production-grade software layers configured with strict architectural boundaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2 rounded-lg border bg-muted/20 p-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-primary font-semibold">Web Client (Next.js 15)</span>
                  <span className="text-muted-foreground">App Router & Tailwind</span>
                </div>
                <div className="flex items-center justify-between border-b py-2 pl-3 border-l-2 border-primary/50">
                  <span className="text-foreground font-semibold">API Gateway (/api/v1)</span>
                  <span className="text-muted-foreground">NestJS + Fastify Engine</span>
                </div>
                <div className="flex items-center justify-between border-b py-2 pl-6 border-l-2 border-primary/30">
                  <span className="text-foreground font-semibold">Observability & Security</span>
                  <span className="text-muted-foreground">Pino Structured Logs & Helmet</span>
                </div>
                <div className="flex items-center justify-between pt-2 pl-9 border-l-2 border-primary/20">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Storage & In-Memory
                  </span>
                  <span className="text-muted-foreground">PostgreSQL (Prisma) & Redis</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Designed as an isolated modular monolith. All infrastructure code lives in dedicated
                modules, controllers handle HTTP routing exclusively, and services encapsulate
                domain logic.
              </p>
            </CardContent>
          </Card>

          {/* Phase Boundary Verification Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <CardTitle>Foundation Diagnostics Status</CardTitle>
              </div>
              <CardDescription>
                Technical foundation status verified for developers and DevOps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Monorepo Workspace with pnpm 10 & TypeScript strict mode</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Standardized error envelopes and correlation Request IDs</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>PostgreSQL & Redis connection lifecycle with graceful shutdown</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    Liveness (<code>/health/live</code>) & Readiness (<code>/health/ready</code>)
                    probes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
