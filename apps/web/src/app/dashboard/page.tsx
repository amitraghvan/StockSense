'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  EmptyState,
} from '@stocksense/ui';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Inventory Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time operational summary of inbound receipts, delivery orders, and internal stock
            movement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/operations/receipts">
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New Receipt</span>
            </Button>
          </Link>
          <Link href="/operations/deliveries">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New Delivery</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Cards Grid (from Wireframe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receipts Card */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
              Receipts
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">0</span>
              <Badge variant="outline" className="text-xs">
                To Process
              </Badge>
            </div>
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Late receipts</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
              <div className="flex justify-between">
                <span>Waiting operations</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
            </div>
            <Link href="/operations/receipts" className="block pt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-primary">
                View All Receipts →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Delivery Orders Card */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
              Delivery Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">0</span>
              <Badge variant="outline" className="text-xs">
                To Deliver
              </Badge>
            </div>
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Late deliveries</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
              <div className="flex justify-between">
                <span>Waiting availability</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
            </div>
            <Link href="/operations/deliveries" className="block pt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-primary">
                View All Deliveries →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Internal Transfers Card */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
              Internal Transfers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">0</span>
              <Badge variant="outline" className="text-xs">
                In Transit
              </Badge>
            </div>
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Location transfers</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled today</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
            </div>
            <Link href="/operations" className="block pt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-primary">
                View Transfers →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Inventory Adjustments Card */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
              Adjustments
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">0</span>
              <Badge variant="outline" className="text-xs">
                Audit Required
              </Badge>
            </div>
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Cycle counts</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
              <div className="flex justify-between">
                <span>Scrap / damaged</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
            </div>
            <Link href="/operations" className="block pt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-primary">
                View Adjustments →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Operations / Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Activity Feed / Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>
                  Scheduled receipts, shipments, and internal warehouse movements.
                </CardDescription>
              </div>
              <Link href="/move-history">
                <Button variant="outline" size="sm" className="text-xs">
                  Full History
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Clock className="h-8 w-8 text-muted-foreground" />}
                title="No Active Operations In Progress"
                description="When new stock receipts, deliveries, or internal transfers are created, they will be tracked here in real-time."
                action={
                  <div className="flex gap-2">
                    <Link href="/operations/receipts">
                      <Button size="sm" variant="outline">
                        Create Receipt
                      </Button>
                    </Link>
                    <Link href="/operations/deliveries">
                      <Button size="sm">Create Delivery</Button>
                    </Link>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Reference / Operational Notice */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Operational Readiness</CardTitle>
              <CardDescription>Warehouse infrastructure and channel status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Main Warehouse (WH/Stock)</span>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Receiving Bay (WH/Input)</span>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Shipping Dock (WH/Output)</span>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Today: {new Date().toLocaleDateString()}</span>
                </span>
                <span>UTC+00:00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
