'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { tracks } from '@/lib/data';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Play, Heart, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortKey = 'title' | 'artist' | 'album' | 'duration' | 'format' | 'playCount';

export function BrowseTracksView() {
  const { navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortKey>('title');
  const [filterGenre, setFilterGenre] = React.useState('all');
  const [filterFormat, setFilterFormat] = React.useState('all');

  const allGenres = Array.from(new Set(tracks.map(t => t.genre))).sort();
  const allFormats = Array.from(new Set(tracks.map(t => t.format))).sort();

  let filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.albumName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterGenre !== 'all') filtered = filtered.filter(t => t.genre === filterGenre);
  if (filterFormat !== 'all') filtered = filtered.filter(t => t.format === filterFormat);

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'title': return a.title.localeCompare(b.title);
      case 'artist': return a.artistName.localeCompare(b.artistName);
      case 'album': return a.albumName.localeCompare(b.albumName);
      case 'duration': return b.duration - a.duration;
      case 'format': return a.format.localeCompare(b.format);
      case 'playCount': return b.playCount - a.playCount;
      default: return 0;
    }
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tracks</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length} tracks</Badge>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="Genre" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {allGenres.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterFormat} onValueChange={setFilterFormat}>
            <SelectTrigger className="w-28 bg-card border-border"><SelectValue placeholder="Format" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {allFormats.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-36 bg-card border-border">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="album">Album</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="format">Format</SelectItem>
              <SelectItem value="playCount">Play Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-8">#</TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Album</TableHead>
                <TableHead className="hidden lg:table-cell">Format</TableHead>
                <TableHead className="hidden lg:table-cell">Sample Rate</TableHead>
                <TableHead className="hidden xl:table-cell">File Size</TableHead>
                <TableHead className="hidden md:table-cell">Plays</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((track, index) => (
                <TableRow
                  key={track.id}
                  className="cursor-pointer hover:bg-accent/30 group"
                  onClick={() => play(track)}
                  onDoubleClick={() => {
                    const startIdx = filtered.findIndex(t => t.id === track.id);
                    setQueue(filtered, startIdx);
                  }}
                >
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    <span className="group-hover:hidden">{track.trackNumber}</span>
                    <Play className="w-3 h-3 text-primary hidden group-hover:block" />
                  </TableCell>
                  <TableCell>
                    <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p
                      className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('album-detail', { albumId: track.albumId });
                      }}
                    >
                      {track.albumName}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="text-[10px] font-mono">{track.format}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                    {formatSampleRate(track.sampleRate)} / {track.bitDepth}bit
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {formatFileSize(track.fileSize)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground tabular-nums">
                    {track.playCount}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); play(track); }}>
                          <Play className="w-4 h-4 mr-2" /> Play
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Heart className="w-4 h-4 mr-2" /> {track.loved ? 'Unlove' : 'Love'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          View Album
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          View Artist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ScrollArea>
  );
}
