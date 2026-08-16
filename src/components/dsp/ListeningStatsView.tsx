'use client';

import React, { useMemo } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';
import { usePlayerStore } from '@/store/player';
import { useHistoryStore } from '@/store/history';
import { useUIStore } from '@/store/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDuration, formatFileSize, formatSampleRate, getCoverGradient } from '@/lib/data';
import {
  BarChart3, Clock, TrendingUp, Music2, Disc3, Star,
  Play, Flame, Award, ArrowRight, Zap, Headphones,
  Radio, Library,
} from 'lucide-react';

export function ListeningStatsView() {
  const { tracks: localTracks, getAlbums, getArtists, getTotalDuration, getTotalSize, getFormatCounts } = useLocalLibraryStore();
  const { currentTrack, isPlaying, queue } = usePlayerStore();
  const history = useHistoryStore(s => s.entries);
  const { navigate } = useUIStore();

  const localAlbums = getAlbums();
  const localArtists = getArtists();
  const totalDuration = getTotalDuration();
  const totalSize = getTotalSize();
  const formatCounts = getFormatCounts();

  // Top artists by track count
  const topArtists = useMemo(() => {
    const artistCounts: Record<string, number> = {};
    localTracks.forEach(t => {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    });
    return Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [localTracks]);

  // Top genres
  const topGenres = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    localTracks.forEach(t => {
      if (t.genre) {
        const g = t.genre.split(';')[0].trim();
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    });
    return Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [localTracks]);

  // Format distribution
  const formatBreakdown = useMemo(() =>
    Object.entries(formatCounts).sort((a, b) => b[1] - a[1]),
    [formatCounts]
  );

  // Quality distribution
  const qualityBreakdown = useMemo(() => {
    let lossless = 0;
    let hires = 0;
    let dsd = 0;
    let lossy = 0;
    localTracks.forEach(t => {
      const fmt = t.format.toUpperCase();
      const isDSD = ['DSF', 'DFF', 'DSD'].includes(fmt);
      const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSF', 'DFF', 'WavPack', 'APE', 'TAK'].includes(fmt);
      const isHiRes = t.sampleRate > 48000 || t.bitDepth > 16;
      if (isDSD) dsd++;
      else if (isHiRes && isLossless) hires++;
      else if (isLossless) lossless++;
      else lossy++;
    });
    return { lossless, hires, dsd, lossy };
  }, [localTracks]);

  // Sample rate distribution
  const sampleRateDist = useMemo(() => {
    const rates: Record<string, number> = {};
    localTracks.forEach(t => {
      const rate = formatSampleRate(t.sampleRate);
      rates[rate] = (rates[rate] || 0) + 1;
    });
    return Object.entries(rates).sort((a, b) => {
      const aNum = parseInt(a[0].replace(/[^\d]/g, '')) || 0;
      const bNum = parseInt(b[0].replace(/[^\d]/g, '')) || 0;
      return bNum - aNum;
    });
  }, [localTracks]);

  // Longest albums
  const longestAlbums = useMemo(() => {
    const albumDurations: Record<string, { artist: string; duration: number; tracks: number }> = {};
    localTracks.forEach(t => {
      const key = `${t.album}:${t.artist}`;
      if (!albumDurations[key]) albumDurations[key] = { artist: t.artist, duration: 0, tracks: 0 };
      albumDurations[key].duration += t.duration;
      albumDurations[key].tracks++;
    });
    return Object.entries(albumDurations)
      .map(([key, val]) => ({ name: key.split(':')[0], artist: val.artist, ...val }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }, [localTracks]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Listening Stats
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your DSP library analytics and insights
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Tracks', value: localTracks.length.toString(), icon: Music2, color: 'text-primary' },
            { label: 'Total Albums', value: localAlbums.length.toString(), icon: Disc3, color: 'text-signal-green' },
            { label: 'Total Artists', value: localArtists.length.toString(), icon: Star, color: 'text-gold' },
            { label: 'Listening Time', value: totalDuration > 86400 ? `${(totalDuration / 86400).toFixed(1)} days` : totalDuration > 3600 ? `${(totalDuration / 3600).toFixed(1)} hours` : `${Math.floor(totalDuration / 60)} min`, icon: Clock, color: 'text-signal-amber' },
          ].map(stat => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Audio Quality Breakdown */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            Audio Quality Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Lossy', count: qualityBreakdown.lossy, color: 'text-muted-foreground', bg: 'bg-muted' },
              { label: 'Lossless', count: qualityBreakdown.lossless, color: 'text-signal-green', bg: 'bg-signal-green' },
              { label: 'Hi-Res', count: qualityBreakdown.hires, color: 'text-primary', bg: 'bg-primary' },
              { label: 'DSD', count: qualityBreakdown.dsd, color: 'text-purple-400', bg: 'bg-purple-500' },
            ].map(q => (
              <Card key={q.label} className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{q.count}</p>
                  <p className={`text-xs font-medium ${q.color}`}>{q.label}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full ${q.bg} transition-all`}
                      style={{ width: `${localTracks.length > 0 ? (q.count / localTracks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {localTracks.length > 0 ? ((q.count / localTracks.length) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Format & Sample Rate */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Format Breakdown */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Format Breakdown</h3>
              <div className="space-y-2">
                {formatBreakdown.map(([format, count]) => {
                  const pct = localTracks.length > 0 ? (count / localTracks.length) * 100 : 0;
                  return (
                    <div key={format} className="flex items-center gap-2">
                      <span className="text-xs font-mono w-12 text-right">{format}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
              {totalSize > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-between">
                  <span className="text-xs text-muted-foreground">Total Library Size</span>
                  <span className="text-xs font-semibold font-mono">{formatFileSize(totalSize)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Rate Distribution */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Sample Rate Distribution</h3>
              <div className="space-y-2">
                {sampleRateDist.map(([rate, count]) => {
                  const pct = localTracks.length > 0 ? (count / localTracks.length) * 100 : 0;
                  const isHiRes = rate.includes('96') || rate.includes('88') || rate.includes('176') || rate.includes('192') || rate.includes('352') || rate.includes('384') || rate.includes('DSD');
                  return (
                    <div key={rate} className="flex items-center gap-2">
                      <span className={`text-xs font-mono w-16 text-right ${isHiRes ? 'text-primary' : ''}`}>{rate}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isHiRes ? 'bg-primary/70' : 'bg-signal-green/70'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Artists */}
        {topArtists.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-gold" />
              Top Artists by Library Size
            </h2>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {topArtists.map(([artist, count], i) => {
                    const pct = (count / topArtists[0][1]) * 100;
                    return (
                      <div
                        key={artist}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 cursor-pointer transition-colors group"
                        onClick={() => navigate('artist-detail', { artistId: artist })}
                      >
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getCoverGradient(artist)} flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-surface overflow-hidden">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{count} tracks</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Top Genres */}
        {topGenres.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-signal-amber" />
              Genre Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topGenres.map(([genre, count]) => (
                <Card
                  key={genre}
                  className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => navigate('genre-detail', { genre })}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium truncate">{genre}</p>
                    <p className="text-lg font-bold tabular-nums">{count}</p>
                    <p className="text-[10px] text-muted-foreground">tracks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Longest Albums */}
        {longestAlbums.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Longest Albums
            </h2>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {longestAlbums.map((album, i) => (
                    <div key={album.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${getCoverGradient(album.name)} flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{album.name}</p>
                        <p className="text-[11px] text-muted-foreground">{album.artist} · {album.tracks} tracks</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">{formatDuration(album.duration)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Empty State */}
        {localTracks.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
            <p className="text-sm text-muted-foreground">Import your music library to see detailed listening statistics.</p>
            <Button className="mt-4" onClick={() => navigate('library')}>
              <Library className="w-4 h-4 mr-2" /> Import Library
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
