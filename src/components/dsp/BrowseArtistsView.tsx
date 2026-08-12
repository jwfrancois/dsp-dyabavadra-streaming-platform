'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { artists, getAlbumsByArtist } from '@/lib/data';
import { getCoverGradient } from '@/lib/data';
import { useLocalLibraryStore } from '@/store/local-library';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, HardDrive, User } from 'lucide-react';

export function BrowseArtistsView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showLocal, setShowLocal] = React.useState(true);

  // Derive local artists from local tracks
  const localArtistNames = React.useMemo(() => {
    const names = new Set<string>();
    for (const lt of localTracks) {
      if (lt.artist) names.add(lt.artist);
      if (lt.albumArtist && lt.albumArtist !== lt.artist) names.add(lt.albumArtist);
    }
    return [...names].sort();
  }, [localTracks]);

  // Merge with mock artists
  const allArtists = React.useMemo(() => {
    if (!showLocal) return artists;
    const mockNames = new Set(artists.map(a => a.name.toLowerCase()));
    const uniqueLocalNames = localArtistNames.filter(
      name => !mockNames.has(name.toLowerCase())
    );
    // Create synthetic artist entries for local-only artists
    const localArtistEntries = uniqueLocalNames.map(name => ({
      id: `local-artist-${name}`,
      name,
      imageUrl: '',
      bio: '',
      genres: [...new Set(localTracks.filter(lt => lt.artist === name || lt.albumArtist === name).map(lt => lt.genre))],
      type: 'individual' as const,
      similarArtists: [],
      playCount: 0,
      trackCount: localTracks.filter(lt => lt.artist === name || lt.albumArtist === name).length,
      albumCount: [...new Set(localTracks.filter(lt => lt.artist === name || lt.albumArtist === name).map(lt => lt.album))].length,
    }));
    return [...artists, ...localArtistEntries];
  }, [artists, localArtistNames, localTracks, showLocal]);

  const filtered = allArtists.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Artists</h1>
          <div className="flex items-center gap-2">
            {localTracks.length > 0 && (
              <Button
                variant={showLocal ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowLocal(!showLocal)}
              >
                <HardDrive className="w-3.5 h-3.5" />
                {showLocal ? 'Local + Mock' : 'Mock Only'}
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">{filtered.length} artists</Badge>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filtered.map(artist => {
            const isLocal = artist.id.startsWith('local-artist-');
            const albumCount = isLocal
              ? [...new Set(localTracks.filter(lt => lt.artist === artist.name || lt.albumArtist === artist.name).map(lt => lt.album))].length
              : getAlbumsByArtist(artist.id).length;

            return (
              <div
                key={artist.id}
                className="group text-center cursor-pointer"
                onClick={() => {
                  if (!isLocal) {
                    navigate('artist-detail', { artistId: artist.id });
                  }
                }}
              >
                <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} mx-auto mb-3 cover-art-hover shadow-xl ring-2 ring-transparent group-hover:ring-primary/30 transition-all flex items-center justify-center`}>
                  <User className="w-12 h-12 text-white/20" />
                </div>
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{artist.name}</p>
                <p className="text-xs text-muted-foreground">{albumCount} album{albumCount !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                  {artist.genres.slice(0, 2).map(g => (
                    <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                  ))}
                  {isLocal && (
                    <Badge variant="outline" className="text-[9px] px-1 h-4">
                      <HardDrive className="w-2.5 h-2.5 mr-0.5" /> Local
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
