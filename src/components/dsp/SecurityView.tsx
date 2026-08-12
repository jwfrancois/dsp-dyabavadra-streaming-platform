'use client';

import React from 'react';
import { useSystemStore } from '@/store/system';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Wifi,
  WifiOff,
  Globe,
  Monitor,
  Smartphone,
  Server,
  Fingerprint,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Ban,
  UserCheck,
} from 'lucide-react';

const securityScore = 85;

const recommendations = [
  {
    icon: AlertTriangle,
    text: 'Enable VPN for remote access',
    severity: 'warning' as const,
  },
  {
    icon: Eye,
    text: 'Revoke inactive sessions',
    severity: 'info' as const,
  },
  {
    icon: RefreshCw,
    text: 'Update endpoint firmware',
    severity: 'warning' as const,
  },
  {
    icon: Fingerprint,
    text: 'Enable two-factor for streaming',
    severity: 'recommendation' as const,
  },
];

const pairedEndpoints = [
  {
    name: 'Living Room DAC',
    type: 'dac' as const,
    mac: 'AA:BB:CC:11:22:33',
    pairedDate: '2024-11-02',
    authMethod: 'Certificate' as const,
    trust: 'Trusted' as const,
  },
  {
    name: 'Bedroom Speaker',
    type: 'speaker' as const,
    mac: 'AA:BB:CC:44:55:66',
    pairedDate: '2024-12-15',
    authMethod: 'PIN' as const,
    trust: 'Trusted' as const,
  },
  {
    name: 'Office Headphones',
    type: 'headphones' as const,
    mac: 'AA:BB:CC:77:88:99',
    pairedDate: '2025-01-20',
    authMethod: 'Certificate' as const,
    trust: 'Pending' as const,
  },
];

const connectedApps = [
  {
    name: 'DSP Controller (macOS)',
    deviceType: 'desktop' as const,
    connectionType: 'LAN' as const,
    lastAuth: '2025-06-13 14:32',
    tokenStatus: 'Active' as const,
  },
  {
    name: 'DSP Remote (iPhone)',
    deviceType: 'mobile' as const,
    connectionType: 'Remote' as const,
    lastAuth: '2025-06-13 09:15',
    tokenStatus: 'Active' as const,
  },
  {
    name: 'DSP Web (Chrome)',
    deviceType: 'web' as const,
    connectionType: 'LAN' as const,
    lastAuth: '2025-05-28 18:44',
    tokenStatus: 'Expiring' as const,
  },
];

const streamingCredentials = [
  {
    service: 'TIDAL',
    authMethod: 'OAuth2',
    account: 'u***@tidal.com',
    storage: 'Encrypted (AES-256)',
    tokenRefresh: 'Valid, refreshes in 28 days',
  },
  {
    service: 'Qobuz',
    authMethod: 'OAuth2',
    account: 'u***@gmail.com',
    storage: 'Encrypted (AES-256)',
    tokenRefresh: 'Valid, refreshes in 14 days',
  },
];

function severityColor(severity: 'warning' | 'info' | 'recommendation') {
  switch (severity) {
    case 'warning':
      return 'text-amber-400';
    case 'info':
      return 'text-blue-400';
    case 'recommendation':
      return 'text-muted-foreground';
  }
}

function severityLabel(severity: 'warning' | 'info' | 'recommendation') {
  switch (severity) {
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    case 'recommendation':
      return 'Recommendation';
  }
}

export function SecurityView() {
  const { protocolEncryption, remoteAccessEnabled, toggleEncryption, toggleRemoteAccess } =
    useSystemStore();

  const [vpnActive, setVpnActive] = React.useState(false);

  const isSecured = protocolEncryption && !remoteAccessEnabled;

  const endpointTypeIcon = (type: string) => {
    switch (type) {
      case 'dac':
        return <Server className="w-4 h-4" />;
      case 'speaker':
        return <Monitor className="w-4 h-4" />;
      case 'headphones':
        return <HeadphonesIcon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const deviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'web':
        return <Globe className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6" /> Security &amp; Authentication
        </h1>

        {/* ── 1. Security Overview ─────────────────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              {isSecured ? (
                <ShieldCheck className="w-4 h-4 text-green-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              Security Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSecured ? 'bg-green-500/20' : 'bg-amber-400/20'
                  }`}
                >
                  {isSecured ? (
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overall Status</p>
                  <Badge
                    className={`text-[10px] ${
                      isSecured
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {isSecured ? 'Secured' : 'Partial'}
                  </Badge>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Security Score</p>
                  <p className="text-lg font-bold font-mono">
                    {securityScore}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </p>
                </div>
              </div>

              {/* Key recommendation */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Key Recommendation</p>
                  <p className="text-xs font-medium">Enable VPN for remote access</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Network Security ──────────────────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Network Security
            </h2>

            <div className="space-y-3">
              {/* LAN Encryption */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">LAN Encryption</p>
                    <p className="text-xs text-muted-foreground font-mono">AES-256-GCM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="text-[10px] bg-green-500 text-white">Active</Badge>
                  <Switch checked={protocolEncryption} onCheckedChange={toggleEncryption} />
                </div>
              </div>

              {/* Remote Access */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Remote Access</p>
                    {remoteAccessEnabled && (
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Core accessible from WAN
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {remoteAccessEnabled && (
                    <Badge className="text-[10px] bg-amber-400 text-black">Warning</Badge>
                  )}
                  <Switch checked={remoteAccessEnabled} onCheckedChange={toggleRemoteAccess} />
                </div>
              </div>

              {/* VPN Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                <div className="flex items-center gap-3">
                  {vpnActive ? (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">VPN Status</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      WireGuard Tunnel
                    </p>
                  </div>
                </div>
                <Badge
                  className={`text-[10px] ${
                    vpnActive
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {vpnActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Firewall & Discovery - side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Firewall */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                  <div className="flex items-center gap-3">
                    <Ban className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Firewall</p>
                      <p className="text-xs text-muted-foreground">Core not exposed</p>
                    </div>
                  </div>
                  <Badge className="text-[10px] bg-green-500 text-white">Secured</Badge>
                </div>

                {/* Discovery Port */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Discovery Port</p>
                      <p className="text-xs text-muted-foreground font-mono">:5353</p>
                    </div>
                  </div>
                  <Badge className="text-[10px] bg-blue-500/20 text-blue-400">mDNS</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Endpoint Authentication ────────────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" /> Endpoint Authentication
            </h2>

            <div className="space-y-2">
              {pairedEndpoints.map((ep) => (
                <div
                  key={ep.mac}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface/50"
                >
                  <div className="w-9 h-9 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                    {endpointTypeIcon(ep.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{ep.name}</p>
                      <Badge
                        className={`text-[10px] ${
                          ep.trust === 'Trusted'
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-400 text-black'
                        }`}
                      >
                        {ep.trust}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {ep.mac}
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-[11px] text-muted-foreground">
                        Paired {ep.pairedDate}
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-[11px] text-muted-foreground">
                        {ep.authMethod === 'Certificate' ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Key className="w-2.5 h-2.5" /> Certificate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> PIN
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10">
                    <Ban className="w-3 h-3 mr-1" /> Unpair
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Remote Control Authentication ──────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> Remote Control Authentication
            </h2>

            <div className="space-y-2">
              {connectedApps.map((app) => (
                <div
                  key={app.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface/50"
                >
                  <div className="w-9 h-9 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                    {deviceIcon(app.deviceType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{app.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          app.connectionType === 'LAN'
                            ? 'border-blue-400/40 text-blue-400'
                            : 'border-amber-400/40 text-amber-400'
                        }`}
                      >
                        {app.connectionType === 'LAN' ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Wifi className="w-2.5 h-2.5" /> LAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> Remote
                          </span>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        Last authenticated:{' '}
                        <span className="font-mono">{app.lastAuth}</span>
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-[11px] text-muted-foreground">
                        Token:{' '}
                        <span
                          className={`font-mono ${
                            app.tokenStatus === 'Active'
                              ? 'text-green-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {app.tokenStatus}
                        </span>
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10">
                    <Ban className="w-3 h-3 mr-1" /> Revoke Access
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Streaming Credentials ──────────────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Streaming Credentials
            </h2>

            <div className="space-y-3">
              {streamingCredentials.map((cred) => (
                <div key={cred.service} className="p-3 rounded-lg bg-surface/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{cred.service}</p>
                        <Badge className="text-[10px] bg-blue-500/20 text-blue-400">
                          {cred.authMethod}
                        </Badge>
                        <Badge className="text-[10px] bg-green-500 text-white">
                          {cred.storage}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Account:</span>
                          <span className="text-xs font-mono">{cred.account}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-muted-foreground">Token:</span>
                          <span className="text-xs font-mono text-green-400">
                            {cred.tokenRefresh}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button variant="outline" size="sm" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" /> Re-authenticate
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10">
                          <WifiOff className="w-3 h-3 mr-1" /> Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 6. Security Recommendations ───────────────────────── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Security Recommendations
            </h2>

            <div className="space-y-2">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface/50"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 ${severityColor(
                        rec.severity,
                      )}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.text}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${severityColor(rec.severity)}`}
                    >
                      {severityLabel(rec.severity)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

/** Inline helper — avoids importing a non-existent HeadphonesIcon */
function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
