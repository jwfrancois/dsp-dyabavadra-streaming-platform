'use client';

import React, { useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useSystemStore } from '@/store/system';
import { formatDuration, formatFileSize, getCoverGradient, formatSampleRate } from '@/lib/data';
import { radioStations } from '@/lib/radio-stations';
import { useLocalLibraryStore } from '@/store/local-library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, ArrowRight, Clock, Star, Sparkles,
  Headphones, Calendar, Music2, Radio, Waves,
  TrendingUp, Disc3, Library, Zap, Info,
  Search, Keyboard, Sun, Moon, Coffee, Sunrise,
} from 'lucide-react';

// ── Quality badge helper ──
function QualityBadge({ format, sampleRate, bitDepth }: { format: string; sampleRate: number; bitDepth: number }) {
  const isHiRes = sampleRate > 48000 || bitDepth > 16;
  const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSF', 'DFF', 'WavPack', 'APE', 'TAK'].includes(format.toUpperCase());
  const isDSD = ['DSF', 'DFF', 'DSD'].includes(format.toUpperCase());

  if (isDSD) return <Badge className="text-[9px] bg-purple-500/20 text-purple-400 border-purple-500/30 h-4 px-1">DSD</Badge>;
  if (isHiRes && isLossless) return <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 h-4 px-1">Hi-Res</Badge>;
  if (isLossless) return <Badge className="text-[9px] bg-signal-green/20 text-signal-green border-signal-green/30 h-4 px-1">Lossless</Badge>;
  return null;
}

// ── Time-based greeting ──
function getGreeting(): { text: string; icon: React.ReactNode; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Night Owl Mode', icon: <Moon className="w-5 h-5" />, emoji: '' };
  if (hour < 12) return { text: 'Good Morning', icon: <Sunrise className="w-5 h-5" />, emoji: '' };
  if (hour < 14) return { text: 'Good Afternoon', icon: <Sun className="w-5 h-5" />, emoji: '' };
  if (hour < 18) return { text: 'Good Afternoon', icon: <Sun className="w-5 h-5" />, emoji: '' };
  if (hour < 22) return { text: 'Good Evening', icon: <Moon className="w-5 h-5" />, emoji: '' };
  return { text: 'Night Owl Mode', icon: <Moon className="w-5 h-5" />, emoji: '' };
}

export function HomeView() {
  const { navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const coreStatus = useSystemStore(s => s.core);

  const { tracks: localTracks, getAlbums, getArtists, getTotalSize, getTotalDuration, getFormatCounts } = useLocalLibraryStore();
  const localAlbums = getAlbums();
  const localArtists = getArtists();
  const totalSize = getTotalSize();
  const totalDuration = getTotalDuration();
  const formatCounts = getFormatCounts();

  const greeting = getGreeting();

  const recentTracks = localTracks.slice(0, 8);
  const newestAlbums = [...localAlbums].sort((a, b) => b.year - a.year).slice(0, 6);
  const recentArtists = localArtists.slice(0, 8);

  // Genre distribution
  const genreDistribution = useMemo(() => {
    const genres: Record<string, number> = {};
    localTracks.forEach(t => {
      if (t.genre) {
        const g = t.genre.split(';')[0].trim();
        genres[g] = (genres[g] || 0) + 1;
      }
    });
    return Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [localTracks]);

  // Hi-Res tracks count
  const hiResCount = useMemo(() =>
    localTracks.filter(t => t.sampleRate > 48000 || t.bitDepth > 16).length,
    [localTracks]
  );

  // Format breakdown
  const formatBreakdown = useMemo(() =>
    Object.entries(formatCounts).sort((a, b) => b[1] - a[1]),
    [formatCounts]
  );

  const playAlbum = (albumName: string, artistName: string) => {
    const albumTracks = localTracks.filter(t => t.album === albumName && t.artist === artistName).sort((a, b) => a.trackNumber - b.trackNumber);
    if (albumTracks.length > 0) {
      const trackObjs = albumTracks.map(t => ({
        id: t.id, title: t.title, albumId: t.album, albumName: t.album, artistId: t.artist, artistName: t.artist,
        trackNumber: t.trackNumber, discNumber: t.discNumber, duration: t.duration, format: t.format,
        bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels, bitrate: t.bitrate,
        filePath: t.filePath, fileSize: t.fileSize, composers: [t.composer], performers: [],
        genre: t.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
      }));
      setQueue(trackObjs, 0);
    }
  };

  const playTrack = (trackId: string) => {
    const t = localTracks.find(tr => tr.id === trackId);
    if (t) {
      play({
        id: t.id, title: t.title, albumId: t.album, albumName: t.album, artistId: t.artist, artistName: t.artist,
        trackNumber: t.trackNumber, discNumber: t.discNumber, duration: t.duration, format: t.format,
        bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels, bitrate: t.bitrate,
        filePath: t.filePath, fileSize: t.fileSize, composers: [t.composer], performers: [],
        genre: t.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
      });
    }
  };

  // Helper to get album cover art from tracks
  const getAlbumCover = (albumName: string, artistName: string) => {
    const track = localTracks.find(t => t.album === albumName && t.artist === artistName && t.coverArt);
    return track?.coverArt || null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* ── HERO: Dynamic Greeting ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-card to-accent/20 p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              {greeting.icon}
              <h1 className="text-2xl font-bold">{greeting.text}</h1>
            </div>
            <p className="text-muted-foreground max-w-lg">
              {localTracks.length > 0
                ? `Your library holds ${localTracks.length} tracks across ${localAlbums.length} albums by ${localArtists.length} artists — ${formatDuration(totalDuration)} of music.`
                : 'Your DSP music sanctuary awaits. Scan your library to begin the audiophile experience.'}
            </p>

            {/* Now playing quick resume */}
            {currentTrack && isPlaying && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-black/20 rounded-lg max-w-md">
                <div className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">Now Playing: {currentTrack.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{currentTrack.artistName}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate('now-playing')}>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-3 mt-4 flex-wrap">
              {recentTracks.length > 0 && (
                <Button size="sm" onClick={() => playTrack(recentTracks[0]?.id)}>
                  <Play className="w-4 h-4 mr-2" /> Resume Playing
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate('browse-genres')}>
                <Sparkles className="w-4 h-4 mr-2" /> Discover
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('search')}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full opacity-10">
            <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient('hero')}`} />
          </div>
        </div>

        {/* ── KEYBOARD SHORTCUT TIP ── */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-lg border border-border/50">
          <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono mx-0.5">?</kbd> for keyboard shortcuts ·
            <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono mx-0.5">Space</kbd> play/pause ·
            <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono mx-0.5">/</kbd> search
          </p>
        </div>

        {/* ── RECENTLY PLAYED ── */}
        {recentTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recently Added
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-tracks')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recentTracks.map(track => (
                <Card
                  key={track.id}
                  className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => playTrack(track.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-md bg-gradient-to-br flex-shrink-0 relative overflow-hidden shadow-sm">
                        {track.coverArt ? (
                          <img src={track.coverArt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{formatDuration(track.duration)}</span>
                          <QualityBadge format={track.format} sampleRate={track.sampleRate} bitDepth={track.bitDepth} />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); playTrack(track.id); }}
                      >
                        <Play className="w-3 h-3 text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── QUICK STATS — Enhanced ── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tracks', value: localTracks.length.toString(), icon: Music2, color: 'text-primary', sub: hiResCount > 0 ? `${hiResCount} Hi-Res` : undefined },
              { label: 'Albums', value: localAlbums.length.toString(), icon: Disc3, color: 'text-signal-green', sub: undefined },
              { label: 'Artists', value: localArtists.length.toString(), icon: Star, color: 'text-gold', sub: undefined },
              { label: 'Total Time', value: totalDuration > 3600 ? `${Math.floor(totalDuration / 3600)}d ${Math.floor((totalDuration % 3600) / 60)}h` : `${Math.floor(totalDuration / 60)}m`, icon: Clock, color: 'text-signal-amber', sub: undefined },
            ].map(stat => (
              <Card key={stat.label} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    {stat.sub && <p className="text-[10px] text-primary">{stat.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── AUDIO QUALITY BREAKDOWN ── */}
        {localTracks.length > 0 && formatBreakdown.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wave className="w-5 h-5 text-primary" />
                Audio Quality
              </h2>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {formatBreakdown.map(([format, count]) => {
                    const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSF', 'DFF', 'WavPack', 'APE', 'TAK'].includes(format.toUpperCase());
                    const isDSD = ['DSF', 'DFF', 'DSD'].includes(format.toUpperCase());
                    return (
                      <div key={format} className="text-center">
                        <div className="relative mx-auto w-14 h-14 rounded-xl bg-surface flex items-center justify-center mb-2">
                          <span className="text-lg font-bold font-mono">{count}</span>
                          {isDSD && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-card" />}
                          {!isDSD && isLossless && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-signal-green border-2 border-card" />}
                        </div>
                        <p className="text-xs font-semibold font-mono">{format}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isDSD ? 'DSD' : isLossless ? 'Lossless' : 'Lossy'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {totalSize > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Total Library Size</p>
                    <p className="text-sm font-semibold font-mono">{formatFileSize(totalSize)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── GENRE DISTRIBUTION ── */}
        {genreDistribution.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-signal-green" />
                Top Genres
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-genres')}>
                All Genres <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {genreDistribution.map(([genre, count]) => (
                <Card
                  key={genre}
                  className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => navigate('genre-detail', { genre })}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{genre}</p>
                    <p className="text-lg font-bold tabular-nums mt-1">{count}</p>
                    <p className="text-[10px] text-muted-foreground">tracks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── NEW RELEASES ── */}
        {newestAlbums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Albums
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-albums')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {newestAlbums.map(album => {
                const coverArt = getAlbumCover(album.name, album.artist);
                return (
                  <div
                    key={`${album.name}-${album.artist}`}
                    className="group cursor-pointer"
                    onClick={() => playAlbum(album.name, album.artist)}
                  >
                    <div className="relative mb-2">
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br cover-art-hover shadow-lg relative overflow-hidden">
                        {coverArt ? (
                          <img src={coverArt} alt={album.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(album.name)}`} />
                        )}
                      </div>
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{album.artist}{album.year ? ` · ${album.year}` : ''}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── BROWSE ARTISTS ── */}
        {recentArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Artists</h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-artists')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {recentArtists.map(artist => {
                const artistTracks = localTracks.filter(t => t.artist === artist);
                const coverArt = artistTracks.find(t => t.coverArt)?.coverArt;
                return (
                  <div
                    key={artist}
                    className="group text-center cursor-pointer"
                    onClick={() => navigate('artist-detail', { artistId: artist })}
                  >
                    <div className="w-full aspect-square rounded-full bg-gradient-to-br mx-auto mb-2 cover-art-hover shadow-lg relative overflow-hidden">
                      {coverArt ? (
                        <img src={coverArt} alt={artist} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(artist)}`} />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist}</p>
                    <p className="text-[11px] text-muted-foreground">{artistTracks.length} tracks</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── INTERNET RADIO ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Radio className="w-5 h-5 text-signal-green" />
              Internet Radio
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('radio')}>
              All Stations <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {radioStations.slice(0, 4).map(station => (
              <Card
                key={station.id}
                className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                onClick={() => navigate('radio')}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCoverGradient(station.id)} flex-shrink-0 flex items-center justify-center`}>
                      <Radio className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{station.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-signal-green border-signal-green/30">LIVE</Badge>
                        <span className="text-[10px] text-muted-foreground">{station.genre}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── SYSTEM STATUS ── */}
        {coreStatus && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-signal-amber" />
                DSP Core
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('system')}>
                System Details <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Core Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
                      <p className="text-sm font-medium">{coreStatus.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</p>
                    <p className="text-sm font-medium font-mono mt-1">{coreStatus.uptime}s</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Audio Engine</p>
                    <p className="text-sm font-medium mt-1">{coreStatus.audioEngine?.name || 'Web Audio API'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Supported Formats</p>
                    <p className="text-sm font-medium mt-1">{coreStatus.audioEngine?.supportedFormats?.length || 6} formats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── EMPTY STATE ── */}
        {localTracks.length === 0 && (
          <section className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
              <Library className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your Library Awaits</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Import your music collection to unlock DSP&apos;s full audiophile experience.
              Supports FLAC, WAV, DSD, MQA, AIFF, and 17 other formats with bit-perfect playback.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('library')}>
                <Library className="w-4 h-4 mr-2" /> Scan Library
              </Button>
              <Button variant="outline" onClick={() => navigate('radio')}>
                <Radio className="w-4 h-4 mr-2" /> Try Radio
              </Button>
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
