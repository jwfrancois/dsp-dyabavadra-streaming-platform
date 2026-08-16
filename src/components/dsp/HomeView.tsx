'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useSystemStore } from '@/store/system';
import { formatDuration, formatFileSize, getCoverGradient, formatSampleRate } from '@/lib/data';
import type { Track } from '@/lib/data';
import { cn } from '@/lib/utils';
import { radioStations } from '@/lib/radio-stations';
import { useLocalLibraryStore } from '@/store/local-library';
import { useHistoryStore } from '@/store/history';
import { useProfilesStore } from '@/store/profiles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, ArrowRight, Clock, Star, Sparkles,
  Headphones, Calendar, Music2, Radio, Waves,
  TrendingUp, Disc3, Library, Zap, Info,
  Search, Keyboard, Sun, Moon, Coffee, Sunrise,
  Heart, Shuffle,
  ChevronLeft, ChevronRight,
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

// ── Track conversion helper ──
function localToTrack(t: any): Track {
  return {
    id: t.id, title: t.title, albumId: t.album, albumName: t.album,
    artistId: t.artist, artistName: t.artist, trackNumber: t.trackNumber,
    discNumber: t.discNumber || 0, duration: t.duration, format: t.format,
    bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels,
    bitrate: t.bitrate, filePath: t.filePath, fileSize: t.fileSize,
    composers: t.composer ? [t.composer] : [], performers: [], genre: t.genre,
    loved: false, playCount: 0, source: 'local', isAvailable: true,
  };
}

// ── Time ago helper ──
function timeAgo(isoString: string): string {
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ── Genre color helper ──
const genreGradients = [
  'from-violet-600 to-purple-800', 'from-rose-600 to-pink-800',
  'from-blue-600 to-indigo-800', 'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800', 'from-cyan-600 to-sky-800',
  'from-fuchsia-600 to-pink-800', 'from-lime-600 to-green-800',
];
function getGenreGradient(genre: string): string {
  const hash = genre.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return genreGradients[hash % genreGradients.length];
}

// ═══════════════════════════════════════════════════════════
// ANALOG CLOCK — SVG-based with smooth animation
// ═══════════════════════════════════════════════════════════

function AnalogClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  const size = 180;
  const center = size / 2;
  const radius = center - 8;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] drop-shadow-2xl">
        <defs>
          <radialGradient id="clockGlow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.08)" />
          </radialGradient>
          <linearGradient id="clockFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--card) / 0.8)" />
          </linearGradient>
          <filter id="handShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        <circle cx={center} cy={center} r={radius + 6} fill="url(#clockGlow)" />
        <circle cx={center} cy={center} r={radius} fill="url(#clockFace)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <circle cx={center} cy={center} r={radius - 4} fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.5" />

        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const outerR = radius - 6;
          const innerR = isHour ? radius - 18 : radius - 10;
          return (
            <line key={`tick-${i}`}
              x1={center + Math.sin(angle) * innerR}
              y1={center - Math.cos(angle) * innerR}
              x2={center + Math.sin(angle) * outerR}
              y2={center - Math.cos(angle) * outerR}
              stroke={isHour ? 'hsl(var(--foreground) / 0.7)' : 'hsl(var(--muted-foreground) / 0.25)'}
              strokeWidth={isHour ? 2 : 0.8}
              strokeLinecap="round"
            />
          );
        })}

        {Array.from({ length: 12 }).map((_, i) => {
          const num = i === 0 ? 12 : i;
          const angle = (i * 30) * (Math.PI / 180);
          const numR = radius - 28;
          return (
            <text key={`num-${i}`}
              x={center + Math.sin(angle) * numR}
              y={center - Math.cos(angle) * numR + 4}
              textAnchor="middle"
              fill="hsl(var(--foreground) / 0.5)"
              fontSize="11"
              fontWeight="500"
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            >
              {num}
            </text>
          );
        })}

        <line x1={center} y1={center}
          x2={center + Math.sin((hourAngle) * Math.PI / 180) * (radius * 0.45)}
          y2={center - Math.cos((hourAngle) * Math.PI / 180) * (radius * 0.45)}
          stroke="hsl(var(--foreground))" strokeWidth="3.5" strokeLinecap="round" filter="url(#handShadow)" />

        <line x1={center} y1={center}
          x2={center + Math.sin((minuteAngle) * Math.PI / 180) * (radius * 0.65)}
          y2={center - Math.cos((minuteAngle) * Math.PI / 180) * (radius * 0.65)}
          stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" filter="url(#handShadow)" />

        <g style={{ transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)', transformOrigin: `${center}px ${center}px` }}>
          <line
            x1={center - Math.sin((secondAngle) * Math.PI / 180) * 15}
            y1={center + Math.cos((secondAngle) * Math.PI / 180) * 15}
            x2={center + Math.sin((secondAngle) * Math.PI / 180) * (radius * 0.72)}
            y2={center - Math.cos((secondAngle) * Math.PI / 180) * (radius * 0.72)}
            stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round"
          />
        </g>

        <circle cx={center} cy={center} r="4" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <circle cx={center} cy={center} r="1.5" fill="hsl(var(--primary))" />
      </svg>

      <div className="text-center">
        <p className="text-sm font-medium tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</p>
        <p className="text-[11px] text-muted-foreground">{dateStr}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INTERACTIVE CALENDAR
// ═══════════════════════════════════════════════════════════

function InteractiveCalendar({ className }: { className?: string }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [startingDay, daysInMonth]);

  const prevMonth = useCallback(() => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (day: number) =>
    selectedDate &&
    day === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
        <button onClick={prevMonth} className="p-1 rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold tracking-wide">{monthName}</h3>
        <button onClick={nextMonth} className="p-1 rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border/30">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-9" />;
          const todayFlag = isToday(day);
          const selectedFlag = isSelected(day);
          return (
            <button key={day}
              onClick={() => setSelectedDate(new Date(year, month, day))}
              className={cn(
                'h-9 flex items-center justify-center text-xs font-medium transition-all duration-200 relative',
                'hover:bg-accent/40 rounded-md m-0.5',
                todayFlag && !selectedFlag && 'text-primary font-bold',
                selectedFlag && 'bg-primary text-primary-foreground rounded-md shadow-sm shadow-primary/20',
                !todayFlag && !selectedFlag && 'text-foreground/70'
              )}
            >
              {day}
              {todayFlag && !selectedFlag && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="px-4 py-2.5 border-t border-border/30 bg-primary/[0.03]">
          <p className="text-xs text-muted-foreground">
            Selected:{' '}
            <span className="text-foreground font-medium">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
        </div>
      )}
    </div>
  );
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

  const historyEntries = useHistoryStore(s => s.entries);
  const getActiveProfile = useProfilesStore(s => s.getActiveProfile);
  const activeProfile = getActiveProfile();

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

  // ── Recently Played from history ──
  const recentlyPlayed = useMemo(() => {
    if (historyEntries.length === 0) return [];
    const seen = new Set<string>();
    const result: Array<{ track: typeof localTracks[0]; playedAt: string }> = [];
    for (const entry of historyEntries) {
      if (seen.has(entry.trackId)) continue;
      seen.add(entry.trackId);
      const track = localTracks.find(t => t.id === entry.trackId);
      if (track) {
        result.push({ track, playedAt: entry.playedAt });
        if (result.length >= 6) break;
      }
    }
    return result;
  }, [historyEntries, localTracks]);

  // ── Loved Tracks from profiles ──
  const lovedTracks = useMemo(() => {
    if (!activeProfile || activeProfile.lovedTrackIds.length === 0) return [];
    return activeProfile.lovedTrackIds
      .map(id => localTracks.find(t => t.id === id))
      .filter((t): t is typeof localTracks[0] => !!t)
      .slice(0, 6);
  }, [activeProfile, localTracks]);

  // ── Genre map for Quick Play ──
  const genreMap = useMemo(() => {
    const map: Record<string, typeof localTracks[0][]> = {};
    localTracks.forEach(t => {
      if (t.genre) {
        const g = t.genre.split(';')[0].trim();
        if (!map[g]) map[g] = [];
        map[g].push(t);
      }
    });
    return map;
  }, [localTracks]);

  const quickPlayGenres = useMemo(() => {
    const entries = Object.entries(genreMap);
    if (entries.length < 3) return [];
    return entries
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([genre, tracks]) => ({ genre, count: tracks.length }));
  }, [genreMap]);

  // ── Top Artists derived from library ──
  const topArtists = useMemo(() => {
    const artistAlbums: Record<string, Set<string>> = {};
    localTracks.forEach(t => {
      if (!artistAlbums[t.artist]) artistAlbums[t.artist] = new Set();
      artistAlbums[t.artist].add(t.album);
    });
    return Object.entries(artistAlbums)
      .map(([name, albums]) => ({
        name,
        trackCount: localTracks.filter(t => t.artist === name).length,
        albumCount: albums.size,
      }))
      .sort((a, b) => b.trackCount - a.trackCount)
      .slice(0, 6);
  }, [localTracks]);

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

  // Shuffle play all tracks in a genre
  const playGenreShuffled = (genre: string) => {
    const genreTracks = genreMap[genre];
    if (!genreTracks || genreTracks.length === 0) return;
    const shuffled = [...genreTracks].sort(() => Math.random() - 0.5);
    const trackObjs = shuffled.map(localToTrack);
    setQueue(trackObjs, 0);
  };

  // Helper to get album cover art from tracks
  const getAlbumCover = (albumName: string, artistName: string) => {
    const track = localTracks.find(t => t.album === albumName && t.artist === artistName && t.coverArt);
    return track?.coverArt || null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* ═══════════════════════════════════════════════
            HERO — DSP Title + Analog Clock + Calendar
        ═══════════════════════════════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border/50">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjIiLz48L3N2Zz4=')]" />

          <div className="relative z-10 p-6 sm:p-8">
            {/* Cursive Title */}
            <div className="text-center mb-6">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight"
                style={{ fontFamily: 'var(--font-dancing-script), cursive, serif' }}
              >
                Dyabavadra Streaming Platform
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                {greeting.icon}
                <p className="text-sm text-muted-foreground font-medium">{greeting.text}</p>
              </div>
            </div>

            {/* Clock + Calendar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              <AnalogClock className="w-[180px] sm:w-[200px] flex-shrink-0" />

              <div className="hidden sm:block w-px h-48 bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="sm:hidden h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />

              <InteractiveCalendar className="w-full sm:w-auto max-w-[280px] flex-shrink-0" />
            </div>

            <p className="text-center text-xs text-muted-foreground/60 mt-4 tracking-wide">
              High-fidelity music streaming & library system
            </p>
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

        {/* ── RECENTLY ADDED ── */}
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

        {/* ── RECENTLY PLAYED (from history store) ── */}
        {recentlyPlayed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                Recently Played
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-tracks')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recentlyPlayed.map(({ track, playedAt }) => (
                <Card
                  key={`hp-${track.id}-${playedAt}`}
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
                          <span className="text-[11px] text-muted-foreground">{timeAgo(playedAt)}</span>
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

        {/* ── LOVED TRACKS (from profiles store) ── */}
        {lovedTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Loved Tracks
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-tracks')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {lovedTracks.map(track => (
                <Card
                  key={`loved-${track.id}`}
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
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span className="text-[11px] text-muted-foreground">{formatDuration(track.duration)}</span>
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

        {/* ── QUICK PLAY (genre-based shortcuts) ── */}
        {quickPlayGenres.length >= 3 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-violet-400" />
                Quick Play
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {quickPlayGenres.map(({ genre, count }) => (
                <Card
                  key={`qp-${genre}`}
                  className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group overflow-hidden"
                  onClick={() => playGenreShuffled(genre)}
                >
                  <CardContent className="p-0">
                    <div className={`h-20 bg-gradient-to-br ${getGenreGradient(genre)} relative flex items-end p-3`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <div className="relative z-10 flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-semibold text-white truncate">{genre}</span>
                      </div>
                      <span className="absolute top-2 right-2 text-[10px] font-medium text-white/60">{count} tracks</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── TOP ARTISTS (derived from library) ── */}
        {topArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-gold" />
                Top Artists
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-artists')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {topArtists.map(artist => {
                const artistTracks = localTracks.filter(t => t.artist === artist.name);
                const coverArt = artistTracks.find(t => t.coverArt)?.coverArt;
                return (
                  <div
                    key={artist.name}
                    className="group text-center cursor-pointer"
                    onClick={() => navigate('artist-detail', { artistId: artist.name })}
                  >
                    <div className="w-full aspect-square rounded-full bg-gradient-to-br mx-auto mb-2 cover-art-hover shadow-lg relative overflow-hidden">
                      {coverArt ? (
                        <img src={coverArt} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white/80">{artist.name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                    <p className="text-[11px] text-muted-foreground">{artist.trackCount} tracks · {artist.albumCount} albums</p>
                  </div>
                );
              })}
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
                <Waves className="w-5 h-5 text-primary" />
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
                    <p className="text-sm font-medium mt-1">{(coreStatus.audioEngine as any)?.name || 'Web Audio API'}</p>
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
