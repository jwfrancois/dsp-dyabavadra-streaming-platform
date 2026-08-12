'use client';

import React, { useState } from 'react';
import { useStreamingStore } from '@/store/streaming';
import { useUIStore } from '@/store/ui';
import { formatDuration, formatSampleRate } from '@/lib/data';
import type { StreamingService, StreamingTrack } from '@/lib/metadata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Link2, Unlink, Wifi, WifiOff, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Zap, Gauge, Music, Headphones,
  Info, ToggleLeft, ToggleRight, Globe, Shield, Database,
  Signal, ArrowRight,
} from 'lucide-react';

const statusConfig: Record<StreamingService['status'], {
  label: string; color: string; bgClass: string; icon: typeof CheckCircle2;
}> = {
  connected: { label: 'Connected', color: 'text-green-400', bgClass: 'bg-green-500/15 border-green-500/30 text-green-400', icon: CheckCircle2 },
  disconnected: { label: 'Disconnected', color: 'text-muted-foreground', bgClass: 'bg-muted border-border text-muted-foreground', icon: XCircle },
  connecting: { label: 'Connecting...', color: 'text-yellow-400', bgClass: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', icon: Loader2 },
  error: { label: 'Error', color: 'text-red-400', bgClass: 'bg-red-500/15 border-red-500/30 text-red-400', icon: XCircle },
  offline: { label: 'Offline', color: 'text-amber-400', bgClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: WifiOff },
};

export function StreamingView() {
  const {
    services, streamingTracks, isOfflineMode,
    linkService, unlinkService, setOfflineMode, getLinkedServices,
  } = useStreamingStore();
  const { navigate } = useUIStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const linkedServices = getLinkedServices();
  const regionRestrictedTracks = streamingTracks.filter(t => t.isRegionRestricted);

  const handleConnect = (serviceId: string) => {
    setConnectingId(serviceId);
    setTimeout(() => {
      linkService(serviceId);
      setConnectingId(null);
    }, 1500);
  };

  const handleDisconnect = (serviceId: string) => {
    unlinkService(serviceId);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Streaming Services
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Connect and manage your streaming integrations</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {linkedServices.length} connected
          </Badge>
        </div>

        {/* Offline Mode Banner */}
        {isOfflineMode && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">Offline Mode Active</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Only your local library is available. Streaming services are disabled and no network requests will be made.
                  All playback uses local files from your DSP library.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex-shrink-0"
                onClick={() => setOfflineMode(false)}
              >
                Go Online
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offline Mode Toggle */}
        <Card className="mb-8 bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOfflineMode ? 'bg-amber-500/15' : 'bg-green-500/15'}`}>
                {isOfflineMode ? <WifiOff className="w-5 h-5 text-amber-400" /> : <Wifi className="w-5 h-5 text-green-400" />}
              </div>
              <div>
                <p className="text-sm font-medium">Offline Mode</p>
                <p className="text-xs text-muted-foreground">
                  {isOfflineMode
                    ? 'Local library only — streaming disabled'
                    : 'Streaming services active — full catalog access'
                  }
                </p>
              </div>
            </div>
            <button
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                isOfflineMode ? 'bg-amber-500' : 'bg-muted'
              }`}
              onClick={() => setOfflineMode(!isOfflineMode)}
              role="switch"
              aria-checked={isOfflineMode}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isOfflineMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </CardContent>
        </Card>

        {/* Service Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            Available Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => {
              const status = statusConfig[service.status];
              const StatusIcon = status.icon;
              const isConnecting = connectingId === service.id;
              const isLinked = service.linked && service.status === 'connected';

              return (
                <Card
                  key={service.id}
                  className="bg-card overflow-hidden"
                  style={{ borderColor: isLinked ? service.color + '40' : undefined }}
                >
                  {/* Color accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: service.color }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Logo placeholder */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                        style={{ backgroundColor: service.color + '20', color: service.color }}
                      >
                        {service.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge variant="outline" className={`text-[10px] ${status.bgClass}`}>
                            {isConnecting ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <StatusIcon className={`w-3 h-3 mr-1 ${service.status === 'connecting' ? 'animate-spin' : ''}`} />
                            )}
                            {isConnecting ? 'Connecting...' : status.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" /> {service.maxQuality}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" /> {service.catalogSize}
                          </span>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {service.features.slice(0, 4).map(f => (
                            <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {f}
                            </Badge>
                          ))}
                          {service.features.length > 4 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              +{service.features.length - 4}
                            </Badge>
                          )}
                        </div>

                        {/* Link/Unlink Button */}
                        <Button
                          size="sm"
                          variant={isLinked ? 'outline' : 'default'}
                          disabled={isConnecting || (isOfflineMode && !isLinked)}
                          className={`w-full ${!isLinked ? '' : 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'}`}
                          onClick={() => isLinked ? handleDisconnect(service.id) : handleConnect(service.id)}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Authenticating...
                            </>
                          ) : isLinked ? (
                            <>
                              <Unlink className="w-4 h-4 mr-2" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Linked Services Detail */}
        {linkedServices.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Linked Services
            </h2>
            <div className="space-y-3">
              {linkedServices.map(svc => (
                <Card key={svc.id} className="bg-card border-border" style={{ borderLeftWidth: '3px', borderLeftColor: svc.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: svc.color + '20', color: svc.color }}
                        >
                          {svc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{svc.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {svc.linkedAccount && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" /> {svc.linkedAccount}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Linked {formatDate(svc.linkedSince)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" /> {svc.maxQuality}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-400"
                        onClick={() => handleDisconnect(svc.id)}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Region Restrictions */}
        {regionRestrictedTracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Region Restrictions
            </h2>
            <Card className="bg-card border-amber-500/20">
              <CardContent className="p-0">
                <div className="max-h-72 overflow-y-auto">
                  {regionRestrictedTracks.map(track => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 hover:bg-accent/20 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artistName} · {track.albumName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-400 flex-shrink-0">
                        {track.serviceName}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/20 text-red-400 flex-shrink-0">
                        Region Locked
                      </Badge>
                      <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                        {track.format} {track.bitDepth}/{track.sampleRate}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Quality Tier Comparison */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Quality Tier Comparison
          </h2>
          {linkedServices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Gauge className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Connect a streaming service to compare quality tiers</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Quality</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sample Rate</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bit Depth</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DSD</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MQA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedServices.map(svc => (
                      <tr key={svc.id} className="border-b border-border last:border-b-0 hover:bg-accent/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: svc.color + '20', color: svc.color }}
                            >
                              {svc.name.charAt(0)}
                            </div>
                            <span className="font-medium">{svc.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-medium">{svc.maxQuality}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary" className="text-xs tabular-nums">
                            {svc.maxSampleRate} kHz
                          </Badge>
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {svc.maxBitDepth}-bit
                        </td>
                        <td className="p-3 text-center">
                          {svc.supportsDSD ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {svc.supportsMQA ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        {/* Signal Path Integration Note */}
        <section className="mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Signal className="w-4 h-4 text-primary" />
                Signal Path Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When streaming content is played through DSP, the audio quality from your connected service is
                  reflected in the signal path display. The signal path automatically shows the source format (e.g.,
                  FLAC 24/192 from Tidal) and maps it through the full DSP pipeline — including any software
                  processing, DAC input format, and final output format to your active zone. High-resolution
                  streams from services like Tidal Master or Qobuz Hi-Res will show their native sample rate and
                  bit depth in the signal path chain, giving you full visibility into the audio quality at every
                  stage from source to speaker.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs text-primary"
                onClick={() => navigate('now-playing')}
              >
                View Now Playing <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </ScrollArea>
  );
}
