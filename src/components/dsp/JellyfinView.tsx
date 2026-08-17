'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useJellyfinStore, type JellyfinArtist, type JellyfinAlbum, type JellyfinTrack } from '@/store/jellyfin';
import { jellyfinClient } from '@/lib/jellyfin';
import { formatDuration, formatSampleRate, formatFileSize, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Play, Pause, ArrowLeft, Heart, Search, Server, Wifi, WifiOff,
  Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Music, Disc3, User, ListMusic, Library, Globe, ChevronRight,
  Clock, Gauge, Shield, Eye, EyeOff, ArrowRight, Star, ExternalLink,
  Radio, Volume2, FolderOpen, Box, Plug, Unplug, Settings,
  Zap, Album, Mic2, Users, Grid3X3, List, SkipForward,
  PlayCircle, RadioStation, Signal,
} from 'lucide-react';

// ─── Types ───

type JellyfinTab = 'albums' | 'artists' | 'tracks' | 'playlists' | 'recent';
type ViewMode = 'grid' | 'list';

// ─── Cover Art Fallback ───

function CoverArt({ url, name, size = 'md', rounded = 'lg' }: { url: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-full aspect-square',
    full: 'w-full aspect-square',
  };
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-xl',
  };
  const [error, setError] = useState(false);

  return (
    <div className={`${sizeClasses[size]} ${roundedClasses[rounded]} overflow-hidden bg-surface flex-shrink-0 relative`}>
      {url && !error ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-blue-900/60 flex items-center justify-center">
          <Music className="w-1/3 h-1/3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

// ─── Connection Panel ───

function ConnectionPanel() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { connectionStatus, error, config, connect, disconnect, clearError } = useJellyfinStore();

  useEffect(() => {
    if (config?.serverUrl) setServerUrl(config.serverUrl);
    if (config?.username) setUsername(config.username);
  }, [config]);

  const handleConnect = useCallback(async () => {
    clearError();
    const url = serverUrl.trim().replace(/\/+$/, '');
    if (!url || !username.trim()) return;
    await connect(url, username.trim(), password);
  }, [serverUrl, username, password, connect, clearError]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  if (connectionStatus === 'connected' && config) {
    return (
      <Card className="border-border bg-card mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <Server className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{config.serverName}</h3>
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {config.serverUrl}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {config.username}
                </span>
                <span className="flex items-center gap-1">
                  <Box className="w-3 h-3" /> v{config.serverVersion}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-950/30 flex-shrink-0"
              onClick={handleDisconnect}
            >
              <Unplug className="w-3 h-3" /> Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Connect to Jellyfin</h3>
            <p className="text-xs text-muted-foreground">Enter your Jellyfin server details to browse your music library</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Server URL</label>
              <Input
                placeholder="https://jellyfin.example.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="bg-surface/50 border-border"
                disabled={connectionStatus === 'connecting'}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <Input
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-surface/50 border-border"
                disabled={connectionStatus === 'connecting'}
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface/50 border-border pr-10"
              disabled={connectionStatus === 'connecting'}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/30">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting' || !serverUrl.trim() || !username.trim()}
          >
            {connectionStatus === 'connecting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
              </>
            ) : (
              <>
                <Plug className="w-4 h-4" /> Connect to Server
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-950/20 border border-blue-800/20">
          <Shield className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your credentials are stored locally in this browser. DSP connects directly to your Jellyfin server — no data is sent to any third party.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab Navigation ───

function TabBar({ active, onChange }: { active: JellyfinTab; onChange: (tab: JellyfinTab) => void }) {
  const { totalArtists, totalAlbums, totalTracks, playlists } = useJellyfinStore();
  const tabs: { key: JellyfinTab; label: string; icon: typeof Album; count?: number }[] = [
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'albums', label: 'Albums', icon: Disc3, count: totalAlbums },
    { key: 'artists', label: 'Artists', icon: User, count: totalArtists },
    { key: 'tracks', label: 'Tracks', icon: Music, count: totalTracks },
    { key: 'playlists', label: 'Playlists', icon: ListMusic, count: playlists.length },
  ];

  return (
    <div className="flex gap-1 mb-6 bg-surface/30 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
            active === tab.key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface/60'
          }`}
        >
          <tab.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`${active === tab.key ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
              ({tab.count > 999 ? `${(tab.count / 1000).toFixed(1)}k` : tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Album Grid Card ───

function AlbumCard({ album, onPlay, onAlbumClick }: { album: JellyfinAlbum; onPlay: () => void; onAlbumClick: () => void }) {
  return (
    <Card className="bg-card border-border group hover:border-primary/30 transition-all cursor-pointer">
      <CardContent className="p-0">
        <div className="relative" onClick={onAlbumClick}>
          <CoverArt url={album.imageUrl} name={album.name} size="full" rounded="xl" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button size="sm" className="rounded-full w-12 h-12 shadow-lg" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            </Button>
          </div>
          {album.isFavorite && (
            <div className="absolute top-2 right-2">
              <Heart className="w-4 h-4 text-red-400 fill-red-400 drop-shadow" />
            </div>
          )}
        </div>
        <div className="p-3 pt-2.5">
          <h3 className="text-sm font-medium truncate" title={album.name}>{album.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/70">
            {album.year > 0 && <span>{album.year}</span>}
            {album.genre && <span className="truncate max-w-[80px]">{album.genre}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Artist List Item ───

function ArtistRow({ artist, onClick }: { artist: JellyfinArtist; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/20 transition-colors w-full text-left group"
    >
      <CoverArt url={artist.imageUrl} name={artist.name} size="lg" rounded="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
        <p className="text-xs text-muted-foreground">{artist.albumCount} album{artist.albumCount !== 1 ? 's' : ''}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

// ─── Track Row ───

function TrackRow({ track, trackNumber, onPlay, isPlaying, isCurrent }: { track: JellyfinTrack; trackNumber: number; onPlay: () => void; isPlaying: boolean; isCurrent: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
        isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-accent/20'
      }`}
    >
      <span className={`w-8 text-xs text-right tabular-nums flex-shrink-0 ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
        {isCurrent && isPlaying ? (
          <Volume2 className="w-3.5 h-3.5 ml-auto text-primary animate-pulse" />
        ) : isCurrent ? (
          <Play className="w-3.5 h-3.5 ml-auto text-primary" fill="currentColor" />
        ) : (
          trackNumber
        )}
      </span>
      <CoverArt url={track.imageUrl} name={track.name} size="sm" rounded="sm" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isCurrent ? 'font-medium text-primary' : ''}`}>{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {track.artistName} · {track.albumName}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground/70 flex-shrink-0">
        {track.format && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono uppercase">{track.format}</Badge>}
        {track.sampleRate > 0 && <span>{(track.sampleRate / 1000).toFixed(0)}kHz</span>}
        {track.bitDepth > 0 && <span>{track.bitDepth}bit</span>}
      </div>
      <span className="text-xs text-muted-foreground/70 tabular-nums w-10 text-right flex-shrink-0">
        {track.duration > 0 ? formatDuration(track.duration) : '--:--'}
      </span>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={onPlay}>
        {isCurrent && isPlaying ? (
          <Pause className="w-4 h-4 text-primary" />
        ) : (
          <Play className="w-4 h-4 text-primary" fill="currentColor" />
        )}
      </button>
    </div>
  );
}

// ─── Playlist Row ───

function PlaylistRow({ playlist, onClick }: { playlist: { id: string; name: string; imageUrl: string; itemCount: number }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/20 transition-colors w-full text-left group"
    >
      <CoverArt url={playlist.imageUrl} name={playlist.name} size="lg" rounded="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{playlist.name}</p>
        <p className="text-xs text-muted-foreground">{playlist.itemCount} tracks</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

// ─── Albums Grid ───

function AlbumsGrid({ albums, onAlbumClick, onAlbumPlay }: { albums: JellyfinAlbum[]; onAlbumClick: (album: JellyfinAlbum) => void; onAlbumPlay: (album: JellyfinAlbum) => void }) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <Disc3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No albums found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {albums.map(album => (
        <AlbumCard
          key={album.id}
          album={album}
          onPlay={() => onAlbumPlay(album)}
          onAlbumClick={() => onAlbumClick(album)}
        />
      ))}
    </div>
  );
}

// ─── Empty State ───

function EmptyState({ icon: Icon, title, description }: { icon: typeof Library; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN JELLYFIN VIEW
// ═══════════════════════════════════════════════════════════

export function JellyfinView() {
  const { navigate } = useUIStore();
  const { setQueue, play, currentTrack, isPlaying } = usePlayerStore();
  const store = useJellyfinStore();

  const [activeTab, setActiveTab] = useState<JellyfinTab>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const isConnected = store.connectionStatus === 'connected';
  const { isLoadingAlbums, isLoadingArtists, isLoadingTracks, isLoadingRecent } = store;

  // ── Data Fetching ──
  useEffect(() => {
    if (!isConnected) return;
    switch (activeTab) {
      case 'albums': store.fetchAlbums(true); break;
      case 'artists': store.fetchArtists(true); break;
      case 'tracks': store.fetchAlbums(true); break; // tracks shown within albums
      case 'playlists': store.fetchPlaylists(); break;
      case 'recent': store.fetchRecentAlbums(); break;
    }
  }, [activeTab, isConnected]);

  // ── Player Actions ──
  const handlePlayAlbum = useCallback(async (album: JellyfinAlbum) => {
    if (!isConnected) return;
    await store.fetchAlbumTracks(album.id);
    const tracks = useJellyfinStore.getState().currentAlbumTracks;
    if (tracks.length === 0) return;
    const dspTracks = tracks.map(t => store.convertToTrack(t));
    setQueue(dspTracks, 0);
  }, [isConnected, setQueue]);

  const handlePlayTrack = useCallback((track: JellyfinTrack) => {
    const dspTrack = store.convertToTrack(track);
    play(dspTrack);
  }, [play]);

  const handleAlbumClick = useCallback((album: JellyfinAlbum) => {
    navigate('jellyfin-album', { albumId: album.id });
  }, [navigate]);

  const handleArtistClick = useCallback((artist: JellyfinArtist) => {
    navigate('jellyfin-artist', { artistId: artist.id });
  }, [navigate]);

  const handlePlaylistClick = useCallback((playlist: { id: string }) => {
    navigate('jellyfin-playlist', { playlistId: playlist.id });
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'albums') store.loadMoreAlbums();
    else if (activeTab === 'artists') store.loadMoreArtists();
  }, [activeTab]);

  // ── Filter ──
  const filteredAlbums = useMemo(() => {
    if (!searchQuery) return store.albums;
    const q = searchQuery.toLowerCase();
    return store.albums.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.artistName.toLowerCase().includes(q) ||
      (a.genre && a.genre.toLowerCase().includes(q))
    );
  }, [store.albums, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!searchQuery) return store.artists;
    const q = searchQuery.toLowerCase();
    return store.artists.filter(a => a.name.toLowerCase().includes(q));
  }, [store.artists, searchQuery]);

  // ── Current track check ──
  const isTrackPlaying = useCallback((track: JellyfinTrack) => {
    return currentTrack?.id === `jf-${track.id}`;
  }, [currentTrack]);

  // ── Render Tab Content ──
  const renderContent = () => {
    const loading = isLoadingAlbums || isLoadingArtists || isLoadingTracks || isLoadingRecent;

    if (loading && store.albums.length === 0 && store.artists.length === 0 && store.recentAlbums.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-sm text-muted-foreground">Loading library...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'recent':
        return (
          <>
            {store.recentAlbums.length === 0 ? (
              <EmptyState icon={Clock} title="No recent additions" description="Recently added albums from your Jellyfin library will appear here" />
            ) : (
              <AlbumsGrid albums={store.recentAlbums} onAlbumClick={handleAlbumClick} onAlbumPlay={handlePlayAlbum} />
            )}
          </>
        );

      case 'albums':
        return (
          <>
            {filteredAlbums.length === 0 ? (
              <EmptyState icon={Disc3} title="No albums" description="Browse your Jellyfin music library by album" />
            ) : (
              <AlbumsGrid albums={filteredAlbums} onAlbumClick={handleAlbumClick} onAlbumPlay={handlePlayAlbum} />
            )}
            {store.albums.length > filteredAlbums.length && (
              <div className="text-center mt-6">
                <Button variant="outline" size="sm" onClick={store.loadMoreAlbums} disabled={isLoadingAlbums}>
                  {isLoadingAlbums ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Load More Albums
                </Button>
              </div>
            )}
          </>
        );

      case 'artists':
        return (
          <>
            {filteredArtists.length === 0 ? (
              <EmptyState icon={User} title="No artists" description="Album artists from your Jellyfin library will appear here" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {filteredArtists.map(artist => (
                  <ArtistRow key={artist.id} artist={artist} onClick={() => handleArtistClick(artist)} />
                ))}
              </div>
            )}
            {store.artists.length > filteredArtists.length && (
              <div className="text-center mt-6">
                <Button variant="outline" size="sm" onClick={store.loadMoreArtists} disabled={isLoadingArtists}>
                  {isLoadingArtists ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Load More Artists
                </Button>
              </div>
            )}
          </>
        );

      case 'tracks':
        return (
          <>
            {filteredAlbums.length === 0 ? (
              <EmptyState icon={Music} title="No tracks" description="Browse your Jellyfin tracks by album" />
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-muted-foreground -mt-2">Tracks are organized by album. Click an album to view its tracks.</p>
                <AlbumsGrid albums={filteredAlbums} onAlbumClick={handleAlbumClick} onAlbumPlay={handlePlayAlbum} />
              </div>
            )}
          </>
        );

      case 'playlists':
        return (
          <>
            {store.playlists.length === 0 ? (
              <EmptyState icon={ListMusic} title="No playlists" description="Playlists from your Jellyfin library will appear here" />
            ) : (
              <div className="space-y-1">
                {store.playlists.map(pl => (
                  <PlaylistRow key={pl.id} playlist={pl} onClick={() => handlePlaylistClick(pl)} />
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server className="w-6 h-6 text-purple-400" />
              Jellyfin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isConnected
                ? `Browsing ${store.config?.serverName || 'Jellyfin'} library`
                : 'Connect to your Jellyfin media server'}
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Connection Panel ── */}
        <ConnectionPanel />

        {/* ── Library Content (only when connected) ── */}
        {isConnected && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search albums, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border max-w-md"
              />
            </div>

            {/* Tabs */}
            <TabBar active={activeTab} onChange={setActiveTab} />

            {/* Content */}
            {renderContent()}
          </>
        )}

        {/* ── Info Card ── */}
        <Separator className="my-8 bg-border" />
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              About Jellyfin Integration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface/50">
                <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">Open Source &amp; Private</p>
                  <p className="mt-0.5">Jellyfin is the free software media system. No tracking, no ads, no subscriptions. Your library stays on your server.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface/50">
                <Gauge className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">Hi-Res Audio Support</p>
                  <p className="mt-0.5">Stream FLAC, WAV, DSD, and other lossless formats from Jellyfin through DSP with full signal path visualization.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface/50">
                <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">Direct Play</p>
                  <p className="mt-0.5">Audio is streamed directly from your server without transcoding, preserving the original quality and format.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface/50">
                <Signal className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">DSP Processing</p>
                  <p className="mt-0.5">Jellyfin audio flows through your DSP pipeline — parametric EQ, room correction, upsampling, and all other modules.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
