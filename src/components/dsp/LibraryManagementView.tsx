'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore } from '@/store/local-library';
import {
  storageLocations, streamingAccounts, libraryScan, userTags,
  smartCollections, bookmarks, playHistory, duplicateGroups, metadataEdits,
  formatStorageSize, formatScanDuration, formatRelativeTime,
  getStorageStatusColor, getStorageStatusLabel,
  getServiceIcon, getServiceLabel, getTotalLibraryStats,
  getOnThisDay,
} from '@/lib/library-data';
import { tracks, albums, artists, playlists, formatDuration, getCoverGradient, formatSampleRate, formatFileSize } from '@/lib/data';
import type { Track } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderOpen, HardDrive, ScanSearch, RefreshCw, Plus, Minus, Trash2,
  Play, Pause, Heart, Star, Tag, Bookmark, Clock, History, Download,
  Upload, AlertTriangle, CheckCircle2, XCircle, Wifi, WifiOff,
  FolderClosed, ExternalLink, Edit3, Copy, Link2, Unlink, ChevronRight,
  Database, Archive, Shield, FileText, Music2, Disc3, Mic2, ListMusic,
  BarChart3, TrendingUp, Calendar, Volume2, Zap, Search, MoreHorizontal,
  Scissors, Merge, Split, Layers, Radio, Cloud, Settings, Loader2,
  ChevronLeft, Disc, User, Album as AlbumIcon, Library as LibraryIcon,
  Globe, Network, Server, FolderSymlink,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type LocalTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNumber: number;
  discNumber: number;
  duration: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bitrate: number;
  filePath: string;
  fileSize: number;
  year: number;
  genre: string;
  composer: string;
  coverArt: string | null;
};

type BrowseLocalView = 'artists' | 'albums' | 'tracks';
type BreadcrumbItem = { label: string; onClick: () => void };

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function localTrackToTrack(lt: LocalTrack): Track {
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
  };
}

function playLocalTrack(lt: LocalTrack) {
  const track = localTrackToTrack(lt);
  usePlayerStore.getState().play(track);
}

function playLocalTracks(lts: LocalTrack[]) {
  if (lts.length === 0) return;
  const queue = lts.map(localTrackToTrack);
  usePlayerStore.getState().setQueue(queue, 0);
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function LibraryManagementView() {
  const { navigate } = useUIStore();
  const { play } = usePlayerStore();
  const store = useLibraryStore();
  const [activeTab, setActiveTab] = React.useState('browse-local');

  const stats = getTotalLibraryStats();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-primary" /> Library Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalTracks.toLocaleString()} tracks across {stats.locationCount} locations
              {tracks.length > 0 && (
                <span className="text-primary ml-1">(+ {tracks.length.toLocaleString()} local)</span>
              )}
              {stats.offlineLocations > 0 && (
                <span className="text-signal-red ml-1">({stats.offlineLocations} offline)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {formatStorageSize(stats.totalSize)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Cloud className="w-3 h-3 mr-1" />
              {stats.streamingLinked.toLocaleString()} linked
            </Badge>
          </div>
        </div>

        {/* Library Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10"><Music2 className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="text-lg font-bold">{stats.totalTracks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-signal-green/10"><HardDrive className="w-4 h-4 text-signal-green" /></div>
                <div>
                  <p className="text-lg font-bold">{stats.onlineLocations}/{stats.locationCount}</p>
                  <p className="text-[10px] text-muted-foreground">Locations Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-signal-amber/10"><Heart className="w-4 h-4 text-signal-amber" /></div>
                <div>
                  <p className="text-lg font-bold">{tracks.filter(t => t.loved).length}</p>
                  <p className="text-[10px] text-muted-foreground">Loved Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10"><BarChart3 className="w-4 h-4 text-purple-400" /></div>
                <div>
                  <p className="text-lg font-bold">{tracks.reduce((s, t) => s + t.playCount, 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Plays</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface w-full justify-start overflow-x-auto">
            <TabsTrigger value="browse-local" className="text-xs gap-1.5"><LibraryIcon className="w-3.5 h-3.5" /> Browse Local</TabsTrigger>
            <TabsTrigger value="scan-folders" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Scan Folders</TabsTrigger>
            <TabsTrigger value="network-shares" className="text-xs gap-1.5"><Globe className="w-3.5 h-3.5" /> Network Shares</TabsTrigger>
            <TabsTrigger value="sources" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Sources</TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs gap-1.5"><ScanSearch className="w-3.5 h-3.5" /> Scanner</TabsTrigger>
            <TabsTrigger value="metadata" className="text-xs gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Metadata</TabsTrigger>
            <TabsTrigger value="dedup" className="text-xs gap-1.5"><Layers className="w-3.5 h-3.5" /> Dedup</TabsTrigger>
            <TabsTrigger value="playlists" className="text-xs gap-1.5"><ListMusic className="w-3.5 h-3.5" /> Playlists</TabsTrigger>
            <TabsTrigger value="tags" className="text-xs gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags & Collections</TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> History</TabsTrigger>
            <TabsTrigger value="backup" className="text-xs gap-1.5"><Archive className="w-3.5 h-3.5" /> Backup</TabsTrigger>
          </TabsList>

          {/* ═══ BROWSE LOCAL TAB ═══ */}
          <TabsContent value="browse-local" className="mt-6">
            <BrowseLocalPanel />
          </TabsContent>

          {/* ═══ SCAN FOLDERS TAB ═══ */}
          <TabsContent value="scan-folders" className="mt-6">
            <ScanFoldersPanel />
          </TabsContent>

          {/* ═══ NETWORK SHARES TAB ═══ */}
          <TabsContent value="network-shares" className="mt-6">
            <NetworkSharesPanel />
          </TabsContent>

          {/* ═══ SOURCES TAB ═══ */}
          <TabsContent value="sources" className="space-y-6 mt-6">
            <SourcesPanel store={store} play={play} />
          </TabsContent>

          {/* ═══ SCANNER TAB ═══ */}
          <TabsContent value="scanner" className="space-y-6 mt-6">
            <ScannerPanel store={store} />
          </TabsContent>

          {/* ═══ METADATA TAB ═══ */}
          <TabsContent value="metadata" className="space-y-6 mt-6">
            <MetadataPanel store={store} play={play} />
          </TabsContent>

          {/* ═══ DEDUPLICATION TAB ═══ */}
          <TabsContent value="dedup" className="space-y-6 mt-6">
            <DedupPanel store={store} />
          </TabsContent>

          {/* ═══ PLAYLISTS TAB ═══ */}
          <TabsContent value="playlists" className="space-y-6 mt-6">
            <PlaylistsPanel play={play} />
          </TabsContent>

          {/* ═══ TAGS & COLLECTIONS TAB ═══ */}
          <TabsContent value="tags" className="space-y-6 mt-6">
            <TagsCollectionsPanel store={store} />
          </TabsContent>

          {/* ═══ HISTORY & STATS TAB ═══ */}
          <TabsContent value="history" className="space-y-6 mt-6">
            <HistoryStatsPanel store={store} play={play} />
          </TabsContent>

          {/* ═══ BACKUP & RESTORE TAB ═══ */}
          <TabsContent value="backup" className="space-y-6 mt-6">
            <BackupRestorePanel />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

// ═══════════════════════════════════════════════════════════
// BROWSE LOCAL PANEL (NEW)
// ═══════════════════════════════════════════════════════════

function BrowseLocalPanel() {
  const localStore = useLocalLibraryStore();
  const [view, setView] = React.useState<BrowseLocalView>('artists');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Breadcrumb navigation state
  const [selectedArtist, setSelectedArtist] = React.useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = React.useState<string | null>(null);

  const allArtists = localStore.getArtists();
  const allAlbums = localStore.getAlbums();
  const allTracks = localStore.tracks;

  // Derived data based on navigation state
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Artists', onClick: () => { setSelectedArtist(null); setSelectedAlbum(null); setView('artists'); } }];

  let displayedArtists = allArtists;
  let displayedAlbums = allAlbums;
  let displayedTracks = allTracks;

  if (searchQuery.trim()) {
    displayedTracks = localStore.searchTracks(searchQuery.trim());
    displayedAlbums = allAlbums.filter(a =>
      displayedTracks.some(t => t.album === a.name && t.artist === a.artist)
    );
    displayedArtists = allArtists.filter(a =>
      displayedTracks.some(t => t.artist === a)
    );
  } else if (selectedArtist && selectedAlbum) {
    // Artist > Album > Tracks
    breadcrumbs.push(
      { label: selectedArtist, onClick: () => { setSelectedAlbum(null); } },
      { label: selectedAlbum, onClick: () => {} },
    );
    displayedTracks = localStore.getTracksByAlbum(selectedAlbum).filter(t => t.artist === selectedArtist);
  } else if (selectedArtist) {
    // Artist > Albums
    breadcrumbs.push({ label: selectedArtist, onClick: () => {} });
    displayedAlbums = allAlbums.filter(a => a.artist === selectedArtist);
    displayedTracks = localStore.getTracksByArtist(selectedArtist);
  } else if (selectedAlbum) {
    // Albums > Tracks
    breadcrumbs.push({ label: selectedAlbum, onClick: () => {} });
    displayedTracks = localStore.getTracksByAlbum(selectedAlbum);
  }

  const showArtistsView = !selectedArtist && !selectedAlbum && view === 'artists' && !searchQuery.trim();
  const showAlbumsView = (selectedArtist || view === 'albums') && !selectedAlbum && !searchQuery.trim();
  const showTracksView = selectedAlbum || view === 'tracks' || searchQuery.trim();

  return (
    <div className="space-y-4">
      {/* Search and View Switcher */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search local library..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (e.target.value) { setSelectedArtist(null); setSelectedAlbum(null); } }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center bg-surface rounded-lg p-0.5">
          {([['artists', User, 'Artists'], ['albums', Disc3, 'Albums'], ['tracks', Music2, 'Tracks']] as const).map(([key, Icon, label]) => (
            <Button
              key={key}
              variant={view === key ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-md"
              onClick={() => { setView(key as BrowseLocalView); setSelectedArtist(null); setSelectedAlbum(null); setSearchQuery(''); }}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedArtist || selectedAlbum) && !searchQuery.trim() && (
        <div className="flex items-center gap-1 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <button
                className={`${i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                onClick={crumb.onClick}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Empty State */}
      {allTracks.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <LibraryIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-sm font-semibold mb-1">No Local Tracks</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Scan your music folders to build your local library. Go to the &quot;Scan Folders&quot; tab to add directories and start scanning.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Artists Grid */}
      {showArtistsView && allTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Artists ({displayedArtists.length})</h2>
          </div>
          {displayedArtists.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No artists found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {displayedArtists.sort().map(artist => {
                const artistAlbums = allAlbums.filter(a => a.artist === artist);
                const artistTrackCount = artistAlbums.reduce((s, a) => s + a.trackCount, 0);
                return (
                  <Card
                    key={artist}
                    className="bg-card border-border hover:border-primary/30 cursor-pointer transition-all group"
                    onClick={() => { setSelectedArtist(artist); setSelectedAlbum(null); setView('albums'); }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                        <User className="w-7 h-7 text-primary/60" />
                      </div>
                      <p className="text-xs font-medium truncate">{artist}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{artistAlbums.length} album{artistAlbums.length !== 1 ? 's' : ''} · {artistTrackCount} tracks</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Albums Grid */}
      {showAlbumsView && allTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{selectedArtist ? `${selectedArtist} — ` : ''}Albums ({displayedAlbums.length})</h2>
          </div>
          {displayedAlbums.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No albums found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedAlbums.map(album => {
                const albumTracks = localStore.getTracksByAlbum(album.name).filter(t => !selectedArtist || t.artist === selectedArtist);
                const firstTrack = albumTracks[0];
                return (
                  <Card
                    key={`${album.artist}-${album.name}`}
                    className="bg-card border-border hover:border-primary/30 cursor-pointer transition-all group"
                    onDoubleClick={() => playLocalTracks(albumTracks.sort((a, b) => a.trackNumber - b.trackNumber))}
                    onClick={() => { setSelectedAlbum(album.name); if (selectedArtist) { /* keep artist */ } else { setSelectedArtist(album.artist); } }}
                  >
                    <CardContent className="p-3">
                      {/* Cover Art */}
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                        {firstTrack?.coverArt ? (
                          <img
                            src={`data:image/jpeg;base64,${firstTrack.coverArt}`}
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(album.name + album.artist)} flex items-center justify-center`}>
                            <Disc3 className="w-10 h-10 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button size="icon" className="h-10 w-10 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg">
                            <Play className="w-5 h-5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate">{album.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{album.artist}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{album.trackCount} tracks</span>
                        {firstTrack?.year && (
                          <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{firstTrack.year}</span>
                          </>
                        )}
                        {firstTrack?.format && (
                          <Badge variant="outline" className="text-[8px] h-4 ml-auto font-mono">
                            {firstTrack.format}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tracks Table */}
      {showTracksView && allTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {searchQuery.trim() ? `Search Results (${displayedTracks.length})` : selectedAlbum ? `${selectedAlbum} — Tracks` : `All Tracks (${displayedTracks.length})`}
            </h2>
            {selectedAlbum && displayedTracks.length > 0 && (
              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => playLocalTracks(displayedTracks.sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber)))}>
                <Play className="w-3 h-3" /> Play All
              </Button>
            )}
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-12">#</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Artist</TableHead>
                      <TableHead className="text-xs">Album</TableHead>
                      <TableHead className="text-xs w-16">Duration</TableHead>
                      <TableHead className="text-xs w-16">Format</TableHead>
                      <TableHead className="text-xs w-20">Sample Rate</TableHead>
                      <TableHead className="text-xs w-16">Bit Depth</TableHead>
                      <TableHead className="text-xs w-20">Size</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedTracks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                          {searchQuery.trim() ? 'No tracks match your search.' : 'No tracks found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedTracks.sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber)).map((track, i) => (
                        <TableRow
                          key={track.id}
                          className="cursor-pointer hover:bg-accent/20 group"
                          onDoubleClick={() => playLocalTrack(track)}
                        >
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {track.trackNumber || i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3.5 h-3.5 rounded flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); playLocalTrack(track); }}
                              >
                                <Play className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                {track.coverArt ? (
                                  <img src={`data:image/jpeg;base64,${track.coverArt}`} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                ) : (
                                  <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.album + track.artist)} flex items-center justify-center flex-shrink-0`}>
                                    <Music2 className="w-3.5 h-3.5 text-white/20" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{track.title}</p>
                                  {track.composer && track.composer !== track.artist && (
                                    <p className="text-[10px] text-muted-foreground truncate">{track.composer}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{track.artist}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{track.album}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{formatDuration(track.duration)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-mono h-5">{track.format}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{formatSampleRate(track.sampleRate)}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{track.bitDepth}bit</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatFileSize(track.fileSize)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); playLocalTrack(track); }}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCAN FOLDERS PANEL (NEW)
// ═══════════════════════════════════════════════════════════

function ScanFoldersPanel() {
  const localStore = useLocalLibraryStore();
  const [directoryInput, setDirectoryInput] = React.useState('');
  const [uncWarning, setUncWarning] = React.useState(false);

  const { tracks, isScanning, scanProgress, scanError, directories, lastScanTime } = localStore;

  const isUncPath = (path: string) => {
    const normalized = path.replace(/\\/g, '/');
    return normalized.startsWith('//') || normalized.startsWith('smb://');
  };

  const handleScan = React.useCallback(async () => {
    const dir = directoryInput.trim();
    if (!dir) return;

    if (isUncPath(dir)) {
      setUncWarning(true);
      return;
    }

    localStore.addDirectory(dir);
    setDirectoryInput('');
    await localStore.startScan(dir);
  }, [directoryInput, localStore]);

  const handleScanAll = React.useCallback(async () => {
    await localStore.scanAllDirectories();
  }, [localStore]);

  // Compute scan stats
  const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);
  const formatBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tracks.forEach(t => {
      const fmt = t.format.toUpperCase();
      counts[fmt] = (counts[fmt] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tracks]);

  const avgSampleRate = tracks.length > 0
    ? Math.round(tracks.reduce((s, t) => s + t.sampleRate, 0) / tracks.length)
    : 0;
  const avgBitDepth = tracks.length > 0
    ? (tracks.reduce((s, t) => s + t.bitDepth, 0) / tracks.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Add Folder */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" /> Add Folder & Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UNC Path Warning */}
          {uncWarning && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-signal-amber/5 border border-signal-amber/20">
              <AlertTriangle className="w-4 h-4 text-signal-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-signal-amber">Network Path Detected</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This looks like a network (SMB/CIFS) path. Please use the &quot;Network Shares&quot; tab to mount it first, or mount it manually and enter the local mount path here.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] mt-2"
                  onClick={() => setUncWarning(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FolderClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="/path/to/your/music/folder (or use Network Shares tab for NAS)"
                value={directoryInput}
                onChange={e => setDirectoryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                className="pl-9 h-9 text-sm font-mono"
                disabled={isScanning}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={!directoryInput.trim() || isScanning}
              className="h-9 gap-1.5"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : 'Scan'}
            </Button>
            {directories.length > 1 && (
              <Button
                variant="outline"
                onClick={handleScanAll}
                disabled={isScanning}
                className="h-9 gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Scan All ({directories.length})
              </Button>
            )}
          </div>

          {/* Scan Progress */}
          {isScanning && (
            <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-medium">Scanning...</span>
                <span className="text-xs text-muted-foreground ml-auto font-mono">{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                Discovering and indexing audio files. This may take a while for large libraries.
              </p>
            </div>
          )}

          {/* Scan Error */}
          {scanError && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-signal-red/5 border border-signal-red/20">
              <AlertTriangle className="w-4 h-4 text-signal-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-signal-red">Scan Error</p>
                <p className="text-xs text-muted-foreground mt-0.5">{scanError}</p>
              </div>
            </div>
          )}

          {/* Last Scan Completion */}
          {!isScanning && lastScanTime && tracks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
              <span>Last scan completed at {new Date(lastScanTime).toLocaleString()} — {tracks.length} tracks indexed</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configured Folders */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderClosed className="w-4 h-4" /> Configured Folders ({directories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {directories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No folders configured. Add a folder above to start scanning.</p>
          ) : (
            <div className="space-y-2">
              {directories.map(dir => (
                <div key={dir} className="flex items-center gap-3 p-3 rounded-lg bg-surface/50 group">
                  <HardDrive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{dir}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => localStore.startScan(dir)}
                    disabled={isScanning}
                    title="Rescan this folder"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() => localStore.removeDirectory(dir)}
                    disabled={isScanning}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results / Library Stats */}
      {tracks.length > 0 && (
        <>
          {/* Overview Stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-surface/50">
                  <p className="text-[10px] text-muted-foreground">Total Tracks</p>
                  <p className="text-lg font-bold">{tracks.length.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface/50">
                  <p className="text-[10px] text-muted-foreground">Total Duration</p>
                  <p className="text-lg font-bold">{formatDuration(totalDuration)}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface/50">
                  <p className="text-[10px] text-muted-foreground">Avg Sample Rate</p>
                  <p className="text-lg font-bold font-mono">{formatSampleRate(avgSampleRate)}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface/50">
                  <p className="text-[10px] text-muted-foreground">Avg Bit Depth</p>
                  <p className="text-lg font-bold font-mono">{avgBitDepth} bit</p>
                </div>
              </div>

              {/* Format Breakdown */}
              <div>
                <p className="text-xs font-medium mb-2">Format Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {formatBreakdown.map(([fmt, count]) => (
                    <Badge
                      key={fmt}
                      variant="outline"
                      className="text-xs py-1.5 px-3 font-mono"
                    >
                      <Disc3 className="w-3 h-3 mr-1" />
                      {fmt}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Play - Recently Discovered Tracks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">Quick Play — Discovered Tracks</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm" variant="ghost" className="h-6 text-[10px]"
                      onClick={() => playLocalTracks(tracks.slice(0, 20))}
                    >
                      <Play className="w-3 h-3 mr-0.5" /> Play First 20
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-6 text-[10px] text-destructive hover:text-destructive"
                      onClick={() => { if (confirm('Clear all scanned tracks? This cannot be undone.')) localStore.clearLibrary(); }}
                    >
                      <Trash2 className="w-3 h-3 mr-0.5" /> Clear
                    </Button>
                  </div>
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {tracks.slice(0, 50).map((track, i) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 cursor-pointer transition-colors group"
                        onClick={() => playLocalTrack(track)}
                      >
                        {track.coverArt ? (
                          <img src={`data:image/jpeg;base64,${track.coverArt}`} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.album + track.artist)} flex items-center justify-center flex-shrink-0`}>
                            <Music2 className="w-3.5 h-3.5 text-white/20" />
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground w-5 text-right font-mono">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{track.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{track.artist} — {track.album}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-mono h-4 flex-shrink-0">{track.format}</Badge>
                        <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{track.bitDepth}bit/{formatSampleRate(track.sampleRate)}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDuration(track.duration)}</span>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); playLocalTrack(track); }}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Clear Library */}
          <div className="flex justify-end">
            <Button
              variant="destructive" size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => localStore.clearLibrary()}
              disabled={isScanning}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Entire Local Library
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NETWORK SHARES PANEL (SMB/CIFS)
// ═══════════════════════════════════════════════════════════

interface NetworkShareInfo {
  id: string;
  uncPath: string;
  server: string;
  shareName: string;
  subPath: string;
  mountPoint: string;
  username: string;
  mounted: boolean;
  mountedAt: string | null;
  error: string | null;
}

function NetworkSharesPanel() {
  const localStore = useLocalLibraryStore();
  const [shares, setShares] = React.useState<NetworkShareInfo[]>([]);
  const [uncInput, setUncInput] = React.useState('');
  const [usernameInput, setUsernameInput] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');
  const [mounting, setMounting] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load existing shares on mount
  React.useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library/mount');
      const data = await res.json();
      if (data.success) {
        setShares(data.shares || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load network shares');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
    setLoading(false);
  };

  const handleMount = async () => {
    const unc = uncInput.trim();
    if (!unc) return;

    setMounting(unc);
    setError(null);

    try {
      const res = await fetch('/api/library/mount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uncPath: unc,
          username: usernameInput.trim() || undefined,
          password: passwordInput || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.share) {
        // Add the scan path to local directories and start scan
        if (data.scanPath) {
          localStore.addDirectory(data.scanPath);
          localStore.startScan(data.scanPath);
        }
        setUncInput('');
        setUsernameInput('');
        setPasswordInput('');
        await fetchShares();
      } else {
        setError(data.error || 'Mount failed');
      }
    } catch (err) {
      setError('Failed to mount share');
    }
    setMounting(null);
  };

  const handleUnmount = async (shareId: string) => {
    try {
      await fetch(`/api/library/mount?id=${encodeURIComponent(shareId)}`, { method: 'DELETE' });
      await fetchShares();
    } catch {
      setError('Failed to unmount');
    }
  };

  const handleRemount = async (share: NetworkShareInfo) => {
    setMounting(share.id);
    setError(null);
    try {
      const res = await fetch('/api/library/mount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uncPath: share.uncPath }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.scanPath) {
          localStore.addDirectory(data.scanPath);
        }
        await fetchShares();
      } else {
        setError(data.error || 'Remount failed');
      }
    } catch {
      setError('Failed to remount');
    }
    setMounting(null);
  };

  const handleScanMounted = (share: NetworkShareInfo) => {
    const scanPath = share.mountPoint + (share.subPath ? `/${share.subPath}` : '');
    localStore.addDirectory(scanPath);
    localStore.startScan(scanPath);
  };

  return (
    <div className="space-y-6">
      {/* What are Network Shares */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Access your NAS or network storage</p>
              <p>
                Mount SMB/CIFS network shares (TrueNAS, Synology, Windows shares, etc.)
                to scan and play music from network-attached storage. The share will be
                mounted on the server and scanned for audio files.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Network Share */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Add Network Share
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Network Path (UNC or SMB URL)</label>
            <Input
              placeholder="\\10.0.0.80\iguey\Media\Music"
              value={uncInput}
              onChange={e => setUncInput(e.target.value)}
              className="h-9 text-sm font-mono"
              disabled={!!mounting}
            />
            <p className="text-[10px] text-muted-foreground">
              Formats: {'\\\\'}SERVER{'\\'}share{'\\'}path &nbsp;|&nbsp; //SERVER/share/path &nbsp;|&nbsp; smb://user:pass@SERVER/share/path
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Username (optional)</label>
              <Input
                placeholder="guest"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="h-9 text-sm"
                disabled={!!mounting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Password (optional)</label>
              <Input
                type="password"
                placeholder="Leave empty for guest access"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="h-9 text-sm"
                disabled={!!mounting}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-signal-red/5 border border-signal-red/20">
              <AlertTriangle className="w-4 h-4 text-signal-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-signal-red">Error</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleMount}
            disabled={!uncInput.trim() || !!mounting}
            className="h-9 gap-1.5"
          >
            {mounting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
            {mounting ? 'Mounting...' : 'Mount & Scan'}
          </Button>
        </CardContent>
      </Card>

      {/* Mounted Shares */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderSymlink className="w-4 h-4" /> Network Shares ({shares.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Loading shares...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8">
              <Server className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">No network shares configured. Add one above to access your NAS music library.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shares.map(share => (
                <div
                  key={share.id}
                  className={`p-3 rounded-lg border transition-colors ${share.mounted ? 'bg-signal-green/5 border-signal-green/20' : 'bg-surface/50 border-border'}`}
                >
                  <div className="flex items-start gap-3">
                    <Server className={`w-4 h-4 flex-shrink-0 mt-0.5 ${share.mounted ? 'text-signal-green' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{share.uncPath}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={share.mounted ? 'default' : 'outline'} className="text-[10px] h-5">
                          {share.mounted ? (
                            <><Wifi className="w-2.5 h-2.5 mr-1" /> Mounted</>
                          ) : (
                            <><WifiOff className="w-2.5 h-2.5 mr-1" /> Unmounted</>
                          )}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{share.mountPoint}</span>
                      </div>
                      {share.subPath && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Sub-path: <span className="font-mono">/{share.subPath}</span>
                          {share.mounted && (
                            <span className="text-primary ml-1">
                              → Scan path: <span className="font-mono">{share.mountPoint}/{share.subPath}</span>
                            </span>
                          )}
                        </p>
                      )}
                      {share.error && (
                        <p className="text-[10px] text-signal-red mt-1">{share.error}</p>
                      )}
                      {share.mountedAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Mounted at {new Date(share.mountedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {share.mounted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => handleScanMounted(share)}
                          disabled={localStore.isScanning}
                        >
                          <ScanSearch className="w-3 h-3" /> Scan
                        </Button>
                      )}
                      {!share.mounted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] gap-1"
                          onClick={() => handleRemount(share)}
                          disabled={!!mounting}
                        >
                          <RefreshCw className="w-3 h-3" /> Mount
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleUnmount(share.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Mount Instructions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Manual Mount (if auto-mount fails)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            If the web UI cannot mount shares (due to permissions), you can mount manually in your server terminal:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-surface font-mono text-[11px] space-y-1">
              <p className="text-muted-foreground"># Install CIFS utilities (if needed)</p>
              <p className="text-foreground">sudo apt install cifs-utils</p>
              <p className="text-muted-foreground mt-2"># Create mount point</p>
              <p className="text-foreground">sudo mkdir -p /mnt/music</p>
              <p className="text-muted-foreground mt-2"># Mount your TrueNAS share</p>
              <p className="text-foreground">sudo mount -t cifs //10.0.0.80/iguey/Media/Music /mnt/music -o guest,iocharset=utf8</p>
              <p className="text-muted-foreground mt-2"># Then use "/mnt/music" in the Scan Folders tab</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOURCES PANEL
// ═══════════════════════════════════════════════════════════

function SourcesPanel({ store, play }: { store: ReturnType<typeof useLibraryStore>; play: (track?: typeof tracks[0]) => void }) {
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newPath, setNewPath] = React.useState('');

  return (
    <div className="space-y-6">
      {/* Storage Locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Storage Locations</h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add Location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Storage Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <div><Label className="text-xs">Name</Label><Input placeholder="e.g., My Music Drive" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Path</Label><Input placeholder="/Volumes/Music or //NAS/music" value={newPath} onChange={e => setNewPath(e.target.value)} className="mt-1" /></div>
                <Button onClick={() => setShowAddDialog(false)} className="w-full" disabled={!newName || !newPath}>Add Location</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {store.locations.map(loc => (
            <Card key={loc.id} className={`bg-card border ${loc.status === 'offline' ? 'border-signal-red/20 opacity-70' : 'border-border'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${loc.status === 'online' ? 'bg-signal-green/10' : loc.status === 'offline' ? 'bg-signal-red/10' : 'bg-signal-amber/10'} flex-shrink-0`}>
                    <HardDrive className={`w-5 h-5 ${getStorageStatusColor(loc.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold truncate">{loc.name}</h3>
                      <Badge variant="outline" className={`text-[9px] ${getStorageStatusColor(loc.status)}`}>
                        {getStorageStatusLabel(loc.status)}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] uppercase">{loc.type}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{loc.path}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Music2 className="w-3 h-3" />{loc.trackCount.toLocaleString()} tracks</span>
                      <span className="flex items-center gap-1"><Database className="w-3 h-3" />{formatStorageSize(loc.totalSize)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Scanned {formatRelativeTime(loc.lastScan)}</span>
                      {loc.watchForChanges && (
                        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />Auto-watch</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        Preferred: {loc.formatPreferences.join(', ')} ≥{loc.minBitDepth}bit/{loc.minSampleRate}Hz
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={loc.enabled}
                        onCheckedChange={() => store.toggleLocation(loc.id)}
                      />
                      <span className="text-[10px] text-muted-foreground">{loc.enabled ? 'On' : 'Off'}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><RefreshCw className="w-4 h-4 mr-2" /> Rescan Now</DropdownMenuItem>
                        <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Configure</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => store.removeLocation(loc.id)}><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Streaming Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Streaming Services</h2>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Connect Service</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {streamingAccounts.map(acc => (
            <Card key={acc.id} className={`bg-card border ${acc.connected ? 'border-border' : 'border-muted-foreground/20 opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getServiceIcon(acc.service)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{getServiceLabel(acc.service)}</p>
                      <Badge variant={acc.connected ? 'default' : 'secondary'} className="text-[9px]">
                        {acc.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    {acc.connected ? (
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{acc.qualityTier}</span>
                        <span>·</span>
                        <span>{acc.linkedTrackCount.toLocaleString()} linked tracks</span>
                        <span>·</span>
                        <span>Synced {formatRelativeTime(acc.lastSynced)}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Not connected. Click to set up.</p>
                    )}
                  </div>
                  {acc.connected ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3 mr-1" /> Sync
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 text-xs">Connect</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCANNER PANEL
// ═══════════════════════════════════════════════════════════

function ScannerPanel({ store }: { store: ReturnType<typeof useLibraryStore> }) {
  const scan = useLibraryStore(s => s.scan);
  const isRunning = scan.status === 'running';

  const phaseLabels: Record<string, string> = {
    idle: 'Idle',
    discovering: 'Discovering files...',
    'reading-tags': 'Reading embedded tags...',
    fingerprinting: 'Acoustic fingerprinting...',
    deduplicating: 'Checking for duplicates...',
    finalizing: 'Finalizing index...',
  };

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScanSearch className="w-4 h-4 text-primary" /> Library Scanner
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button variant="destructive" size="sm" className="h-7 text-xs">
                  <Pause className="w-3 h-3 mr-1" /> Pause Scan
                </Button>
              ) : (
                <Button size="sm" className="h-7 text-xs" onClick={() => store.triggerScan()}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
                  {scan.status === 'completed' ? 'Rescan All' : 'Start Scan'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{phaseLabels[scan.phase] || scan.phase}</span>
              <span className="font-mono">{Math.round(scan.progress)}%</span>
            </div>
            <Progress value={scan.progress} className="h-2" />
          </div>

          {/* Scan Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">Total Files</p>
              <p className="text-sm font-bold">{scan.totalFiles.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">Processed</p>
              <p className="text-sm font-bold">{scan.processedFiles.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded bg-signal-green/10">
              <p className="text-xs text-signal-green">New</p>
              <p className="text-sm font-bold text-signal-green">+{scan.newFiles}</p>
            </div>
            <div className="p-2 rounded bg-signal-amber/10">
              <p className="text-xs text-signal-amber">Updated</p>
              <p className="text-sm font-bold text-signal-amber">~{scan.updatedFiles}</p>
            </div>
            <div className="p-2 rounded bg-signal-red/10">
              <p className="text-xs text-signal-red">Removed</p>
              <p className="text-sm font-bold text-signal-red">-{scan.removedFiles}</p>
            </div>
          </div>

          {/* Last scan info */}
          {scan.status === 'completed' && scan.completedAt && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Started: {new Date(scan.startedAt).toLocaleString()}</span>
              <span>Completed: {new Date(scan.completedAt).toLocaleString()}</span>
              <span>Duration: {formatScanDuration(Math.floor((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000))}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Errors */}
      {scan.errors.length > 0 && (
        <Card className="bg-card border-signal-amber/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-signal-amber" />
              Scan Errors ({scan.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scan.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-surface/30">
                  {err.severity === 'error' ? <XCircle className="w-4 h-4 text-signal-red flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-signal-amber flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">{err.file}</p>
                    <p className="text-xs">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scan Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Watch for File Changes</p>
              <p className="text-[11px] text-muted-foreground">Automatically detect new, moved, or deleted files</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Periodic Full Rescan</p>
              <p className="text-[11px] text-muted-foreground">Safety-net full rescan at regular intervals</p>
            </div>
            <div className="flex items-center gap-1">
              {[4, 6, 12, 24, 48].map(h => (
                <Button key={h} variant="outline" size="sm" className="h-6 text-[10px] px-1.5">{h}h</Button>
              ))}
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-1.5">Off</Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Acoustic Fingerprinting</p>
              <p className="text-[11px] text-muted-foreground">Use Chromaprint/AcoustID for untagged or misidentified files</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Folder Structure Heuristics</p>
              <p className="text-[11px] text-muted-foreground">Infer artist/album from folder paths when tags are missing</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Offline Storage Handling</p>
              <p className="text-[11px] text-muted-foreground">Keep indexing offline locations; mark tracks as unavailable</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// METADATA PANEL
// ═══════════════════════════════════════════════════════════

function MetadataPanel({ store, play }: { store: ReturnType<typeof useLibraryStore>; play: (track?: typeof tracks[0]) => void }) {
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(null);
  const selectedTrack = selectedTrackId ? tracks.find(t => t.id === selectedTrackId) : null;

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">Manual Tag Corrections</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                DSP indexes your files in place without copying them. When you edit metadata here, changes are stored
                in the database and optionally written back to the file&apos;s embedded tags (ID3v2, Vorbis Comments, FLAC metadata).
                Edits persist across rescans — moved or renamed files are matched by acoustic fingerprint so your corrections
                are never lost. Select a track below to view or edit its full metadata.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track metadata table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Track</TableHead>
                <TableHead className="text-xs">Artist</TableHead>
                <TableHead className="text-xs">Album</TableHead>
                <TableHead className="text-xs">Format</TableHead>
                <TableHead className="text-xs">Quality</TableHead>
                <TableHead className="text-xs">Size</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.slice(0, 15).map(track => (
                <TableRow key={track.id} className="cursor-pointer hover:bg-accent/20" onClick={() => setSelectedTrackId(track.id)}>
                  <TableCell className="text-xs font-medium">{track.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{track.artistName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{track.albumName}</TableCell>
                  <TableCell className="text-xs font-mono">{track.format}</TableCell>
                  <TableCell className="text-xs font-mono">{track.bitDepth}bit/{formatSampleRate(track.sampleRate)}</TableCell>
                  <TableCell className="text-xs">{formatFileSize(track.fileSize)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] ${track.source === 'local' ? 'border-signal-green/30 text-signal-green' : 'border-primary/30 text-primary'}`}>
                      {track.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); play(track); }}>
                      <Play className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Track Detail */}
      {selectedTrack && (
        <Card className="bg-card border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Track Metadata: {selectedTrack.title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Edit3 className="w-3 h-3" /> Edit Tags</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Copy className="w-3 h-3" /> Copy</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Link2 className="w-3 h-3" /> Link</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Title:</span><span className="font-medium">{selectedTrack.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Artist:</span><span className="font-medium">{selectedTrack.artistName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Album:</span><span className="font-medium">{selectedTrack.albumName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Track #:</span><span className="font-mono">{selectedTrack.trackNumber}/{selectedTrack.discNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span className="font-mono">{formatDuration(selectedTrack.duration)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Genre:</span><span>{selectedTrack.genre}</span></div>
              <Separator className="col-span-full" />
              <div className="flex justify-between"><span className="text-muted-foreground">Codec:</span><span className="font-mono">{selectedTrack.format}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bit Depth:</span><span className="font-mono">{selectedTrack.bitDepth} bit</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sample Rate:</span><span className="font-mono">{formatSampleRate(selectedTrack.sampleRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bitrate:</span><span className="font-mono">{selectedTrack.bitrate} kbps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Channels:</span><span className="font-mono">{selectedTrack.channels === 2 ? 'Stereo' : 'Mono'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">File Size:</span><span className="font-mono">{formatFileSize(selectedTrack.fileSize)}</span></div>
              <Separator className="col-span-full" />
              <div className="flex justify-between col-span-2"><span className="text-muted-foreground">File Path:</span><span className="font-mono text-[10px] truncate ml-2">{selectedTrack.filePath}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Source:</span><Badge variant="outline" className="text-[9px]">{selectedTrack.source}</Badge></div>
              {selectedTrack.composers.length > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Composers:</span><span>{selectedTrack.composers.join(', ')}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Play Count:</span><span className="font-mono">{selectedTrack.playCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loved:</span>{selectedTrack.loved ? <Heart className="w-3 h-3 fill-red-500 text-red-500" /> : <Heart className="w-3 h-3 text-muted-foreground" />}</div>
            </div>

            {/* Credits */}
            {selectedTrack.performers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2">Credits</p>
                <div className="space-y-1">
                  {selectedTrack.performers.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px]">— {p.role}{p.instrument ? ` (${p.instrument})` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Recent Tag Edits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {store.edits.length === 0 && <p className="text-xs text-muted-foreground">No edits yet.</p>}
            {store.edits.map(edit => (
              <div key={edit.id} className="flex items-center gap-3 p-2 rounded bg-surface/30 text-xs">
                <Badge variant="outline" className="text-[9px] font-mono">{edit.field}</Badge>
                <span className="text-muted-foreground line-through">{edit.oldValue || '(empty)'}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-medium">{edit.newValue}</span>
                <span className="ml-auto text-muted-foreground">{formatRelativeTime(edit.editedAt)}</span>
                {edit.persisted ? (
                  <CheckCircle2 className="w-3 h-3 text-signal-green" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-signal-amber" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DEDUPLICATION PANEL
// ═══════════════════════════════════════════════════════════

function DedupPanel({ store }: { store: ReturnType<typeof useLibraryStore> }) {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">Deduplication & Source Linking</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When a locally-owned track is also available on a connected streaming service, DSP links them so you
                can choose your preferred source or automatically fall back to streaming if the local file is unavailable.
                Duplicate detection uses acoustic fingerprinting with configurable confidence thresholds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{store.duplicates.length}</p>
            <p className="text-[10px] text-muted-foreground">Duplicate Groups</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{store.duplicates.filter(d => !d.resolved).length}</p>
            <p className="text-[10px] text-muted-foreground">Unresolved</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{streamingAccounts.filter(a => a.connected).reduce((s, a) => s + a.linkedTrackCount, 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Streaming Links</p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Duplicate Groups</h2>
        {store.duplicates.map(group => (
          <Card key={group.id} className={`bg-card border ${group.resolved ? 'border-signal-green/20' : 'border-signal-amber/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] ${group.matchType === 'exact' ? 'border-signal-green/30 text-signal-green' : group.matchType === 'same-recording' ? 'border-signal-amber/30 text-signal-amber' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                    {group.matchType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Confidence: {group.confidence}%</span>
                </div>
                {group.resolved ? (
                  <Badge variant="outline" className="text-[9px] text-signal-green border-signal-green/30"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Resolved</Badge>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-[10px]"><Merge className="w-3 h-3 mr-0.5" /> Merge</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]"><Link2 className="w-3 h-3 mr-0.5" /> Link</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => store.resolveDuplicate(group.id, group.preferredId)}>
                      <XCircle className="w-3 h-3 mr-0.5" /> Dismiss
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {group.trackIds.map((trackId, i) => {
                  const t = tracks.find(tr => tr.id === trackId);
                  if (!t) return null;
                  const isPreferred = trackId === group.preferredId;
                  return (
                    <div key={trackId} className={`flex items-center gap-2 p-1.5 rounded text-xs ${isPreferred ? 'bg-primary/10' : 'bg-surface/30'}`}>
                      {isPreferred && <Star className="w-3 h-3 text-primary" />}
                      <span className="font-medium">{t.title}</span>
                      <span className="text-muted-foreground">— {t.artistName}</span>
                      <Badge variant="outline" className="text-[9px] font-mono ml-auto">{t.format} {t.bitDepth}bit/{formatSampleRate(t.sampleRate)}</Badge>
                      <Badge variant="outline" className="text-[9px]">{t.source}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PLAYLISTS PANEL
// ═══════════════════════════════════════════════════════════

function PlaylistsPanel({ play }: { play: (track?: typeof tracks[0]) => void }) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Playlists ({playlists.length})</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div><Label className="text-xs">Name</Label><Input placeholder="My Awesome Playlist" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Description (optional)</Label><Textarea placeholder="What is this playlist about?" className="mt-1" rows={2} /></div>
              <Button className="w-full" disabled={!newPlaylistName}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {playlists.map(pl => (
          <Card key={pl.id} className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all group">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getCoverGradient(pl.id)} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{pl.name}</p>
                  <p className="text-[11px] text-muted-foreground">{pl.trackCount} tracks · {formatDuration(pl.duration)}</p>
                  {pl.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{pl.description}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Edit3 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem><Download className="w-4 h-4 mr-2" /> Export</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                <span>Created {formatRelativeTime(pl.createdAt)}</span>
                <span>·</span>
                <span>Updated {formatRelativeTime(pl.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ListMusic className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">About Playlists</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                DSP playlists can contain both local files and streaming tracks from connected services (Tidal, Qobuz).
                Playlists are stored in the library database and can be exported for backup. When a local file becomes
                unavailable, DSP automatically falls back to the streaming version if a link exists. Smart playlists
                can be created in the Tags & Collections tab using rule-based filters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAGS & COLLECTIONS PANEL
// ═══════════════════════════════════════════════════════════

function TagsCollectionsPanel({ store }: { store: ReturnType<typeof useLibraryStore> }) {
  return (
    <div className="space-y-6">
      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Tags ({store.tags.length})</h2>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New Tag</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {store.tags.map(tag => (
            <Badge
              key={tag.id}
              className="text-xs py-1 px-3 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color + '44', borderWidth: 1 }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
              <span className="ml-1 opacity-60">({tag.trackCount})</span>
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bookmarks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Bookmarks ({store.bookmarks.length})</h2>
        </div>
        <div className="space-y-1">
          {store.bookmarks.map(bm => {
            const track = tracks.find(t => t.id === bm.trackId);
            if (!track) return null;
            return (
              <div key={bm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 transition-colors group">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 flex-shrink-0">
                  <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{bm.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{track.title} — {track.artistName}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(bm.position)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => store.removeBookmark(bm.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Smart Collections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Smart Collections ({store.collections.length})</h2>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New Collection</Button>
        </div>
        <div className="space-y-2">
          {store.collections.map(col => (
            <Card key={col.id} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{col.name}</p>
                    <p className="text-[11px] text-muted-foreground">{col.description}</p>
                    <div className="flex gap-1 mt-1">
                      {col.rules.map((rule, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] font-mono">
                          {rule.field} {rule.operator} {String(rule.value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold">{col.trackCount}</p>
                    <p className="text-[10px] text-muted-foreground">tracks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HISTORY & STATS PANEL
// ═══════════════════════════════════════════════════════════

function HistoryStatsPanel({ store, play }: { store: ReturnType<typeof useLibraryStore>; play: (track?: typeof tracks[0]) => void }) {
  const onThisDay = getOnThisDay();
  const topTracks = [...tracks].sort((a, b) => b.playCount - a.playCount).slice(0, 10);
  const totalPlayTime = tracks.reduce((s, t) => s + t.playCount * t.duration, 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold">{formatDuration(totalPlayTime)}</p>
                <p className="text-[10px] text-muted-foreground">Total Listening Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm font-bold">{tracks.filter(t => t.loved).length}</p>
                <p className="text-[10px] text-muted-foreground">Loved Tracks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-sm font-bold">{new Set(store.history.map(h => h.playedAt.slice(0, 10))).size}</p>
                <p className="text-[10px] text-muted-foreground">Active Days (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-signal-green" />
              <div>
                <p className="text-sm font-bold">{store.history.filter(h => h.completed).length}</p>
                <p className="text-[10px] text-muted-foreground">Completed Plays (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On This Day */}
      <Card className="bg-card border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> On This Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {onThisDay.map((track, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => play(track)}>
                <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{track.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                </div>
                <span className="text-[10px] text-purple-400">{track._playedYearsAgo}y ago · {track._playCountThatDay} plays</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tracks */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Most Played Tracks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {topTracks.map((track, i) => (
                <TableRow key={track.id} className="cursor-pointer hover:bg-accent/20" onClick={() => play(track)}>
                  <TableCell className="w-8 text-center text-xs font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{track.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{track.artistName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{track.albumName}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{track.playCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Play History
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => store.clearHistory()}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {store.history.slice(0, 20).map(entry => {
              const track = tracks.find(t => t.id === entry.trackId);
              if (!track) return null;
              return (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => play(track)}>
                  <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{track.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(entry.playedAt)}</span>
                  <Badge variant="outline" className="text-[9px]">{entry.source}</Badge>
                  {entry.completed ? <CheckCircle2 className="w-3 h-3 text-signal-green" /> : <Pause className="w-3 h-3 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BACKUP & RESTORE PANEL
// ═══════════════════════════════════════════════════════════

function BackupRestorePanel() {
  const [isExporting, setIsExporting] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">Library Backup & Restore</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your DSP library database contains all metadata edits, playlists, tags, bookmarks, play history,
                and settings — but not the audio files themselves (DSP indexes in place). Export a backup to
                preserve your library state independently of the audio files. You can restore this backup on
                the same or a different DSP Core instance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-signal-green" /> Export Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">Tracks</p>
              <p className="text-sm font-bold">{tracks.length}</p>
            </div>
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">Albums</p>
              <p className="text-sm font-bold">{albums.length}</p>
            </div>
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">Playlists</p>
              <p className="text-sm font-bold">{playlists.length}</p>
            </div>
            <div className="p-2 rounded bg-surface/50">
              <p className="text-xs text-muted-foreground">History</p>
              <p className="text-sm font-bold">{playHistory.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={() => setIsExporting(true)} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Full Library Backup'}
            </Button>
            {isExporting && (
              <div className="space-y-1">
                <Progress value={65} className="h-2" />
                <p className="text-[11px] text-muted-foreground text-center">Exporting library database... 65%</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1">
              <FileText className="w-3 h-3" /> JSON Format
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1">
              <Database className="w-3 h-3" /> SQLite Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Restore Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop a DSP backup file here or click to browse</p>
            <p className="text-[11px] text-muted-foreground mt-1">Supports .json and .db formats</p>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-surface/50">
            <p className="text-xs font-medium">Restore Options</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Merge with existing library (keep both)</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Overwrite metadata edits</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Replace playlists</span>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Backups */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-signal-amber" /> Scheduled Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Automatic Daily Backup</p>
              <p className="text-[11px] text-muted-foreground">Keep last 7 days of automatic backups</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="space-y-1">
            {['2026-08-12', '2026-08-11', '2026-08-10'].map(date => (
              <div key={date} className="flex items-center justify-between p-2 rounded bg-surface/30 text-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono">{date}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Download className="w-3 h-3 mr-0.5" /> Download</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Upload className="w-3 h-3 mr-0.5" /> Restore</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}