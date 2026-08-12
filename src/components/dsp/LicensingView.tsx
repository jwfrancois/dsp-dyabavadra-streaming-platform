'use client';

import React from 'react';
import { licensingItems } from '@/lib/data';
import type { LicensingItem } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Shield,
  Ban,
  Info,
  Eye,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStatusBadge(status: LicensingItem['status']) {
  switch (status) {
    case 'clear':
      return (
        <Badge className="text-[10px] bg-emerald-600/20 text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" /> Clear
        </Badge>
      );
    case 'needs-agreement':
      return (
        <Badge className="text-[10px] bg-amber-600/20 text-amber-400 border-amber-500/30 gap-1">
          <FileText className="w-3 h-3" /> Needs Agreement
        </Badge>
      );
    case 'needs-license':
      return (
        <Badge className="text-[10px] bg-red-600/20 text-red-400 border-red-500/30 gap-1">
          <Ban className="w-3 h-3" /> Needs License
        </Badge>
      );
    case 'proprietary':
      return (
        <Badge className="text-[10px] bg-red-600/20 text-red-400 border-red-500/30 gap-1">
          <Shield className="w-3 h-3" /> Proprietary
        </Badge>
      );
    case 'attribution-required':
      return (
        <Badge className="text-[10px] bg-blue-600/20 text-blue-400 border-blue-500/30 gap-1">
          <Info className="w-3 h-3" /> Attribution Required
        </Badge>
      );
  }
}

function getUrgencyBadge(urgency: LicensingItem['urgency']) {
  switch (urgency) {
    case 'low':
      return (
        <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-600/40">
          Low
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40">
          Medium
        </Badge>
      );
    case 'high':
      return (
        <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/40">
          High
        </Badge>
      );
    case 'critical':
      return (
        <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/40 animate-pulse">
          Critical
        </Badge>
      );
  }
}

function getTypeBadge(type: LicensingItem['type']) {
  const label = type
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return (
    <Badge variant="secondary" className="text-[10px] font-mono">
      {label}
    </Badge>
  );
}

// ─── Overview Summary Card ────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">{count}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Critical Item Card ───────────────────────────────────────────────────────

function CriticalItemCard({ item }: { item: LicensingItem }) {
  return (
    <Card className="bg-card border-red-500/30 border-l-4 border-l-red-500">
      <CardContent className="p-5 space-y-3">
        {/* Top row: name + badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold">{item.name}</span>
            {getTypeBadge(item.type)}
          </div>
          <Badge className="text-[10px] bg-red-600 text-white gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3" /> Action Required
          </Badge>
        </div>

        {/* Provider */}
        <p className="text-xs text-muted-foreground">
          Provider: <span className="text-foreground font-medium">{item.provider}</span>
        </p>

        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(item.status)}
          {getUrgencyBadge(item.urgency)}
        </div>

        {/* Details */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {item.details}
        </p>

        {/* Contact info */}
        {item.contact && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a
                href={`https://${item.contact}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {item.contact}
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </Button>
          </div>
        )}

        {/* Not resolved indicator */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-medium">Not Resolved</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dependency Item Card ─────────────────────────────────────────────────────

function DependencyCard({ item }: { item: LicensingItem }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-2.5">
        {/* Top row: name + type + resolved */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{item.name}</span>
            {getTypeBadge(item.type)}
          </div>
          {item.resolved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-600/40 shrink-0">
              Unresolved
            </Badge>
          )}
        </div>

        {/* Provider */}
        <p className="text-xs text-muted-foreground">{item.provider}</p>

        {/* Status + Urgency badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(item.status)}
          {getUrgencyBadge(item.urgency)}
        </div>

        {/* Details */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {item.details}
        </p>

        {/* Contact link */}
        {item.contact && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] gap-1.5 text-muted-foreground hover:text-foreground h-7 px-2"
              asChild
            >
              <a
                href={`https://${item.contact}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
                {item.contact}
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LicensingView() {
  const criticalItems = licensingItems.filter(i => i.urgency === 'critical');
  const resolvedCount = licensingItems.filter(i => i.resolved).length;
  const totalCount = licensingItems.length;
  const unresolvedCount = totalCount - resolvedCount;
  const progressPercent = Math.round((resolvedCount / totalCount) * 100);

  const clearCount = licensingItems.filter(i => i.status === 'clear').length;
  const needsAgreementCount = licensingItems.filter(i => i.status === 'needs-agreement').length;
  const needsLicenseCount = licensingItems.filter(i => i.status === 'needs-license').length;
  const attributionCount = licensingItems.filter(i => i.status === 'attribution-required').length;

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* ── Header ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Licensing &amp; Third-Party Dependencies
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                progressPercent === 100
                  ? 'text-xs bg-emerald-600/20 text-emerald-400 border-emerald-500/30 gap-1.5'
                  : 'text-xs bg-amber-600/20 text-amber-400 border-amber-500/30 gap-1.5'
              }
            >
              {progressPercent === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {resolvedCount} of {totalCount} resolved
            </Badge>
          </div>
        </div>

        <Separator />

        {/* ── Overview Dashboard ── */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              icon={CheckCircle2}
              label="Clear"
              count={clearCount}
              color="bg-emerald-600/15 text-emerald-400"
            />
            <SummaryCard
              icon={FileText}
              label="Needs Agreement"
              count={needsAgreementCount}
              color="bg-amber-600/15 text-amber-400"
            />
            <SummaryCard
              icon={Ban}
              label="Needs License"
              count={needsLicenseCount}
              color="bg-red-600/15 text-red-400"
            />
            <SummaryCard
              icon={Info}
              label="Attribution Only"
              count={attributionCount}
              color="bg-blue-600/15 text-blue-400"
            />
          </div>
        </div>

        {/* ── Critical Items ── */}
        {criticalItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Critical Items
            </h2>
            <div className="space-y-4">
              {criticalItems.map(item => (
                <CriticalItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── All Dependencies ── */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> All Dependencies
          </h2>
          <div className="space-y-3">
            {licensingItems.map(item => (
              <DependencyCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* ── Resolution Progress ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Resolution Progress</h2>
              </div>
              <span className="text-sm font-mono font-bold text-foreground">
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={
                  progressPercent === 100
                    ? 'bg-emerald-500 h-full rounded-full transition-all duration-500'
                    : 'bg-primary h-full rounded-full transition-all duration-500'
                }
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {resolvedCount === totalCount
                ? 'All dependencies have been resolved.'
                : `${unresolvedCount} item${unresolvedCount !== 1 ? 's' : ''} remaining to resolve.`}
            </p>
          </CardContent>
        </Card>

        {/* ── Legal Disclaimer ── */}
        <Card className="bg-surface/50 border-border">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Legal Disclaimer
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This licensing overview is an internal tracking and awareness tool for the
              Dyabavadra Streaming Platform (DSP) development team. It does not constitute
              legal advice and should not be relied upon for compliance decisions. Always
              consult with a qualified legal professional before making licensing or
              partnership decisions. Information shown here may become outdated; verify all
              details directly with the respective rights holders.
            </p>
          </CardContent>
        </Card>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
}
