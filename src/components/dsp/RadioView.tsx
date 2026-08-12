'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { internetRadioStations, searchRadioStations, getRadioGenres, getRadioCountries, getFavoriteRadioStations, toggleRadioFavorite } from '@/lib/radio-stations';
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
  ChevronDown, ArrowDownAZ, ArrowUpAZ, ArrowUpDown,
  Filter, Waves
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// ANIMATED WAVEFORM
// ═══════════════════════════════════════════════════════

function AnimatedWaveform({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-[3px] h-6', className)}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          style={{
            animation: `radioWaveform 1.2s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes radioWaveform {
          0% { height: 4px; opacity: 0.4; }
          100% { height: 24px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GENRE-BASED GRADIENT COLORS
// ═══════════════════════════════════════════════════════

const genreGradients: Record<string, string> = {
  'Ambient': 'from-teal-600 to-cyan-700',
  'Lounge': 'from-purple-600 to-fuchsia-700',
  'Electronic': 'from-violet-600 to-purple-700',
  'Indie': 'from-orange-600 to-amber-700',
  'Chillout': 'from-sky-600 to-blue-700',
  'Country': 'from-yellow-700 to-orange-800',
  'Dubstep': 'from-red-700 to-rose-800',
  'Metal': 'from-zinc-700 to-slate-800',
  'Classical': 'from-amber-600 to-yellow-700',
  'Folk': 'from-emerald-600 to-green-700',
  "80s": 'from-pink-600 to-rose-700',
  'Alternative': 'from-indigo-600 to-blue-700',
  '70s': 'from-orange-500 to-red-600',
  'Reggae': 'from-lime-600 to-green-700',
  'World': 'from-teal-500 to-emerald-600',
  'Holiday': 'from-red-600 to-green-700',
  'Eclectic': 'from-fuchsia-600 to-pink-700',
  'Celtic': 'from-green-600 to-teal-700',
  'Trance': 'from-blue-600 to-indigo-700',
  'Lo-Fi': 'from-stone-500 to-zinc-600',
  'Pop': 'from-pink-500 to-fuchsia-600',
  'Rock': 'from-red-600 to-orange-700',
  'Jazz': 'from-amber-700 to-orange-800',
  'Blues': 'from-blue-800 to-indigo-900',
  'Hip Hop': 'from-yellow-500 to-amber-600',
  'R&B': 'from-purple-700 to-fuchsia-800',
  'Latin': 'from-orange-600 to-red-700',
  'Reggaeton': 'from-yellow-600 to-orange-700',
  'News/Talk': 'from-slate-600 to-zinc-700',
  'Talk': 'from-slate-600 to-zinc-700',
  'Adult Contemporary': 'from-sky-500 to-cyan-600',
  'Dance': 'from-fuchsia-500 to-pink-600',
  'House': 'from-violet-500 to-purple-600',
  'Techno': 'from-gray-600 to-zinc-700',
  'Dub': 'from-green-700 to-emerald-800',
};

function getGenreGradient(genre: string): string {
  return genreGradients[genre] || 'from-zinc-600 to-zinc-700';
}

// ═══════════════════════════════════════════════════════
// COUNTRY FLAG EMOJIS
// ═══════════════════════════════════════════════════════

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const c = code.toUpperCase();
  // Convert country code to flag emoji using regional indicator symbols
  const base = 0x1F1E6 - 65; // 'A' = 65, regional indicator for A = U+1F1E6
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
// SomaFM FEATURED CARD
// ═══════════════════════════════════════════════════════

function SomaFMCard({
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
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer',
        isPlaying && 'ring-1 ring-primary/60 shadow-lg shadow-primary/10'
      )}
      onClick={onPlay}
    >
      {/* SomaFM branded gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-rose-900/20 to-transparent pointer-events-none" />
      <CardContent className="p-3 relative">
        <div className="flex items-center gap-3">
          {/* SomaFM Logo area */}
          <div className={cn(
            'w-12 h-12 rounded-lg bg-gradient-to-br flex-shrink-0 flex items-center justify-center relative',
            getGenreGradient(station.genre)
          )}>
            <Waves className="w-5 h-5 text-white/80" />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {station.name}
              </h3>
              {isPlaying && <AnimatedWaveform className="h-4" />}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {station.description}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {station.genre}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {station.codec} {station.bitrate}kbps
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
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
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// STATION LIST ITEM
// ═══════════════════════════════════════════════════════

function StationListItem({
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
  const gradient = getGenreGradient(station.genre);
  const flag = countryCodeToFlag(station.countryCode);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent/40 cursor-pointer',
        isPlaying && 'bg-primary/5 border border-primary/20'
      )}
      onClick={onPlay}
    >
      {/* Radio icon with genre color */}
      <div className={cn(
        'w-10 h-10 rounded-md bg-gradient-to-br flex-shrink-0 flex items-center justify-center relative',
        gradient
      )}>
        {isPlaying ? (
          <AnimatedWaveform className="h-5" />
        ) : (
          <Radio className="w-4 h-4 text-white/80" />
        )}
      </div>

      {/* Station Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {station.name}
          </h3>
          {isPlaying && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {station.genre}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
            {flag} {station.countryCode}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Signal className="w-2.5 h-2.5" />
            {station.codec} {station.bitrate}kbps
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
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
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
      </div>
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
  const [sortOption, setSortOption] = useState<SortOption>('az');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  // Debounced search
  const debouncedSearch = useDebouncedValue(localSearch, 300);

  // Use global search or local search
  const activeSearch = globalSearch || debouncedSearch;

  // Static data — computed once
  const allGenres = useMemo(() => getRadioGenres(), []);
  const topGenres = useMemo(() => allGenres.slice(0, 20), [allGenres]);
  const allCountries = useMemo(() => getRadioCountries(), []);
  const totalStationCount = internetRadioStations.length;

  // SomaFM stations
  const somaFMStations = useMemo(
    () => internetRadioStations.filter(s => s.id.startsWith('sfm-')),
    []
  );

  // Filtered & sorted stations
  const filteredStations = useMemo(() => {
    let result: RadioStation[];

    // Start with search results or all stations
    if (activeSearch.trim()) {
      result = searchRadioStations(activeSearch.trim());
    } else {
      result = [...internetRadioStations];
    }

    // Filter out SomaFM from main list (shown separately)
    result = result.filter(s => !s.id.startsWith('sfm-'));

    // Genre filter
    if (genreFilter !== 'all') {
      result = result.filter(s => s.genre === genreFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      result = result.filter(s => s.countryCode === countryFilter);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      const favStations = getFavoriteRadioStations();
      const favIds = new Set(favStations.map(s => s.id));
      result = result.filter(s => favIds.has(s.id));
    }

    // Sort
    result = sortStations(result, sortOption);

    return result;
  }, [activeSearch, genreFilter, countryFilter, sortOption, showFavoritesOnly, favoritesVersion]);

  // Paginated visible stations
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

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSortChange = useCallback((val: string) => {
    setSortOption(val as SortOption);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleGenreFilterChange = useCallback((val: string) => {
    setGenreFilter(val);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleCountryFilterChange = useCallback((val: string) => {
    setCountryFilter(val);
    setVisibleCount(PAGE_SIZE);
  }, []);



  // Currently playing station info
  const currentlyPlayingStation = useMemo(() => {
    if (playbackMode !== 'radio' || !currentRadioStationId) return null;
    return internetRadioStations.find(s => s.id === currentRadioStationId) || null;
  }, [playbackMode, currentRadioStationId]);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-900 to-orange-900 flex items-center justify-center">
            <Radio className="w-5 h-5 text-rose-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Internet Radio</h1>
              <Badge variant="secondary" className="font-normal">
                {totalStationCount} stations
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">1000+ stations from around the world</p>
          </div>
          {/* Currently playing indicator in header */}
          {currentlyPlayingStation && isPlaying && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <AnimatedWaveform className="h-4" />
              <span className="text-xs font-medium text-primary truncate max-w-[200px]">
                {currentlyPlayingStation.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={stopRadio}
              >
                <Square className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* ═══ SEARCH BAR ═══ */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search stations by name, genre, country, or tags..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 h-12 text-base bg-card border-border"
          />
        </div>

        {/* ═══ GENRE CHIPS ROW ═══ */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => handleGenreChipClick('all')}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                genreFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              All
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreChipClick(genre)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  genreFilter === genre
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                )}
              >
                {genre}
              </button>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>

        {/* ═══ FILTER BAR ═══ */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre Dropdown */}
          <Select value={genreFilter} onValueChange={handleGenreFilterChange}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {topGenres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Country Dropdown */}
          <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
            <SelectTrigger className="w-[170px] h-9">
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

          {/* Sort Dropdown */}
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">
                <span className="flex items-center gap-1.5">
                  <ArrowDownAZ className="w-3 h-3" /> A → Z
                </span>
              </SelectItem>
              <SelectItem value="za">
                <span className="flex items-center gap-1.5">
                  <ArrowUpAZ className="w-3 h-3" /> Z → A
                </span>
              </SelectItem>
              <SelectItem value="country">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Country
                </span>
              </SelectItem>
              <SelectItem value="genre">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Genre
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Favorites Toggle */}
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => {
              setShowFavoritesOnly(prev => !prev);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <Heart
              className={cn(
                'w-4 h-4',
                showFavoritesOnly && 'fill-current'
              )}
            />
            Favorites
          </Button>
        </div>

        {/* ═══ SOMAFM FEATURED SECTION ═══ */}
        {!showFavoritesOnly && !activeSearch.trim() && genreFilter === 'all' && countryFilter === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-semibold">SomaFM — Listener Supported</h2>
              <Badge variant="outline" className="text-[10px] font-normal">
                {somaFMStations.length} channels
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {somaFMStations.map((station) => (
                <SomaFMCard
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
          {(activeSearch.trim() || genreFilter !== 'all' || countryFilter !== 'all' || showFavoritesOnly) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setLocalSearch('');
                setGenreFilter('all');
                setCountryFilter('all');
                setShowFavoritesOnly(false);
                setSortOption('az');
                setVisibleCount(PAGE_SIZE);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* ═══ STATION LIST ═══ */}
        {filteredStations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Radio className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-1">No stations found</h3>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleStations.map((station) => (
              <StationListItem
                key={station.id}
                station={station}
                isPlaying={playbackMode === 'radio' && currentRadioStationId === station.id && isPlaying}
                onPlay={() => handlePlayStation(station)}
                onToggleFavorite={() => handleToggleFavorite(station.id)}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4 pb-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2"
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
