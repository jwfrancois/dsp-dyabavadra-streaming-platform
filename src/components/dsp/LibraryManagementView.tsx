'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import {
  storageLocations, streamingAccounts, libraryScan, userTags,
  smartCollections, bookmarks, playHistory, duplicateGroups, metadataEdits,
  formatStorageSize, formatScanDuration, formatRelativeTime,
  getStorageStatusColor, getStorageStatusLabel,
  getServiceIcon, getServiceLabel, getTotalLibraryStats,
  getOnThisDay,
} from '@/lib/library-data';
import { tracks, albums, artists, playlists, formatDuration, getCoverGradient, formatSampleRate, formatFileSize } from '@/lib/data';
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
  Database, Archive, Shield, FileText, Music2, Disc3, Mic2,
  BarChart3, TrendingUp, Calendar, Volume2, Zap, Search, MoreHorizontal,
  Scissors, Merge, Split, Layers, Radio, Cloud, Settings,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LibraryManagementView() {
  const { navigate } = useUIStore();
  const { play } = usePlayerStore();
  const store = useLibraryStore();
  const [activeTab, setActiveTab] = React.useState('sources');

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
            <TabsTrigger value="sources" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Sources</TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs gap-1.5"><ScanSearch className="w-3.5 h-3.5" /> Scanner</TabsTrigger>
            <TabsTrigger value="metadata" className="text-xs gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Metadata</TabsTrigger>
            <TabsTrigger value="dedup" className="text-xs gap-1.5"><Layers className="w-3.5 h-3.5" /> Dedup</TabsTrigger>
            <TabsTrigger value="playlists" className="text-xs gap-1.5"><ListMusic className="w-3.5 h-3.5" /> Playlists</TabsTrigger>
            <TabsTrigger value="tags" className="text-xs gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags & Collections</TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> History</TabsTrigger>
            <TabsTrigger value="backup" className="text-xs gap-1.5"><Archive className="w-3.5 h-3.5" /> Backup</TabsTrigger>
          </TabsList>

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

// Import for ListMusic used in PlaylistsPanel
import { ListMusic } from 'lucide-react';
