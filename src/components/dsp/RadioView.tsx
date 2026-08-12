'use client';

import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '@/store/player';
import { useDiscoveryStore } from '@/store/discovery';
import { tracks, artists, genres, playlists, getCoverGradient, formatDuration, getTrackById, getArtistById } from '@/lib/data';
import { radioStations as allRadioStations, generateRadio } from '@/lib/metadata';
import type { RadioSeed } from '@/lib/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Star, Search, Radio, Shuffle, Music, User, ListMusic, Globe, Signal, Clock, Zap } from 'lucide-react';

function AnimatedWaveform() {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          style={{
            animation: `waveform 1.2s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveform {
          0% { height: 4px; opacity: 0.4; }
          100% { height: 28px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function RadioView() {
  const { currentTrack, setQueue } = usePlayerStore();
  const {
    isRadioPlaying,
    currentRadioStation,
    currentGeneratedRadio,
    favoriteStationIds,
    playRadioStation,
    stopRadio,
    startRadioFrom,
    toggleStationFavorite,
  } = useDiscoveryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [seedType, setSeedType] = useState<'track' | 'artist' | 'genre' | 'playlist'>('track');
  const [selectedSeedId, setSelectedSeedId] = useState('');

  const allGenres = useMemo(() => {
    const g = new Set(allRadioStations.map(s => s.genre));
    return Array.from(g).sort();
  }, []);

  const favoriteStations = useMemo(
    () => allRadioStations.filter(s => favoriteStationIds.includes(s.id)),
    [favoriteStationIds]
  );

  const filteredStations = useMemo(() => {
    let result = allRadioStations.filter(s => !favoriteStationIds.includes(s.id));
    if (genreFilter !== 'all') {
      result = result.filter(s => s.genre === genreFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [searchQuery, genreFilter, favoriteStationIds]);

  const seedOptions = useMemo(() => {
    if (seedType === 'track') {
      return tracks.slice(0, 30).map(t => ({ id: t.id, name: `${t.title} — ${t.artistName}` }));
    }
    if (seedType === 'artist') {
      return artists.map(a => ({ id: a.id, name: a.name }));
    }
    if (seedType === 'genre') {
      return genres.map(g => ({ id: g.id, name: g.name }));
    }
    if (seedType === 'playlist') {
      return playlists.map(p => ({ id: p.id, name: p.name }));
    }
    return [];
  }, [seedType]);

  const handlePlayStation = (station: typeof allRadioStations[0]) => {
    if (isRadioPlaying && currentRadioStation?.id === station.id) {
      stopRadio();
    } else {
      playRadioStation(station);
    }
  };

  const handleStartFromCurrentTrack = () => {
    if (currentTrack) {
      startRadioFrom({ type: 'track', id: currentTrack.id, name: currentTrack.title });
    }
  };

  const handleStartFromArtist = () => {
    if (currentTrack) {
      const artist = getArtistById(currentTrack.artistId);
      if (artist) {
        startRadioFrom({ type: 'artist', id: artist.id, name: artist.name });
      }
    }
  };

  const handleCreateMix = () => {
    if (!selectedSeedId) return;
    const opt = seedOptions.find(o => o.id === selectedSeedId);
    if (!opt) return;
    startRadioFrom({ type: seedType, id: selectedSeedId, name: opt.name });
  };

  const generatedTracks = useMemo(() => {
    if (!currentGeneratedRadio) return [];
    return currentGeneratedRadio.trackIds
      .map(id => getTrackById(id))
      .filter(Boolean) as typeof tracks;
  }, [currentGeneratedRadio]);

  const handlePlayGeneratedTrack = (index: number) => {
    if (generatedTracks.length > 0) {
      setQueue(generatedTracks, index);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-900 to-orange-900 flex items-center justify-center">
            <Radio className="w-5 h-5 text-rose-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Radio</h1>
            <p className="text-sm text-muted-foreground">Internet radio & algorithmic mixes</p>
          </div>
        </div>

        <Tabs defaultValue="stations" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="stations">
              <Radio className="w-4 h-4 mr-2" />
              Stations
            </TabsTrigger>
            <TabsTrigger value="mix">
              <Shuffle className="w-4 h-4 mr-2" />
              Mix Radio
            </TabsTrigger>
            <TabsTrigger value="now-playing">
              <Signal className="w-4 h-4 mr-2" />
              Now Playing
            </TabsTrigger>
          </TabsList>

          {/* ═══ STATIONS TAB ═══ */}
          <TabsContent value="stations">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {allGenres.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Favorites Section */}
            {favoriteStations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Favorites
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {favoriteStations.map(station => (
                    <StationCard
                      key={station.id}
                      station={station}
                      isPlaying={isRadioPlaying && currentRadioStation?.id === station.id}
                      isFavorite
                      onPlay={() => handlePlayStation(station)}
                      onToggleFavorite={() => toggleStationFavorite(station.id)}
                    />
                  ))}
                </div>
                <Separator className="mt-6" />
              </div>
            )}

            {/* All Stations */}
            <h2 className="text-lg font-semibold mb-3">
              All Stations{genreFilter !== 'all' ? ` — ${genreFilter}` : ''}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredStations.length})
              </span>
            </h2>

            {filteredStations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No stations found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStations.map(station => (
                  <StationCard
                    key={station.id}
                    station={station}
                    isPlaying={isRadioPlaying && currentRadioStation?.id === station.id}
                    isFavorite={favoriteStationIds.includes(station.id)}
                    onPlay={() => handlePlayStation(station)}
                    onToggleFavorite={() => toggleStationFavorite(station.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ MIX RADIO TAB ═══ */}
          <TabsContent value="mix">
            {/* Quick Start Buttons */}
            <Card className="mb-6">
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Quick Start
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an algorithmic radio mix from your current listening context.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleStartFromCurrentTrack}
                    disabled={!currentTrack}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Start from Current Track
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleStartFromArtist}
                    disabled={!currentTrack}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Start from Current Artist
                  </Button>
                </div>
                {!currentTrack && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Play a track first to use quick start options.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Create Mix Section */}
            <Card className="mb-6">
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-emerald-400" />
                  Create Mix
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pick a seed to generate a personalized radio mix from your library.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Select
                    value={seedType}
                    onValueChange={(v) => {
                      setSeedType(v as RadioSeed['type']);
                      setSelectedSeedId('');
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="track">
                        <span className="flex items-center gap-2"><Music className="w-3 h-3" /> Track</span>
                      </SelectItem>
                      <SelectItem value="artist">
                        <span className="flex items-center gap-2"><User className="w-3 h-3" /> Artist</span>
                      </SelectItem>
                      <SelectItem value="genre">
                        <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> Genre</span>
                      </SelectItem>
                      <SelectItem value="playlist">
                        <span className="flex items-center gap-2"><ListMusic className="w-3 h-3" /> Playlist</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedSeedId} onValueChange={setSelectedSeedId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={`Select a ${seedType}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {seedOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleCreateMix} disabled={!selectedSeedId}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Radio Preview */}
            {currentGeneratedRadio && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCoverGradient(currentGeneratedRadio.id)} flex items-center justify-center`}>
                      <Shuffle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{currentGeneratedRadio.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Seeded from {currentGeneratedRadio.seed.name} ({currentGeneratedRadio.seed.type})
                      </p>
                    </div>
                    <AnimatedWaveform />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentGeneratedRadio.description}
                  </p>
                  <Separator className="mb-4" />
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    Track Preview
                    <Badge variant="secondary" className="text-xs">
                      {generatedTracks.length} tracks
                    </Badge>
                  </h4>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {generatedTracks.map((track, idx) => (
                      <button
                        key={track.id}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 text-left group"
                        onClick={() => handlePlayGeneratedTrack(idx)}
                      >
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {idx + 1}
                        </span>
                        <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.albumId)} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artistName} — {track.albumName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(track.duration)}
                        </span>
                        <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ NOW PLAYING TAB ═══ */}
          <TabsContent value="now-playing">
            {!isRadioPlaying ? (
              <div className="text-center py-16 text-muted-foreground">
                <Radio className="w-14 h-14 mx-auto mb-4 opacity-30" />
                <h2 className="text-lg font-semibold mb-2">Nothing Playing</h2>
                <p className="text-sm">Tune into a station or start a mix to begin listening.</p>
              </div>
            ) : currentRadioStation ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className={`w-40 h-40 rounded-xl bg-gradient-to-br ${getCoverGradient(currentRadioStation.id)} flex-shrink-0 flex items-center justify-center shadow-lg`}>
                      <Radio className="w-14 h-14 text-white/80" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AnimatedWaveform />
                        <Badge variant="destructive" className="text-xs">LIVE</Badge>
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{currentRadioStation.name}</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        {currentRadioStation.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{currentRadioStation.genre}</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Globe className="w-3 h-3" />
                          {currentRadioStation.country}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Signal className="w-3 h-3" />
                          {currentRadioStation.codec} / {currentRadioStation.bitrate}kbps
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentRadioStation.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="destructive" size="sm" onClick={stopRadio}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : currentGeneratedRadio ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className={`w-40 h-40 rounded-xl bg-gradient-to-br ${getCoverGradient(currentGeneratedRadio.id)} flex-shrink-0 flex items-center justify-center shadow-lg`}>
                      <Shuffle className="w-14 h-14 text-white/80" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AnimatedWaveform />
                        <Badge variant="secondary" className="text-xs">MIX RADIO</Badge>
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{currentGeneratedRadio.name}</h2>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentGeneratedRadio.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seed: {currentGeneratedRadio.seed.name} ({currentGeneratedRadio.seed.type})
                      </p>
                      <Button variant="destructive" size="sm" className="mt-4" onClick={stopRadio}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>

                  {generatedTracks.length > 0 && (
                    <>
                      <Separator className="mb-4" />
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Up Next
                      </h3>
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {generatedTracks.map((track, idx) => (
                          <button
                            key={track.id}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 text-left group"
                            onClick={() => handlePlayGeneratedTrack(idx)}
                          >
                            <span className="text-xs text-muted-foreground w-6 text-right">
                              {idx + 1}
                            </span>
                            <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.albumId)} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {track.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {track.artistName} — {track.albumName}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(track.duration)}
                            </span>
                            <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

// ─── Station Card Sub-component ───

function StationCard({
  station,
  isPlaying,
  isFavorite,
  onPlay,
  onToggleFavorite,
}: {
  station: typeof allRadioStations[0];
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Card className={`group transition-colors ${isPlaying ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getCoverGradient(station.id)} flex-shrink-0 flex items-center justify-center relative`}>
            <Radio className="w-6 h-6 text-white/70" />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {station.name}
              </h3>
              {isPlaying && <AnimatedWaveform />}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {station.description}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {station.genre}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Globe className="w-2.5 h-2.5" />
                {station.country}
              </span>
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
              <Star
                className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
              />
            </Button>
            <Button
              variant={isPlaying ? 'destructive' : 'default'}
              size="icon"
              className="h-8 w-8"
              onClick={onPlay}
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2 ml-[68px]">
          {station.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
