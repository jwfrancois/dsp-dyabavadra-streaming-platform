'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { internetRadioStations, searchRadioStations, getRadioGenres, getRadioCountries, getRadioSources, getFavoriteRadioStations, toggleRadioFavorite } from '@/lib/radio-stations';
import type { RadioStation } from '@/lib/radio-stations';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play, Square, Heart, Search, Radio, Globe, Signal,
  ChevronDown, ArrowDownAZ, ArrowUpAZ,
  Filter, Waves, Star, TrendingUp,
  Zap, Music2, Headphones, Antenna, Disc3,
  Fingerprint, RadioTower, Tv, Palette, Sparkles,
  X, ExternalLink
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// ANIMATED EQUALIZER BARS
// ═══════════════════════════════════════════════════════

function AnimatedEqualizer({
  barCount = 8,
  className,
  color = 'bg-primary',
  height = 'h-6',
  gap = 'gap-[3px]',
  barWidth = 'w-[3px]',
  active = true,
}: {
  barCount?: number;
  className?: string;
  color?: string;
  height?: string;
  gap?: string;
  barWidth?: string;
  active?: boolean;
}) {
  if (!active) {
    return (
      <div className={cn('flex items-end', gap, height, className)}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={cn(barWidth, color, 'rounded-full opacity-30')}
            style={{ height: `${4 + ((i % 3) * 3)}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-end', gap, height, className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(barWidth, color, 'rounded-full')}
          style={{
            animation: `radioEq ${0.8 + Math.random() * 0.8}s ease-in-out ${i * 0.07}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes radioEq {
          0% { height: 3px; opacity: 0.3; }
          100% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GENRE CONFIG — gradient + icon + glow per genre
// ═══════════════════════════════════════════════════════

const genreConfig: Record<string, { gradient: string; icon: typeof Radio; glow: string }> = {
  'Ambient':      { gradient: 'from-teal-600 to-cyan-700',    icon: Waves,         glow: 'shadow-teal-500/20' },
  'Lounge':       { gradient: 'from-purple-600 to-fuchsia-700', icon: Music2,     glow: 'shadow-purple-500/20' },
  'Electronic':   { gradient: 'from-violet-600 to-purple-700',  icon: Zap,        glow: 'shadow-violet-500/20' },
  'Indie':        { gradient: 'from-orange-600 to-amber-700',   icon: Star,        glow: 'shadow-orange-500/20' },
  'Chillout':     { gradient: 'from-sky-600 to-blue-700',       icon: Headphones,  glow: 'shadow-sky-500/20' },
  'Country':      { gradient: 'from-yellow-700 to-orange-800',  icon: Radio,       glow: 'shadow-yellow-500/20' },
  'Dubstep':      { gradient: 'from-red-700 to-rose-800',       icon: Zap,         glow: 'shadow-red-500/20' },
  'Metal':        { gradient: 'from-zinc-700 to-slate-800',     icon: Fingerprint, glow: 'shadow-zinc-500/20' },
  'Classical':    { gradient: 'from-amber-600 to-yellow-700',   icon: Disc3,       glow: 'shadow-amber-500/20' },
  'Folk':         { gradient: 'from-emerald-600 to-green-700',  icon: Sparkles,    glow: 'shadow-emerald-500/20' },
  '80s':          { gradient: 'from-pink-600 to-rose-700',       icon: Tv,          glow: 'shadow-pink-500/20' },
  'Alternative':  { gradient: 'from-indigo-600 to-blue-700',     icon: RadioTower,  glow: 'shadow-indigo-500/20' },
  '70s':          { gradient: 'from-orange-500 to-red-600',      icon: Disc3,       glow: 'shadow-orange-500/20' },
  'Reggae':       { gradient: 'from-lime-600 to-green-700',    icon: Radio,       glow: 'shadow-lime-500/20' },
  'World':        { gradient: 'from-teal-500 to-emerald-600',   icon: Globe,       glow: 'shadow-teal-500/20' },
  'Holiday':      { gradient: 'from-red-600 to-green-700',      icon: Star,        glow: 'shadow-red-500/20' },
  'Eclectic':     { gradient: 'from-fuchsia-600 to-pink-700',   icon: Palette,     glow: 'shadow-fuchsia-500/20' },
  'Celtic':       { gradient: 'from-green-600 to-teal-700',     icon: Music2,       glow: 'shadow-green-500/20' },
  'Trance':       { gradient: 'from-blue-600 to-indigo-700',    icon: Zap,          glow: 'shadow-blue-500/20' },
  'Lo-Fi':        { gradient: 'from-stone-500 to-zinc-600',      icon: Headphones,   glow: 'shadow-stone-500/20' },
  'Pop':          { gradient: 'from-pink-500 to-fuchsia-600',  icon: Star,         glow: 'shadow-pink-500/20' },
  'Rock':         { gradient: 'from-red-600 to-orange-700',      icon: Radio,        glow: 'shadow-red-500/20' },
  'Jazz':         { gradient: 'from-amber-700 to-orange-800',    icon: Music2,       glow: 'shadow-amber-500/20' },
  'Blues':        { gradient: 'from-blue-800 to-indigo-900',     icon: Music2,       glow: 'shadow-blue-800/20' },
  'Hip Hop':      { gradient: 'from-yellow-500 to-amber-600',    icon: Zap,          glow: 'shadow-yellow-500/20' },
  'R&B':          { gradient: 'from-purple-700 to-fuchsia-800', icon: Headphones,   glow: 'shadow-purple-700/20' },
  'Latin':        { gradient: 'from-orange-600 to-red-700',      icon: Sparkles,     glow: 'shadow-orange-600/20' },
  'Reggaeton':    { gradient: 'from-yellow-600 to-orange-700',   icon: Zap,           glow: 'shadow-yellow-600/20' },
  'News':         { gradient: 'from-slate-600 to-zinc-700',      icon: RadioTower,   glow: 'shadow-slate-500/20' },
  'Talk':         { gradient: 'from-slate-600 to-zinc-700',      icon: RadioTower,   glow: 'shadow-slate-500/20' },
  'News/Talk':    { gradient: 'from-slate-600 to-zinc-700',      icon: RadioTower,   glow: 'shadow-slate-500/20' },
  'Adult Contemporary': { gradient: 'from-sky-500 to-cyan-600', icon: Music2,      glow: 'shadow-sky-500/20' },
  'Dance':        { gradient: 'from-fuchsia-500 to-pink-600',   icon: Zap,           glow: 'shadow-fuchsia-500/20' },
  'House':        { gradient: 'from-violet-500 to-purple-600',   icon: Headphones,   glow: 'shadow-violet-500/20' },
  'Techno':       { gradient: 'from-gray-600 to-zinc-700',       icon: Zap,           glow: 'shadow-gray-500/20' },
  'Dub':          { gradient: 'from-green-700 to-emerald-800',   icon: Radio,         glow: 'shadow-green-700/20' },
  '90s':          { gradient: 'from-violet-500 to-purple-600',   icon: Tv,            glow: 'shadow-violet-500/20' },
  '2000s':        { gradient: 'from-cyan-600 to-blue-700',      icon: Disc3,         glow: 'shadow-cyan-500/20' },
};

function getGenreConf(genre: string) {
  return genreConfig[genre] || { gradient: 'from-zinc-600 to-zinc-700', icon: Radio, glow: 'shadow-zinc-500/20' };
}

// ═══════════════════════════════════════════════════════
// COUNTRY FLAG EMOJIS
// ═══════════════════════════════════════════════════════

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const c = code.toUpperCase();
  const base = 0x1F1E6 - 65;
  const char1 = String.fromCodePoint(base + c.charCodeAt(0));
  const char2 = String.fromCodePoint(base + c.charCodeAt(1));
  return char1 + char2;
}

// ═══════════════════════════════════════════════════════
// SORT OPTIONS
// ═══════════════════════════════════════════════════════

type SortOption = 'az' | 'za' | 'country' | 'genre';

function sortStations(stations: RadioStation[], sort: SortOption): RadioStation[] {
  const sorted = [...stations];
  switch (sort) {
    case 'az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'country':
      return sorted.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
    case 'genre':
      return sorted.sort((a, b) => a.genre.localeCompare(b.genre) || a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

// ═══════════════════════════════════════════════════════
// DEBOUNCED HOOK
// ═══════════════════════════════════════════════════════

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}

// ═══════════════════════════════════════════════════════
// GENRE CARD — visual genre tile for carousel
// ═══════════════════════════════════════════════════════

function GenreCard({
  genre,
  count,
  isActive,
  onClick,
}: {
  genre: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const isAll = genre === 'All';
  const gradient = isAll ? 'from-primary to-primary/70' : getGenreConf(genre).gradient;
  const Icon = isAll ? Grid2x2 : getGenreConf(genre).icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 w-[130px] h-[88px] rounded-xl overflow-hidden transition-all duration-300',
        'hover:scale-[1.05] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40',
        isActive && 'ring-2 ring-primary scale-[1.05] shadow-lg'
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
      <div className="absolute inset-0 opacity-[0.06] bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==\')]" />
      <div className="relative h-full flex flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <Icon className="w-5 h-5 text-white/70 group-hover:text-white/90 transition-colors" />
          {isActive && (
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
        </div>
        <div className="text-left">
          <p className="text-white text-xs font-semibold leading-tight">{genre}</p>
          <p className="text-white/50 text-[10px] mt-0.5">{count} stations</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Small icon not used yet — use a simple Radio icon for "All"
function Grid2x2(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// SIGNAL STRENGTH INDICATOR
// ═══════════════════════════════════════════════════════

function SignalStrength({ bitrate }: { bitrate: number }) {
  const bars = bitrate >= 320 ? 4 : bitrate >= 192 ? 3 : bitrate >= 128 ? 2 : 1;
  return (
    <div className="flex items-end gap-[1px] h-3">
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={cn(
            'w-[2px] rounded-full transition-colors',
            b <= bars ? 'bg-emerald-400' : 'bg-muted-foreground/20'
          )}
          style={{ height: `${b * 25}%` }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NOW PLAYING HERO — immersive live station card
// ═══════════════════════════════════════════════════════

function NowPlayingHero({
  station,
  onStop,
}: {
  station: RadioStation;
  onStop: () => void;
}) {
  const conf = getGenreConf(station.genre);
  const flag = countryCodeToFlag(station.countryCode);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl transition-all duration-500',
      'bg-gradient-to-br', conf.gradient
    )}>
      {/* Animated glow */}
      <div className="absolute -inset-4 bg-gradient-to-br opacity-30 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.07] bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjIiLz48L3N2Zz4=\')]" />

      {/* Content */}
      <div className="relative px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Animated equalizer */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <AnimatedEqualizer
                barCount={12}
                height="h-8 sm:h-10"
                gap="gap-[2px]"
                barWidth="w-[2.5px]"
                color="bg-white"
                active={true}
              />
            </div>
            <div className="absolute -inset-1 rounded-2xl border border-white/20 animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-red-500/90 text-white border-0 text-[10px] font-bold uppercase tracking-wider animate-pulse h-5 px-2">
                On Air
              </Badge>
              <span className="text-white/50 text-xs">Listening for {formatElapsed(elapsed)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{station.name}</h2>
            <p className="text-white/60 text-sm mt-0.5 truncate">{station.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <SignalStrength bitrate={station.bitrate} />
                <span className="ml-1">{station.codec} {station.bitrate}kbps</span>
              </span>
              {flag && (
                <span className="text-xs text-white/40">{flag} {station.country}</span>
              )}
              {station.source && (
                <Badge variant="outline" className="text-[10px] border-white/20 text-white/60 bg-white/5 px-2 py-0">
                  {station.source}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            {station.genre}
          </Badge>
          <Button
            onClick={onStop}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm gap-2 px-5 h-11 rounded-full transition-all hover:scale-105"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </Button>
        </div>
      </div>

      {/* Animated shimmer bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
          style={{
            animation: 'shimmer 2.5s ease-in-out infinite',
            width: '50%',
          }}
        />
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SOMAFM SHOWCASE CARD — enhanced
// ═══════════════════════════════════════════════════════

function SomaFMShowcaseCard({
  station,
  isPlaying,
  onPlay,
  onToggleFavorite,
}: {
  station: RadioStation;
  isPlaying: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
}) {
  const conf = getGenreConf(station.genre);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer',
        'hover:shadow-xl hover:-translate-y-0.5',
        isPlaying && 'ring-1 ring-primary/50 shadow-xl shadow-primary/10'
      )}
      onClick={onPlay}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-[0.12]', conf.gradient)} />
      <CardContent className="p-4 relative">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center relative',
            conf.gradient, 'shadow-lg', conf.glow
          )}>
            {isPlaying ? (
              <AnimatedEqualizer barCount={6} height="h-6" gap="gap-[2px]" barWidth="w-[2px]" color="bg-white" active />
            ) : (
              <Waves className="w-5 h-5 text-white/80" />
            )}
            {isPlaying && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {station.name}
              </h3>
              {isPlaying && (
                <AnimatedEqualizer barCount={4} height="h-3" gap="gap-[1.5px]" barWidth="w-[1.5px]" className="flex-shrink-0" active />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {station.description}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {station.genre}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <SignalStrength bitrate={station.bitrate} />
                {station.bitrate}kbps
              </span>
              {station.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] text-muted-foreground/60">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-colors',
                  station.isFavorite
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-muted-foreground hover:text-rose-400'
                )}
              />
            </Button>
            <Button
              variant={isPlaying ? 'destructive' : 'default'}
              size="icon"
              className="h-8 w-8 rounded-full shadow-sm"
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
            >
              {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// STATION LIST ITEM — enhanced
// ═══════════════════════════════════════════════════════

function StationListItem({
  station,
  isPlaying,
  index,
  onPlay,
  onToggleFavorite,
}: {
  station: RadioStation;
  isPlaying: boolean;
  index: number;
  onPlay: () => void;
  onToggleFavorite: () => void;
}) {
  const conf = getGenreConf(station.genre);
  const flag = countryCodeToFlag(station.countryCode);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
        'hover:bg-accent/50 hover:shadow-sm',
        isPlaying && 'bg-primary/[0.06] shadow-sm shadow-primary/5 ring-1 ring-primary/15'
      )}
      onClick={onPlay}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center relative transition-transform group-hover:scale-105',
        conf.gradient, isPlaying && 'shadow-lg', conf.glow
      )}>
        {isPlaying ? (
          <AnimatedEqualizer barCount={6} height="h-5" gap="gap-[2px]" barWidth="w-[2px]" color="bg-white" active />
        ) : (
          <Radio className="w-4 h-4 text-white/80" />
        )}
        {isPlaying && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {station.name}
          </h3>
          {isPlaying && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 animate-pulse font-bold">
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {station.genre}
          </Badge>
          {flag && (
            <span className="text-[11px]">{flag}</span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <SignalStrength bitrate={station.bitrate} />
            {station.bitrate}kbps
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] px-1.5 py-0',
              station.source === 'iHeartRadio' && 'border-rose-500/40 text-rose-400',
              station.source === 'Local FM' && 'border-sky-500/40 text-sky-400',
              station.source === 'SomaFM' && 'border-orange-500/40 text-orange-400',
              station.source === 'Public Radio' && 'border-emerald-500/40 text-emerald-400',
            )}
          >
            {station.source}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              station.isFavorite
                ? 'fill-rose-500 text-rose-500'
                : 'text-muted-foreground hover:text-rose-400'
            )}
          />
        </Button>
        <Button
          variant={isPlaying ? 'destructive' : 'default'}
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full transition-all',
            isPlaying ? 'shadow-sm shadow-red-500/20' : 'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
        >
          {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// QUICK PICKS — horizontal featured station row
// ═══════════════════════════════════════════════════════

function QuickPicksRow({
  stations,
  currentRadioStationId,
  isPlaying,
  playbackMode,
  onPlay,
}: {
  stations: RadioStation[];
  currentRadioStationId: string | null;
  isPlaying: boolean;
  playbackMode: string;
  onPlay: (station: RadioStation) => void;
}) {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
        {stations.map(station => {
          const conf = getGenreConf(station.genre);
          const active = playbackMode === 'radio' && currentRadioStationId === station.id && isPlaying;
          return (
            <button
              key={station.id}
              onClick={() => onPlay(station)}
              className={cn(
                'flex-shrink-0 w-[170px] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer text-left',
                'hover:scale-[1.04] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40',
                active && 'ring-2 ring-primary scale-[1.04] shadow-lg shadow-primary/10'
              )}
            >
              <div className={cn('relative h-[95px] bg-gradient-to-br', conf.gradient)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 opacity-[0.06] bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==\')]" />

                <div className="absolute top-3 left-3">
                  {active ? (
                    <AnimatedEqualizer barCount={4} height="h-4" gap="gap-[1.5px]" barWidth="w-[2px]" color="bg-white" active />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                  )}
                </div>

                {active && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500/90 text-white border-0 text-[9px] h-4 px-1.5 animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold truncate">{station.name}</p>
                  <p className="text-white/50 text-[10px] truncate">{station.genre}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="absolute top-0 right-0 bottom-3 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN RADIO VIEW
// ═══════════════════════════════════════════════════════

const PAGE_SIZE = 50;

export function RadioView() {
  const { currentRadioStationId, isPlaying, playbackMode, playRadioStation, stopRadio } = usePlayerStore();
  const { searchQuery: globalSearch } = useUIStore();

  // Local state
  const [localSearch, setLocalSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('az');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  // Debounced search
  const debouncedSearch = useDebouncedValue(localSearch, 300);
  const activeSearch = globalSearch || debouncedSearch;

  // Static data
  const allGenres = useMemo(() => getRadioGenres(), []);
  const allCountries = useMemo(() => getRadioCountries(), []);
  const allSources = useMemo(() => getRadioSources(), []);
  const totalStationCount = internetRadioStations.length;

  // Genre counts
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of internetRadioStations) {
      counts[s.genre] = (counts[s.genre] || 0) + 1;
    }
    return counts;
  }, []);

  // SomaFM stations
  const somaFMStations = useMemo(
    () => internetRadioStations.filter(s => s.source === 'SomaFM' && parseInt(s.id.replace('radio-', '')) <= 24),
    []
  );

  // Featured stations — handpicked diverse selection
  const featuredStations = useMemo(() => {
    const picks = [
      'radio-1',  // Groove Salad
      'radio-2',  // Drone Zone
      'radio-5',  // Secret Agent
      'radio-10', // DEF CON
      'radio-14', // Indie Pop Rocks
      'radio-33', // KEXP
      'radio-34', // KCRW
      'radio-35', // WFMU
      'radio-25', // BBC World Service
      'radio-27', // Swiss Classic
    ];
    return picks.map(id => internetRadioStations.find(s => s.id === id)).filter(Boolean) as RadioStation[];
  }, []);

  // Filtered & sorted stations
  const filteredStations = useMemo(() => {
    let result: RadioStation[];

    if (activeSearch.trim()) {
      result = searchRadioStations(activeSearch.trim());
    } else {
      result = [...internetRadioStations];
    }

    result = result.filter(s => !(s.source === 'SomaFM' && parseInt(s.id.replace('radio-', '')) <= 24));

    if (genreFilter !== 'all') result = result.filter(s => s.genre === genreFilter);
    if (countryFilter !== 'all') result = result.filter(s => s.countryCode === countryFilter);
    if (sourceFilter !== 'all') result = result.filter(s => s.source === sourceFilter);
    if (showFavoritesOnly) {
      const favStations = getFavoriteRadioStations();
      const favIds = new Set(favStations.map(s => s.id));
      result = result.filter(s => favIds.has(s.id));
    }

    result = sortStations(result, sortOption);
    return result;
  }, [activeSearch, genreFilter, countryFilter, sourceFilter, sortOption, showFavoritesOnly, favoritesVersion]);

  const visibleStations = useMemo(
    () => filteredStations.slice(0, visibleCount),
    [filteredStations, visibleCount]
  );

  const hasMore = visibleCount < filteredStations.length;

  // Handlers
  const handlePlayStation = useCallback((station: RadioStation) => {
    if (playbackMode === 'radio' && currentRadioStationId === station.id && isPlaying) {
      stopRadio();
    } else {
      playRadioStation(station.id, station.name, station.streamUrl, station.genre);
    }
  }, [playbackMode, currentRadioStationId, isPlaying, playRadioStation, stopRadio]);

  const handleToggleFavorite = useCallback((stationId: string) => {
    toggleRadioFavorite(stationId);
    setFavoritesVersion(v => v + 1);
  }, []);

  const handleGenreChipClick = useCallback((genre: string) => {
    setGenreFilter(prev => prev === genre ? 'all' : genre);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => setVisibleCount(prev => prev + PAGE_SIZE), []);
  const handleSearchChange = useCallback((value: string) => { setLocalSearch(value); setVisibleCount(PAGE_SIZE); }, []);
  const handleSortChange = useCallback((val: string) => { setSortOption(val as SortOption); setVisibleCount(PAGE_SIZE); }, []);
  const handleGenreFilterChange = useCallback((val: string) => { setGenreFilter(val); setVisibleCount(PAGE_SIZE); }, []);
  const handleCountryFilterChange = useCallback((val: string) => { setCountryFilter(val); setVisibleCount(PAGE_SIZE); }, []);
  const handleSourceFilterChange = useCallback((val: string) => { setSourceFilter(val); setVisibleCount(PAGE_SIZE); }, []);

  // Currently playing station
  const currentlyPlayingStation = useMemo(() => {
    if (playbackMode !== 'radio' || !currentRadioStationId) return null;
    return internetRadioStations.find(s => s.id === currentRadioStationId) || null;
  }, [playbackMode, currentRadioStationId]);

  const isDefaultView = !showFavoritesOnly && !activeSearch.trim() && genreFilter === 'all' && countryFilter === 'all' && sourceFilter === 'all';

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* ═══ HERO HEADER ═══ */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-900 via-orange-900 to-amber-900 flex items-center justify-center shadow-lg shadow-rose-900/20">
                <Antenna className="w-6 h-6 text-rose-200" />
              </div>
              <div className="absolute -inset-2 rounded-2xl border border-rose-500/10 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">Internet Radio</h1>
                <Badge variant="secondary" className="font-normal text-xs">
                  {totalStationCount} stations
                </Badge>
                <Badge variant="outline" className="font-normal text-xs gap-1">
                  <Signal className="w-3 h-3" />
                  Live
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                SomaFM, public radio, iHeartRadio, local FM & community stations worldwide
              </p>
            </div>
          </div>
        </div>

        {/* ═══ NOW PLAYING HERO ═══ */}
        {currentlyPlayingStation && isPlaying && (
          <NowPlayingHero
            station={currentlyPlayingStation}
            onStop={stopRadio}
          />
        )}

        {/* ═══ SEARCH BAR ═══ */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search stations by name, genre, country, or tags..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 h-12 text-base bg-card border-border focus-visible:ring-primary/30 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ═══ GENRE CAROUSEL ═══ */}
        {isDefaultView && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Browse by Genre</h2>
            </div>
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                <GenreCard
                  genre="All"
                  count={totalStationCount}
                  isActive={genreFilter === 'all'}
                  onClick={() => handleGenreChipClick('all')}
                />
                {allGenres.slice(0, 24).map((genre) => (
                  <GenreCard
                    key={genre}
                    genre={genre}
                    count={genreCounts[genre] || 0}
                    isActive={genreFilter === genre}
                    onClick={() => handleGenreChipClick(genre)}
                  />
                ))}
              </div>
              <div className="absolute top-0 right-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* ═══ FEATURED STATIONS ═══ */}
        {isDefaultView && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Featured Stations</h2>
              </div>
              <span className="text-xs text-muted-foreground">Handpicked for you</span>
            </div>
            <QuickPicksRow
              stations={featuredStations}
              currentRadioStationId={currentRadioStationId}
              isPlaying={isPlaying}
              playbackMode={playbackMode}
              onPlay={handlePlayStation}
            />
          </div>
        )}

        {/* ═══ FILTER BAR ═══ */}
        {(activeSearch.trim() || !isDefaultView) && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={genreFilter} onValueChange={handleGenreFilterChange}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {allGenres.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {allCountries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-1.5">
                      <span>{countryCodeToFlag(c.code)}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {allSources.map((src) => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="az"><span className="flex items-center gap-1"><ArrowDownAZ className="w-3 h-3" />A-Z</span></SelectItem>
                <SelectItem value="za"><span className="flex items-center gap-1"><ArrowUpAZ className="w-3 h-3" />Z-A</span></SelectItem>
                <SelectItem value="country"><span className="flex items-center gap-1"><Globe className="w-3 h-3" />Country</span></SelectItem>
                <SelectItem value="genre"><span className="flex items-center gap-1"><Filter className="w-3 h-3" />Genre</span></SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => { setShowFavoritesOnly(prev => !prev); setVisibleCount(PAGE_SIZE); }}
            >
              <Heart className={cn('w-3.5 h-3.5', showFavoritesOnly && 'fill-current')} />
              Favorites
            </Button>

            {(activeSearch.trim() || genreFilter !== 'all' || countryFilter !== 'all' || showFavoritesOnly) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setLocalSearch('');
                  setGenreFilter('all');
                  setCountryFilter('all');
                  setSourceFilter('all');
                  setShowFavoritesOnly(false);
                  setSortOption('az');
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* ═══ SOMAFM SECTION ═══ */}
        {isDefaultView && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-700 to-rose-700 flex items-center justify-center">
                  <Waves className="w-3 h-3 text-orange-200" />
                </div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">SomaFM — Listener Supported</h2>
                <Badge variant="outline" className="text-[10px] font-normal border-orange-500/30 text-orange-400">
                  {somaFMStations.length} channels
                </Badge>
              </div>
              <a
                href="https://somafm.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-orange-400 flex items-center gap-1 transition-colors"
              >
                somafm.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {somaFMStations.map((station) => (
                <SomaFMShowcaseCard
                  key={station.id}
                  station={station}
                  isPlaying={playbackMode === 'radio' && currentRadioStationId === station.id && isPlaying}
                  onPlay={() => handlePlayStation(station)}
                  onToggleFavorite={() => handleToggleFavorite(station.id)}
                />
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* ═══ RESULTS COUNT ═══ */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="text-foreground font-medium">{Math.min(visibleCount, filteredStations.length)}</span>
            {' '}of{' '}
            <span className="text-foreground font-medium">{filteredStations.length}</span>
            {' '}stations
          </p>
        </div>

        {/* ═══ STATION LIST ═══ */}
        {filteredStations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Antenna className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium mb-1">No stations found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => {
              setLocalSearch('');
              setGenreFilter('all');
              setCountryFilter('all');
              setSourceFilter('all');
              setShowFavoritesOnly(false);
              setSortOption('az');
              setVisibleCount(PAGE_SIZE);
            }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleStations.map((station, idx) => (
              <StationListItem
                key={station.id}
                station={station}
                isPlaying={playbackMode === 'radio' && currentRadioStationId === station.id && isPlaying}
                index={idx}
                onPlay={() => handlePlayStation(station)}
                onToggleFavorite={() => handleToggleFavorite(station.id)}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4 pb-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2 rounded-full px-6"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More
                  <span className="text-muted-foreground text-xs">
                    ({filteredStations.length - visibleCount} remaining)
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
