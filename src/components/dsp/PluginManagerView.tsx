'use client';

import React, { useState } from 'react';
import type { DSPPlugin } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Puzzle, Settings, Download, Trash2, RefreshCw, CheckCircle2,
  AlertTriangle, ExternalLink, Shield, Zap, Radio, Music, Database, Cpu,
} from 'lucide-react';

type CategoryFilter = 'all' | DSPPlugin['type'];

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dsp-module', label: 'DSP Modules' },
  { key: 'streaming-service', label: 'Streaming Services' },
  { key: 'output-protocol', label: 'Output Protocols' },
  { key: 'metadata-provider', label: 'Metadata Providers' },
  { key: 'codec', label: 'Codecs' },
];

const TYPE_BADGE_STYLES: Record<DSPPlugin['type'], string> = {
  'dsp-module': 'bg-purple-600/80 text-purple-100',
  'streaming-service': 'bg-blue-600/80 text-blue-100',
  'output-protocol': 'bg-cyan-600/80 text-cyan-100',
  'metadata-provider': 'bg-green-600/80 text-green-100',
  codec: 'bg-orange-600/80 text-orange-100',
};

const TYPE_ICONS: Record<DSPPlugin['type'], React.ElementType> = {
  'dsp-module': Cpu,
  'streaming-service': Radio,
  'output-protocol': Zap,
  'metadata-provider': Database,
  codec: Music,
};

function StatusIndicator({ status }: { status: DSPPlugin['status'] }) {
  switch (status) {
    case 'active':
      return (
        <span className="flex items-center gap-1.5 text-xs text-signal-green">
          <CheckCircle2 className="w-3.5 h-3.5" /> Active
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" /> Error
        </span>
      );
    case 'needs-update':
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-400">
          <RefreshCw className="w-3.5 h-3.5" /> Needs Update
        </span>
      );
    case 'needs-license':
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" /> Needs License
        </span>
      );
  }
}

function LicenseBadge({ type }: { type: DSPPlugin['licenseType'] }) {
  const styles: Record<DSPPlugin['licenseType'], string> = {
    'open-source': 'bg-green-700/60 text-green-200',
    commercial: 'bg-blue-700/60 text-blue-200',
    'needs-agreement': 'bg-amber-700/60 text-amber-200',
    proprietary: 'bg-red-700/60 text-red-200',
  };
  const labels: Record<DSPPlugin['licenseType'], string> = {
    'open-source': 'Open Source',
    commercial: 'Commercial',
    'needs-agreement': 'Needs Agreement',
    proprietary: 'Proprietary',
  };
  return (
    <Badge variant="outline" className={`text-[10px] border-0 ${styles[type]}`}>
      {labels[type]}
    </Badge>
  );
}

function PluginCard({ plugin }: { plugin: DSPPlugin }) {
  const [enabled, setEnabled] = useState(plugin.enabled);
  const TypeIcon = TYPE_ICONS[plugin.type];

  return (
    <Card
      className={`bg-card border-border mb-3 transition-all ${
        plugin.installed && enabled ? 'border-l-2 border-l-signal-green' : ''
      }`}
    >
      <CardContent className="p-4">
        {/* Top row: name + version + type + license */}
        <div className="flex flex-wrap items-start gap-2 mb-2">
          <TypeIcon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-sm">{plugin.name}</span>
          <Badge variant="outline" className="text-[10px] font-mono border-border">
            v{plugin.version}
          </Badge>
          <Badge className={`text-[10px] border-0 ${TYPE_BADGE_STYLES[plugin.type]}`}>
            {CATEGORIES.find(c => c.key === plugin.type)?.label ?? plugin.type}
          </Badge>
          <LicenseBadge type={plugin.licenseType} />
        </div>

        {/* Author */}
        <p className="text-xs text-muted-foreground mb-1">by {plugin.author}</p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {plugin.description}
        </p>

        {/* Status */}
        <div className="mb-3">
          <StatusIndicator status={plugin.status} />
        </div>

        {/* License detail warning */}
        {plugin.licenseDetail && (
          <div className="flex items-start gap-2 p-2 rounded bg-amber-950/30 border border-amber-800/30 mb-3">
            <Shield className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80 leading-relaxed">{plugin.licenseDetail}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {plugin.installed ? (
            <>
              <div className="flex items-center gap-2 mr-auto">
                <Switch
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  aria-label={`Enable ${plugin.name}`}
                />
                <span className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              {plugin.configUrl && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <a href={plugin.configUrl}>
                    <Settings className="w-3 h-3" /> Configure
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-red-400 hover:text-red-300 border-red-800/40 hover:bg-red-950/40">
                <Trash2 className="w-3 h-3" /> Uninstall
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <Download className="w-3 h-3" /> Install
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                <ExternalLink className="w-3 h-3" /> Learn More
              </Button>
            </>
          )}
          {plugin.lastUpdated && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              Updated {plugin.lastUpdated}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PluginManagerView() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const installedPlugins: DSPPlugin[] = [];
  const availablePlugins: DSPPlugin[] = [];

  const filterByCategory = (list: DSPPlugin[]) =>
    activeCategory === 'all' ? list : list.filter(p => p.type === activeCategory);

  const filteredInstalled = filterByCategory(installedPlugins);
  const filteredAvailable = filterByCategory(availablePlugins);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Puzzle className="w-6 h-6" /> Plugins &amp; Extensions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {installedPlugins.length} installed
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Browse Plugins
          </Button>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Installed Plugins ── */}
        {filteredInstalled.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-signal-green" /> Installed Plugins
              <Badge variant="secondary" className="text-[10px] ml-1">
                {filteredInstalled.length}
              </Badge>
            </h2>
            {filteredInstalled.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </section>
        )}

        {/* ── Available Plugins ── */}
        {filteredAvailable.length > 0 && (
          <>
            <Separator className="my-6 bg-border" />
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" /> Available Plugins
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {filteredAvailable.length}
                </Badge>
              </h2>
              {filteredAvailable.map(plugin => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </section>
          </>
        )}

        {/* ── Extension Points Info ── */}
        <Separator className="my-6 bg-border" />
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Extension Architecture
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              DSP Core supports modular extensions through a stable Plugin API.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Plugin API v2 — stable interface for third-party modules.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: Cpu, label: 'DSP Pipelines', desc: 'Custom DSP processing stages' },
                { icon: Radio, label: 'Streaming Adapters', desc: 'Music service integrations' },
                { icon: Zap, label: 'Output Protocols', desc: 'Audio output destinations' },
                { icon: Database, label: 'Metadata Sources', desc: 'Tag and info enrichment' },
                { icon: Music, label: 'Codec Decoders', desc: 'Audio format support' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-2.5 rounded bg-surface/50"
                >
                  <item.icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
