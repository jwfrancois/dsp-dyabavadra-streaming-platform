'use client';

import React, { useState, useMemo } from 'react';
import { usePlaylistStore } from '@/store/playlists';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore } from '@/store/local-library';
import { useUIStore } from '@/store/ui';
import { formatDuration, getCoverGradient, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, ListMusic, Play, Trash2, Clock, Music, Shuffle } from 'lucide-react';

/** Convert LocalTrack → Track for player/playback */
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

/** Cover art gradients used for the 4-color grid mosaic */
const COVER_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

/** Get a deterministic gradient for a track ID */
function getTrackGradient(id: string): string {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

/** 4-color grid cover art for a playlist */
function PlaylistCover({ trackIds, trackMap }: { trackIds: string[]; trackMap: Map<string, any> }) {
  if (trackIds.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
        <ListMusic className="w-8 h-8 text-muted-foreground/40" />
      </div>
    );
  }

  const firstFour = trackIds.slice(0, 4);
  const covers = firstFour.map(id => trackMap.get(id)?.coverArt || null);

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 gap-px bg-border">
      {firstFour.map((id, i) => {
        const cover = covers[i];
        if (cover) {
          return (
            <div key={id} className="relative overflow-hidden">
              <img src={cover} alt="" className="w-full h-full object-cover" />
            </div>
          );
        }
        return (
          <div
            key={id}
            className={`bg-gradient-to-br ${getTrackGradient(id)}`}
          />
        );
      })}
    </div>
  );
}

export function BrowsePlaylistsView() {
  const { playlists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const { setQueue, play } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const { navigate } = useUIStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Track lookup map
  const trackMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const lt of localTracks) {
      map.set(lt.id, lt);
    }
    return map;
  }, [localTracks]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createPlaylist(trimmed, newDesc.trim() || undefined);
    setNewName('');
    setNewDesc('');
    setDialogOpen(false);
  };

  const handlePlayAll = (playlistId: string, trackIds: string[]) => {
    const tracks: Track[] = [];
    for (const id of trackIds) {
      const lt = trackMap.get(id);
      if (lt) {
        tracks.push(localToTrack(lt));
      }
    }
    if (tracks.length > 0) {
      setQueue(tracks, 0);
    }
  };

  const handleShuffleAll = (playlistId: string, trackIds: string[]) => {
    const tracks: Track[] = [];
    for (const id of trackIds) {
      const lt = trackMap.get(id);
      if (lt) {
        tracks.push(localToTrack(lt));
      }
    }
    if (tracks.length > 0) {
      // Fisher-Yates shuffle
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
      setQueue(tracks, 0);
    }
  };

  const handleDelete = (playlistId: string) => {
    deletePlaylist(playlistId);
  };

  // Compute total duration for a playlist
  const getPlaylistDuration = (trackIds: string[]) => {
    let total = 0;
    for (const id of trackIds) {
      const lt = trackMap.get(id);
      if (lt) total += lt.duration;
    }
    return total;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Playlists</h1>
            {playlists.length > 0 && (
              <Badge variant="secondary" className="text-xs">{playlists.length}</Badge>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="My Awesome Playlist"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="A short description..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <ListMusic className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No playlists yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create playlists from your imported music library</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Your First Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map(playlist => {
              const totalDuration = getPlaylistDuration(playlist.trackIds);
              const resolvedCount = playlist.trackIds.filter(id => trackMap.has(id)).length;

              return (
                <div key={playlist.id} className="group relative">
                  <div className="relative mb-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => handlePlayAll(playlist.id, playlist.trackIds)}
                    >
                      <PlaylistCover trackIds={playlist.trackIds} trackMap={trackMap} />
                    </div>

                    {/* Play button */}
                    <Button
                      variant="default"
                      size="icon"
                      className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg z-10"
                      onClick={() => handlePlayAll(playlist.id, playlist.trackIds)}
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </Button>

                    {/* Shuffle button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-2 right-14 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg z-10"
                      onClick={() => handleShuffleAll(playlist.id, playlist.trackIds)}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </Button>

                    {/* Delete button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-black/60 hover:bg-destructive text-white border-0 z-10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{playlist.name}&rdquo;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(playlist.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Track count badge */}
                    <Badge
                      variant="outline"
                      className="absolute top-2 left-2 text-[9px] h-4 px-1.5 bg-black/60 text-white border-0 z-10"
                    >
                      <Music className="w-2.5 h-2.5 mr-0.5" /> {resolvedCount}
                    </Badge>
                  </div>

                  {/* Playlist info */}
                  <div
                    className="cursor-pointer"
                    onClick={() => handlePlayAll(playlist.id, playlist.trackIds)}
                  >
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {playlist.name}
                    </p>
                    {playlist.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Music className="w-2.5 h-2.5" /> {resolvedCount} tracks
                      </span>
                      {totalDuration > 0 && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {formatDuration(totalDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
