'use client';

import React, { useState, useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore } from '@/store/local-library';
import { getCoverGradient, formatDuration } from '@/lib/data';
import type { EditorialCollection } from '@/lib/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Play, Clock, Disc3, Calendar, User, Music,
  ListMusic, Star, Sparkles, Newspaper, Trophy, BookOpen,
  Users, CalendarDays, ChevronRight,
} from 'lucide-react';

const typeConfig: Record<EditorialCollection['type'], { label: string; color: string; bgClass: string; icon: typeof Star }> = {
  'new-releases': { label: 'New Release', color: 'text-primary', bgClass: 'bg-primary/15 border-primary/30 text-primary', icon: Sparkles },
  'genre-primer': { label: 'Genre Primer', color: 'text-blue-400', bgClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400', icon: BookOpen },
  'best-of': { label: 'Best Of', color: 'text-yellow-400', bgClass: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', icon: Trophy },
  'curated': { label: 'Curated', color: 'text-purple-400', bgClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400', icon: ListMusic },
  'staff-picks': { label: 'Staff Picks', color: 'text-green-400', bgClass: 'bg-green-500/15 border-green-500/30 text-green-400', icon: Users },
  'on-this-day': { label: 'On This Day', color: 'text-amber-400', bgClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: CalendarDays },
};

type TabKey = 'all' | 'featured' | 'new-releases' | 'genre-primer' | 'best-of' | 'staff-picks';

export function EditorialView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const [selectedTab, setSelectedTab] = useState<TabKey>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(viewParams.collectionId || null);

  const localStore = useLocalLibraryStore();
  const localTracks = localStore.tracks;

  // Helper to convert local track to playable Track
  function localTrackToTrack(lt: any): import('@/lib/data').Track {
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
      source: 'local',
      isAvailable: true,
      blobUrl: lt.blobUrl,
    };
  }

  const editorialCollections = useMemo(() => {
    const albums = localStore.getAlbums();
    const artists = localStore.getArtists();
    const allTrackIds = localTracks.map(t => t.id);
    const allAlbumIds = albums.map(a => a.id);

    const today = new Date().toISOString().slice(0, 10);

    const collections: EditorialCollection[] = [];

    // New Releases - tracks added recently (by index as proxy)
    if (localTracks.length > 0) {
      const recentTracks = localTracks.slice(0, Math.min(20, localTracks.length));
      const recentAlbumIds = [...new Set(recentTracks.map(t => t.album))];
      collections.push({
        id: 'ed-recent',
        title: 'Recently Added',
        subtitle: 'Your latest library additions',
        description: 'The most recently imported tracks and albums in your library. Refresh your memory with what you just added — these tracks are sorted by import order, capturing your latest musical discoveries and acquisitions across all genres and formats.',
        type: 'new-releases',
        coverUrl: '',
        curator: 'DSP Library',
        trackIds: recentTracks.map(t => t.id),
        albumIds: recentAlbumIds,
        tags: ['recent', 'new', 'library'],
        publishedAt: today,
        featured: true,
      });
    }

    // Genre Primers
    const genres = [...new Set(localTracks.map(t => t.genre).filter(Boolean))];
    for (const genre of genres.slice(0, 5)) {
      const genreTracks = localTracks.filter(t => t.genre === genre);
      const genreAlbumIds = [...new Set(genreTracks.map(t => t.album))];
      collections.push({
        id: `ed-genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: `${genre} Primer`,
        subtitle: `Explore ${genre} in your library`,
        description: `A curated introduction to the ${genre} genre, featuring tracks from your library. This collection showcases the breadth and depth of your ${genre} collection, from essential classics to hidden gems that define the genre's evolution and character.`,
        type: 'genre-primer',
        coverUrl: '',
        curator: 'DSP Editorial',
        trackIds: genreTracks.slice(0, 30).map(t => t.id),
        albumIds: genreAlbumIds.slice(0, 10),
        tags: [genre.toLowerCase(), 'genre-primer', 'exploration'],
        publishedAt: today,
        featured: false,
      });
    }

    // Best Of - by artist track count
    if (localTracks.length > 0) {
      const artistCounts = new Map<string, number>();
      for (const t of localTracks) {
        artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
      }
      const topArtists = [...artistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [artist, count] of topArtists) {
        const artistTracks = localTracks.filter(t => t.artist === artist);
        const artistAlbumIds = [...new Set(artistTracks.map(t => t.album))];
        collections.push({
          id: `ed-best-${artist.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: `Best of ${artist}`,
          subtitle: `${count} tracks in your library`,
          description: `The essential ${artist} tracks from your collection. This compilation brings together the defining works that make ${artist} a cornerstone of your music library, spanning multiple albums and eras of their artistic career.`,
          type: 'best-of',
          coverUrl: '',
          curator: 'DSP Editorial',
          trackIds: artistTracks.map(t => t.id),
          albumIds: artistAlbumIds,
          tags: ['best-of', artist.toLowerCase(), 'essential'],
          publishedAt: today,
          featured: count > 5,
        });
      }
    }

    // Staff Picks - random selection
    if (localTracks.length > 3) {
      const shuffled = [...localTracks].sort(() => Math.random() - 0.5);
      const picks = shuffled.slice(0, Math.min(15, shuffled.length));
      const pickAlbumIds = [...new Set(picks.map(t => t.album))];
      collections.push({
        id: 'ed-staff-picks',
        title: 'Staff Picks',
        subtitle: 'Handpicked tracks from your library',
        description: 'A handpicked selection of outstanding tracks from your library. These picks span genres and eras, chosen for their exceptional recording quality, musical merit, and lasting listenability. Perfect for discovering forgotten gems in your collection.',
        type: 'staff-picks',
        coverUrl: '',
        curator: 'DSP Staff',
        trackIds: picks.map(t => t.id),
        albumIds: pickAlbumIds,
        tags: ['picks', 'curated', 'discovery'],
        publishedAt: today,
        featured: true,
      });
    }

    // Full Library collection
    if (localTracks.length > 0) {
      collections.push({
        id: 'ed-full-library',
        title: 'Complete Library',
        subtitle: `${localTracks.length} tracks across ${albums.length} albums`,
        description: 'Your entire music library in one collection. Browse through every track and album you have imported, spanning all genres, artists, and formats. This is your personal music universe — explore it freely.',
        type: 'curated',
        coverUrl: '',
        curator: 'DSP System',
        trackIds: allTrackIds,
        albumIds: allAlbumIds,
        tags: ['library', 'complete', 'all'],
        publishedAt: today,
        featured: false,
      });
    }

    // HiFi Favorites - highest quality tracks
    const hifiTracks = localTracks.filter(t => t.bitDepth >= 24 || t.sampleRate >= 88200);
    if (hifiTracks.length > 0) {
      const hifiAlbumIds = [...new Set(hifiTracks.map(t => t.album))];
      collections.push({
        id: 'ed-hifi',
        title: 'HiFi Collection',
        subtitle: `${hifiTracks.length} high-resolution tracks`,
        description: 'The finest audio quality in your library. These tracks feature high-resolution formats (24-bit or above, 88.2kHz or above), delivering the full fidelity of the original recording. Best enjoyed with critical listening on your HiFi system.',
        type: 'curated',
        coverUrl: '',
        curator: 'DSP Audio Lab',
        trackIds: hifiTracks.map(t => t.id),
        albumIds: hifiAlbumIds,
        tags: ['hifi', 'high-res', 'audiophile', 'lossless'],
        publishedAt: today,
        featured: true,
      });
    }

    return collections;
  }, [localTracks, localStore]);

  // Filter by tab
  const filteredCollections = useMemo(() => {
    if (selectedTab === 'all') return editorialCollections;
    if (selectedTab === 'featured') return editorialCollections.filter(c => c.featured);
    return editorialCollections.filter(c => c.type === selectedTab);
  }, [editorialCollections, selectedTab]);

  const featuredCollections = useMemo(
    () => editorialCollections.filter(c => c.featured),
    [editorialCollections]
  );

  const activeCollection = selectedCollection
    ? editorialCollections.find(c => c.id === selectedCollection) ?? null
    : null;

  const collectionTracks = useMemo((): import('@/lib/data').Track[] => {
    if (!activeCollection) return [];
    return activeCollection.trackIds
      .map(id => localTracks.find(t => t.id === id))
      .filter(Boolean)
      .map(t => localTrackToTrack(t!));
  }, [activeCollection, localTracks]);

  const collectionAlbums = useMemo((): { id: string; title: string; artistName: string; year: number }[] => {
    if (!activeCollection) return [];
    const albumMap = new Map<string, { id: string; title: string; artistName: string; year: number }>();
    for (const trackId of activeCollection.albumIds) {
      const lt = localTracks.find(t => t.id === trackId || t.album === trackId);
      if (lt) {
        const key = lt.album;
        if (!albumMap.has(key)) {
          albumMap.set(key, { id: key, title: lt.album, artistName: lt.albumArtist || lt.artist, year: lt.year });
        }
      }
    }
    return [...albumMap.values()];
  }, [activeCollection, localTracks]);

  const playCollection = () => {
    if (collectionTracks.length > 0) setQueue(collectionTracks, 0);
  };

  const playTrack = (trackId: string) => {
    const lt = localTracks.find(t => t.id === trackId);
    if (lt) play(localTrackToTrack(lt));
  };

  const playAlbum = (albumId: string) => {
    const albumTracks = localTracks.filter(t => t.album === albumId);
    if (albumTracks.length > 0) setQueue(albumTracks.map(t => localTrackToTrack(t)), 0);
  };

  const openCollection = (id: string) => {
    setSelectedCollection(id);
  };

  const closeCollection = () => {
    setSelectedCollection(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ─── Detail View ───
  if (activeCollection) {
    const cfg = typeConfig[activeCollection.type];
    const TypeIcon = cfg.icon;

    return (
      <ScrollArea className="h-full">
        <div className="max-w-5xl mx-auto p-6">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={closeCollection}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections
          </Button>

          {/* Hero */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className={`w-48 h-48 md:w-56 md:h-56 rounded-xl bg-gradient-to-br ${getCoverGradient(activeCollection.id)} shadow-2xl flex-shrink-0`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={`text-xs ${cfg.bgClass}`}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {cfg.label}
                </Badge>
                {activeCollection.featured && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/15 border-yellow-500/30 text-yellow-400">
                    <Star className="w-3 h-3 mr-1" /> Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{activeCollection.title}</h1>
              <p className="text-muted-foreground mb-3">{activeCollection.subtitle}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {activeCollection.curator && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> {activeCollection.curator}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {formatDate(activeCollection.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4" /> {activeCollection.trackIds.length} tracks
                </span>
                <span className="flex items-center gap-1.5">
                  <Disc3 className="w-4 h-4" /> {activeCollection.albumIds.length} albums
                </span>
              </div>

              {collectionTracks.length > 0 && (
                <Button onClick={playCollection}>
                  <Play className="w-4 h-4 mr-2" /> Play All Tracks
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">About This Collection</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {activeCollection.description}
            </p>
          </section>

          {/* Tags */}
          {activeCollection.tags.length > 0 && (
            <section className="mb-8">
              <div className="flex flex-wrap gap-2">
                {activeCollection.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </section>
          )}

          <Separator className="my-6" />

          {/* Albums in Collection */}
          {collectionAlbums.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-primary" /> Albums
                </h2>
                <Badge variant="secondary" className="text-xs">{collectionAlbums.length}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collectionAlbums.map(album => album && (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => navigate('album-detail', { albumId: album.id })}
                  >
                    <div className="relative mb-2">
                      <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover shadow-lg`} />
                      <Button
                        variant="default"
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
                        onClick={(e) => { e.stopPropagation(); playAlbum(album.id); }}
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                    <p className="text-xs text-muted-foreground">{album.artistName} · {album.year}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tracks in Collection */}
          {collectionTracks.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" /> Tracks
                </h2>
                <Badge variant="secondary" className="text-xs">{collectionTracks.length}</Badge>
              </div>
              <div className="space-y-1">
                {collectionTracks.map((track, i) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors group ${
                        isCurrentTrack ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent/30'
                      }`}
                      onClick={() => playTrack(track.id)}
                    >
                      <span className="text-sm text-muted-foreground w-6 text-right tabular-nums">
                        {isCurrentTrack && isPlaying ? (
                          <span className="flex items-center justify-center gap-[2px] h-3 ml-auto">
                            <span className="w-[3px] h-2 bg-primary animate-pulse rounded-full" />
                            <span className="w-[3px] h-3 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
                            <span className="w-[3px] h-2.5 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
                          </span>
                        ) : (
                          <span className="group-hover:hidden">{i + 1}</span>
                        )}
                        <Play className={`w-3 h-3 text-primary ${isCurrentTrack ? 'hidden' : 'hidden group-hover:block'} ml-auto`} />
                      </span>
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-primary' : ''}`}>{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artistName} · {track.albumName}</p>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">{track.genre}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(track.duration)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    );
  }

  // ─── Grid View ───
  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Editorial</h1>
            <p className="text-sm text-muted-foreground mt-1">Curated collections, guides, and staff recommendations</p>
          </div>
          <Badge variant="secondary" className="text-xs">{editorialCollections.length} collections</Badge>
        </div>

        {/* Featured Hero Section */}
        {selectedTab === 'all' && featuredCollections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" /> Featured
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCollections.slice(0, 3).map((col, idx) => {
                const cfg = typeConfig[col.type];
                const TypeIcon = cfg.icon;
                const trackCount = col.trackIds.length;
                const albumCount = col.albumIds.length;
                return (
                  <Card
                    key={col.id}
                    className={`bg-card border-border cursor-pointer hover:bg-accent/30 transition-all group overflow-hidden ${idx === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                    onClick={() => openCollection(col.id)}
                  >
                    <div className={`h-32 bg-gradient-to-br ${getCoverGradient(col.id)} relative`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                      <Badge variant="outline" className={`absolute top-3 left-3 text-[10px] ${cfg.bgClass}`}>
                        <TypeIcon className="w-3 h-3 mr-1" /> {cfg.label}
                      </Badge>
                    </div>
                    <CardContent className="p-4 pt-2">
                      <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors truncate">{col.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{col.subtitle}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Music className="w-3 h-3" /> {trackCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Disc3 className="w-3 h-3" /> {albumCount}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(col.publishedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as TabKey)} className="mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="featured" className="text-xs">Featured</TabsTrigger>
            <TabsTrigger value="new-releases" className="text-xs">New Releases</TabsTrigger>
            <TabsTrigger value="genre-primer" className="text-xs">Genre Primers</TabsTrigger>
            <TabsTrigger value="best-of" className="text-xs">Best Of</TabsTrigger>
            <TabsTrigger value="staff-picks" className="text-xs">Staff Picks</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Newspaper className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Editorial content coming soon</p>
            <p className="text-xs mt-1">Curated collections, guides, and staff recommendations will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollections.map(col => {
              const cfg = typeConfig[col.type];
              const TypeIcon = cfg.icon;
              return (
                <Card
                  key={col.id}
                  className="bg-card border-border cursor-pointer hover:bg-accent/30 transition-all group"
                  onClick={() => openCollection(col.id)}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getCoverGradient(col.id)} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={`text-[10px] ${cfg.bgClass}`}>
                          <TypeIcon className="w-2.5 h-2.5 mr-0.5" /> {cfg.label}
                        </Badge>
                        {col.featured && (
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{col.title}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{col.subtitle}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {col.curator && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> <span className="truncate max-w-24">{col.curator}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(col.publishedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Music className="w-3 h-3" /> {col.trackIds.length} tracks</span>
                        <span className="flex items-center gap-1"><Disc3 className="w-3 h-3" /> {col.albumIds.length} albums</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-center flex-shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
