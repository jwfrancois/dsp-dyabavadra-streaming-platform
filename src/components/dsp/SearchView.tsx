'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { searchLibrary, formatDuration, getCoverGradient, tracks, getTrackById } from '@/lib/data';
import { searchPodcasts, formatEpisodeDuration, formatDate, podcastShows } from '@/lib/podcast-data';
import { fuzzySearch, composers, getComposerById, getWorkById, radioStations, genreDetails } from '@/lib/metadata';
import { usePodcastStore } from '@/store/podcast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Play, Users, Disc3, Music, X, Podcast, Rss, BookOpen, Radio, Mic, Music2, Clapperboard } from 'lucide-react';

export function SearchView() {
  const { navigate, searchQuery, setSearchQuery } = useUIStore();
  const { play } = usePlayerStore();
  const { playEpisode } = usePodcastStore();
  const [localQuery, setLocalQuery] = React.useState(searchQuery);
  const [showAllSections, setShowAllSections] = React.useState<Record<string, boolean>>({});

  // Use fuzzy search for enhanced results across all metadata
  const fuzzyResults = localQuery.length > 1 ? fuzzySearch(localQuery) : null;
  // Keep legacy search as fallback
  const legacyResults = localQuery.length > 1 ? searchLibrary(localQuery) : { artists: [], albums: [], tracks: [] };
  const podcastResults = localQuery.length > 1 ? searchPodcasts(localQuery) : { shows: [], episodes: [], iTunes: [] };

  const hasResults = fuzzyResults
    ? fuzzyResults.artists.length > 0 || fuzzyResults.albums.length > 0 || fuzzyResults.tracks.length > 0
      || fuzzyResults.composers.length > 0 || fuzzyResults.works.length > 0 || fuzzyResults.credits.length > 0
      || fuzzyResults.radioStations.length > 0 || fuzzyResults.genres.length > 0
      || podcastResults.shows.length > 0 || podcastResults.episodes.length > 0
    : legacyResults.artists.length > 0 || legacyResults.albums.length > 0 || legacyResults.tracks.length > 0
      || podcastResults.shows.length > 0 || podcastResults.episodes.length > 0;

  const toggleSection = (section: string) => {
    setShowAllSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Universal Search</h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search artists, albums, tracks, composers, credits, radio, podcasts..."
            value={localQuery}
            onChange={(e) => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }}
            className="pl-12 h-12 text-lg bg-card border-border rounded-xl"
            autoFocus
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search hint */}
        {!localQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">Start typing to search</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search across your library, streaming catalogs, composers, credits, radio stations, and podcasts
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['Beethoven', 'Jazz', 'Elias Richter', 'Ambient', 'FIP Radio'].map(suggestion => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => { setLocalQuery(suggestion); setSearchQuery(suggestion); }}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {localQuery && !hasResults && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or check spelling</p>
          </div>
        )}

        {fuzzyResults && (
          <>
            {/* Composers */}
            {fuzzyResults.composers.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Composers ({fuzzyResults.composers.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(showAllSections.composers ? fuzzyResults.composers : fuzzyResults.composers.slice(0, 6)).map(comp => {
                    const composer = getComposerById(comp.id);
                    return (
                      <div
                        key={comp.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                        onClick={() => navigate('composer-detail', { composerId: comp.id })}
                      >
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getCoverGradient(comp.id)} flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{comp.name}</p>
                          <p className="text-xs text-muted-foreground">{comp.period}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{composer?.nationality || ''}</Badge>
                      </div>
                    );
                  })}
                </div>
                {fuzzyResults.composers.length > 6 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggleSection('composers')}>
                    {showAllSections.composers ? 'Show less' : `Show all ${fuzzyResults.composers.length}`}
                  </Button>
                )}
              </section>
            )}

            {/* Works */}
            {fuzzyResults.works.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Music2 className="w-4 h-4" /> Works / Compositions ({fuzzyResults.works.length})
                </h2>
                <div className="space-y-1">
                  {(showAllSections.works ? fuzzyResults.works : fuzzyResults.works.slice(0, 8)).map(work => (
                    <div
                      key={work.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('work-detail', { workId: work.id })}
                    >
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(work.id)} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{work.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{work.composerName}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {fuzzyResults.works.length > 8 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggleSection('works')}>
                    {showAllSections.works ? 'Show less' : `Show all ${fuzzyResults.works.length}`}
                  </Button>
                )}
              </section>
            )}

            {/* Artists */}
            {fuzzyResults.artists.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Artists ({fuzzyResults.artists.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(showAllSections.artists ? fuzzyResults.artists : fuzzyResults.artists.slice(0, 8)).map(artist => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('artist-detail', { artistId: artist.id })}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                        <p className="text-xs text-muted-foreground">{artist.type === 'group' ? 'Group' : 'Solo'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {fuzzyResults.artists.length > 8 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggleSection('artists')}>
                    {showAllSections.artists ? 'Show less' : `Show all ${fuzzyResults.artists.length}`}
                  </Button>
                )}
              </section>
            )}

            {/* Albums */}
            {fuzzyResults.albums.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Disc3 className="w-4 h-4" /> Albums ({fuzzyResults.albums.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(showAllSections.albums ? fuzzyResults.albums : fuzzyResults.albums.slice(0, 8)).map(album => (
                    <div
                      key={album.id}
                      className="group cursor-pointer"
                      onClick={() => navigate('album-detail', { albumId: album.id })}
                    >
                      <div className="relative mb-2">
                        <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover`} />
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Podcast Shows */}
            {podcastResults.shows.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Podcast className="w-4 h-4" /> Podcast Shows ({podcastResults.shows.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {podcastResults.shows.map(show => (
                    <div
                      key={show.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('podcast-detail', { showId: show.id })}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCoverGradient(show.id)} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{show.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{show.author} · {show.episodeCount} episodes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Podcast Episodes */}
            {podcastResults.episodes.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" /> Podcast Episodes ({podcastResults.episodes.length})
                </h2>
                <div className="space-y-0.5">
                  {podcastResults.episodes.slice(0, 10).map(ep => {
                    const show = podcastShows.find(s => s.id === ep.showId);
                    return (
                      <div
                        key={ep.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                        onClick={() => playEpisode(ep)}
                      >
                        <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(ep.showId)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ep.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{show?.title} · {formatDate(ep.publishDate)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatEpisodeDuration(ep.duration)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Credits / Performers */}
            {fuzzyResults.credits.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Credits / Performers ({fuzzyResults.credits.length})
                </h2>
                <div className="space-y-1">
                  {(showAllSections.credits ? fuzzyResults.credits : fuzzyResults.credits.slice(0, 8)).map((credit, i) => (
                    <div
                      key={`${credit.trackId}-${credit.name}-${i}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('performer-detail', { performerName: credit.name })}
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getCoverGradient(credit.name)} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{credit.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {credit.role}{credit.trackId ? ` · on "${credit.trackTitle}"` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{credit.role}</Badge>
                    </div>
                  ))}
                </div>
                {fuzzyResults.credits.length > 8 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggleSection('credits')}>
                    {showAllSections.credits ? 'Show less' : `Show all ${fuzzyResults.credits.length}`}
                  </Button>
                )}
              </section>
            )}

            {/* Radio Stations */}
            {fuzzyResults.radioStations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4" /> Radio Stations ({fuzzyResults.radioStations.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fuzzyResults.radioStations.map(station => (
                    <div
                      key={station.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('radio')}
                    >
                      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getCoverGradient(station.id)} flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{station.name}</p>
                        <p className="text-xs text-muted-foreground">{station.genre} · {station.country}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">LIVE</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Genres */}
            {fuzzyResults.genres.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Clapperboard className="w-4 h-4" /> Genres ({fuzzyResults.genres.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {fuzzyResults.genres.map(genre => (
                    <Badge
                      key={genre.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-1"
                      onClick={() => navigate('genre-detail', { genreName: genre.name })}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Tracks */}
            {fuzzyResults.tracks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" /> Tracks ({fuzzyResults.tracks.length})
                </h2>
                <div className="space-y-0.5">
                  {(showAllSections.tracks ? fuzzyResults.tracks : fuzzyResults.tracks.slice(0, 15)).map(trackResult => {
                    const track = getTrackById(trackResult.id);
                    if (!track) return null;
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                        onClick={() => play(track)}
                      >
                        <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artistName} · {track.albumName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                          <div className="flex gap-1 mt-0.5 justify-end">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{track.format}</Badge>
                            {track.composers.length > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {track.composers[0]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {fuzzyResults.tracks.length > 15 && (
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggleSection('tracks')}>
                      {showAllSections.tracks ? 'Show less' : `Show all ${fuzzyResults.tracks.length}`}
                    </Button>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Fallback to legacy search if fuzzy not available */}
        {!fuzzyResults && hasResults && (
          <>
            {legacyResults.artists.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Artists ({legacyResults.artists.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {legacyResults.artists.map(artist => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => navigate('artist-detail', { artistId: artist.id })}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                        <p className="text-xs text-muted-foreground">{artist.albumCount} albums</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {legacyResults.tracks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" /> Tracks ({legacyResults.tracks.length})
                </h2>
                <div className="space-y-0.5">
                  {legacyResults.tracks.slice(0, 20).map(track => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => play(track)}
                    >
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artistName} · {track.albumName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                        <div className="flex gap-1 mt-0.5 justify-end">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{track.format}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
