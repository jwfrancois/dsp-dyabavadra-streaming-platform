'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play, ArrowLeft, Heart, Share2, Star, Clock, Gauge,
  CheckCircle2, Zap, ChevronRight, AlertCircle, Mic,
  Radio, Music, Disc3, User,
} from 'lucide-react';

export function AlbumDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, activeZoneId, currentTrack, isPlaying } = usePlayerStore();
  const albumId = viewParams.albumId;
  const album = null;

  if (!album) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Album not found</div>;
  }

  const albumTracks: import('@/lib/data').Track[] = [];
  const totalDuration = 0;
  const signalPath: import('@/lib/data').SignalPathStep[] = [];
  const isBitPerfect = false;

  // Aggregate all unique credits across the album
  const albumCredits = React.useMemo(() => {
    const creditMap = new Map<string, { name: string; roles: string[]; instruments: string[]; trackIds: string[] }>();
    for (const track of albumTracks) {
      for (const perf of track.performers) {
        const existing = creditMap.get(perf.name);
        if (existing) {
          if (!existing.roles.includes(perf.role)) existing.roles.push(perf.role);
          if (perf.instrument && !existing.instruments.includes(perf.instrument)) existing.instruments.push(perf.instrument);
          if (!existing.trackIds.includes(track.id)) existing.trackIds.push(track.id);
        } else {
          creditMap.set(perf.name, { name: perf.name, roles: [perf.role], instruments: perf.instrument ? [perf.instrument] : [], trackIds: [track.id] });
        }
      }
    }
    return Array.from(creditMap.values()).sort((a, b) => b.trackIds.length - a.trackIds.length);
  }, [albumTracks]);

  // Aggregate all composers
  const albumComposers = React.useMemo(() => {
    const compMap = new Map<string, number>();
    for (const track of albumTracks) {
      for (const comp of track.composers) {
        compMap.set(comp, (compMap.get(comp) || 0) + 1);
      }
    }
    return Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [albumTracks]);

  const playAll = () => {
    if (albumTracks.length > 0) setQueue(albumTracks, 0);
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('browse-albums')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Albums
        </Button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className={`w-56 h-56 md:w-64 md:h-64 rounded-xl bg-gradient-to-br ${getCoverGradient(album.id)} shadow-2xl flex-shrink-0 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
            {album.rating >= 9 && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">
                <Star className="w-3 h-3 mr-1" /> {album.rating}/10
              </Badge>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">{album.type.charAt(0).toUpperCase() + album.type.slice(1)}</Badge>
              <Badge
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => navigate('genre-detail', { genreName: album.genre })}
              >
                {album.genre}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">{album.format} {formatSampleRate(album.sampleRate)}</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">{album.bitDepth}-bit</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-1">{album.title}</h1>
            <p
              className="text-lg text-muted-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('artist-detail', { artistId: album.artistId })}
            >
              {album.artistName}
            </p>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{album.year}</span>
              {album.label && <span>{album.label}</span>}
              {album.catalogNumber && <span className="font-mono text-xs">{album.catalogNumber}</span>}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{albumTracks.length} tracks</span>
              <span>·</span>
              <span>{formatDuration(totalDuration)}</span>
              {album.channels === 1 && <Badge variant="outline" className="text-[10px]">Mono</Badge>}
              {album.channels === 2 && <Badge variant="outline" className="text-[10px]">Stereo</Badge>}
              {album.channels > 2 && <Badge variant="outline" className="text-[10px]">{album.channels}-ch</Badge>}
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={playAll}>
                <Play className="w-4 h-4 mr-2" /> Play Album
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('radio')}>
                <Radio className="w-4 h-4 mr-2" /> Album Radio
              </Button>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" /> Love
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Signal Path Mini */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Signal:</span>
              {signalPath.map((step, i) => (
                <React.Fragment key={i}>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {step.label}: {step.format} {formatSampleRate(step.sampleRate)}/{step.bitDepth}bit
                  </Badge>
                  {i < signalPath.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </React.Fragment>
              ))}
              {isBitPerfect ? (
                <Badge className="text-[10px] bg-signal-green text-white"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Bit-Perfect</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-signal-amber"><Zap className="w-3 h-3 mr-0.5" /> Processing</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Track List</h2>
          <div className="space-y-0.5">
            {albumTracks.map(track => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                  currentTrack?.id === track.id ? 'bg-accent/40' : ''
                }`}
                onClick={() => play(track)}
              >
                <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Music className="w-3 h-3 text-primary" />
                  ) : (
                    <span className="group-hover:hidden">{track.trackNumber}</span>
                  )}
                  <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-mono">{track.format}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{formatSampleRate(track.sampleRate)}/{track.bitDepth}bit</span>
                    {track.source !== 'local' && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{track.source.toUpperCase()}</Badge>
                    )}
                    {track.composers.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {track.composers.join(', ')}
                      </span>
                    )}
                    {track.loved && <Heart className="w-3 h-3 fill-red-500 text-red-500" />}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Credits - Cross-linked */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-muted-foreground" />
            Credits
          </h2>
          {albumCredits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {albumCredits.map(credit => (
                <div
                  key={credit.name}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => navigate('performer-detail', { performerName: credit.name })}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getCoverGradient(credit.name)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{credit.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {credit.roles.join(', ')}{credit.instruments.length > 0 ? ` (${credit.instruments.join(', ')})` : ''}
                      {` · ${credit.trackIds.length} track${credit.trackIds.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No performer credits available for this album.</p>
          )}
        </section>

        {/* Composers */}
        {albumComposers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Composers</h2>
            <div className="flex flex-wrap gap-2">
              {albumComposers.map(([name, count]) => (
                <Badge key={name} variant="outline" className="px-3 py-1">
                  {name} <span className="text-muted-foreground ml-1">({count})</span>
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Album Review */}
        {album.review && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Review</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-sm font-semibold">{album.rating}/10</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{album.review}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Other Editions */}
        {album.editions && album.editions.length > 1 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Available Editions</h2>
            <div className="space-y-2">
              {album.editions.map(edition => (
                <Card key={edition.id} className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded bg-gradient-to-br ${getCoverGradient(edition.id)}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{edition.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {edition.format} · {formatSampleRate(edition.sampleRate)} · {edition.bitDepth}-bit
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{edition.year}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
