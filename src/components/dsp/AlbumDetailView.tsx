'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore, type LocalTrack } from '@/store/local-library';
import { formatDuration, formatSampleRate, getCoverGradient, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, ArrowLeft, Heart, Share2, Star, Clock, Gauge,
  CheckCircle2, Zap, ChevronRight, Mic,
  Radio, Music, Disc3, HardDrive,
} from 'lucide-react';

/** Convert a LocalTrack to the Track format for the player queue */
function localTrackToTrack(lt: LocalTrack): Track {
  return {
    id: lt.id,
    title: lt.title,
    albumId: lt.album,
    albumName: lt.album,
    artistId: lt.artist,
    artistName: lt.artist,
    trackNumber: lt.trackNumber,
    discNumber: lt.discNumber,
    duration: lt.duration,
    format: lt.format,
    bitDepth: lt.bitDepth,
    sampleRate: lt.sampleRate,
    channels: lt.channels,
    bitrate: lt.bitrate,
    filePath: lt.filePath,
    fileSize: lt.fileSize,
    composers: lt.composer ? [lt.composer] : [],
    performers: [],
    genre: lt.genre,
    loved: false,
    playCount: 0,
    source: 'local' as const,
    isAvailable: true,
  };
}

export function AlbumDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, activeZoneId, currentTrack, isPlaying } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const albumId = viewParams.albumId;

  // Parse albumId: format is "local-album-{albumName}-{artistName}"
  // The artist name may contain hyphens, so split on the first "local-album-" prefix only
  const albumName = React.useMemo(() => {
    if (!albumId || !albumId.startsWith('local-album-')) return null;
    // Remove prefix, then split on last "|||" if present, otherwise use whole string
    const rest = albumId.replace(/^local-album-/, '');
    // In BrowseAlbumsView the key is `${albumArtist}|||${album}`
    if (rest.includes('|||')) {
      const parts = rest.split('|||');
      return { albumArtist: parts[0], album: parts[1] };
    }
    return null;
  }, [albumId]);

  // Find matching tracks from the local library
  const albumLocalTracks = React.useMemo(() => {
    if (!albumName) return [];
    return localTracks
      .filter(t => t.album === albumName.album && (t.albumArtist === albumName.albumArtist || t.artist === albumName.albumArtist))
      .sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber));
  }, [localTracks, albumName]);

  // Convert to Track format for player
  const albumTracks = React.useMemo(() => albumLocalTracks.map(localTrackToTrack), [albumLocalTracks]);

  const totalDuration = React.useMemo(() => albumLocalTracks.reduce((s, t) => s + t.duration, 0), [albumLocalTracks]);

  // Derive album metadata from the first track
  const firstTrack = albumLocalTracks[0];
  const albumMeta = firstTrack ? {
    title: firstTrack.album,
    artistName: firstTrack.albumArtist || firstTrack.artist,
    artistId: firstTrack.artist,
    year: firstTrack.year,
    genre: firstTrack.genre,
    format: firstTrack.format,
    sampleRate: firstTrack.sampleRate,
    bitDepth: firstTrack.bitDepth,
    channels: firstTrack.channels,
    coverArt: firstTrack.coverArt,
  } : null;

  // Aggregate composers
  const albumComposers = React.useMemo(() => {
    const compMap = new Map<string, number>();
    for (const lt of albumLocalTracks) {
      if (lt.composer) {
        compMap.set(lt.composer, (compMap.get(lt.composer) || 0) + 1);
      }
    }
    return Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [albumLocalTracks]);

  const playAll = () => {
    if (albumTracks.length > 0) setQueue(albumTracks, 0);
  };

  // Loading / not found state
  if (!albumName) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Disc3 className="w-12 h-12" />
        <p>Album not found</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('browse-albums')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Albums
        </Button>
      </div>
    );
  }

  if (albumLocalTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Disc3 className="w-12 h-12" />
        <p>No tracks found for this album</p>
        <p className="text-xs">"{albumName.album}" by {albumName.albumArtist}</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('browse-albums')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Albums
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('browse-albums')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Albums
        </Button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-56 h-56 md:w-64 md:h-64 rounded-xl shadow-2xl flex-shrink-0 relative overflow-hidden">
            {albumMeta?.coverArt ? (
              <img src={albumMeta.coverArt} alt={albumMeta.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(albumId)} flex items-center justify-center`}>
                <Disc3 className="w-20 h-20 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">Album</Badge>
              {albumMeta?.genre && (
                <Badge variant="outline" className="text-[10px]">{albumMeta.genre}</Badge>
              )}
              {albumMeta && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {albumMeta.format} {formatSampleRate(albumMeta.sampleRate)}
                </Badge>
              )}
              {albumMeta && (
                <Badge variant="outline" className="text-[10px] font-mono">{albumMeta.bitDepth}-bit</Badge>
              )}
              <Badge variant="outline" className="text-[9px] px-1 h-4">
                <HardDrive className="w-2.5 h-2.5 mr-0.5" /> Local
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-1">{albumMeta?.title}</h1>
            <p
              className="text-lg text-muted-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('browse-artists')}
            >
              {albumMeta?.artistName}
            </p>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {albumMeta?.year && albumMeta.year > 0 && <span>{albumMeta.year}</span>}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{albumLocalTracks.length} tracks</span>
              <span>·</span>
              <span>{formatDuration(totalDuration)}</span>
              {albumMeta?.channels === 1 && <Badge variant="outline" className="text-[10px]">Mono</Badge>}
              {albumMeta?.channels === 2 && <Badge variant="outline" className="text-[10px]">Stereo</Badge>}
              {albumMeta && albumMeta.channels > 2 && <Badge variant="outline" className="text-[10px]">{albumMeta.channels}-ch</Badge>}
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

        {/* Signal Path Mini — always show processing for local files */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Signal:</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Source: Local File
              </Badge>
              {albumMeta && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {albumMeta.format} {formatSampleRate(albumMeta.sampleRate)}/{albumMeta.bitDepth}bit
                </Badge>
              )}
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] font-mono">DSP Core</Badge>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] font-mono">
                {activeZoneId ? `Zone: ${activeZoneId}` : 'Output'}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-signal-amber">
                <Zap className="w-3 h-3 mr-0.5" /> Processing
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Track List</h2>
          <div className="space-y-0.5">
            {albumTracks.map((track, idx) => {
              const lt = albumLocalTracks[idx];
              return (
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
                  {lt?.coverArt ? (
                    <img src={lt.coverArt} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground font-mono">{track.format}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{formatSampleRate(track.sampleRate)}/{track.bitDepth}bit</span>
                      {track.composers.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {track.composers.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                </div>
              );
            })}
          </div>
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
      </div>
    </ScrollArea>
  );
}
