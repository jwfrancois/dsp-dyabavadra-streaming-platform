// ═══════════════════════════════════════════════════════
// JELLYFIN STORE — DSP Streaming Platform
// Manages all Jellyfin connection state, browse caches,
// search, and type-conversion for the UI layer.
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  jellyfinClient,
  JellyfinApiError,
  ticksToSeconds,
  type JellyfinConfig,
  type JellyfinItem,
  type JellyfinItemsResponse,
} from '@/lib/jellyfin';
import type { Track } from '@/lib/data';

// ── Types ──────────────────────────────────────────────────

export type JellyfinConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface JellyfinArtist {
  id: string;
  name: string;
  imageUrl: string;
  albumCount: number;
}

export interface JellyfinAlbum {
  id: string;
  name: string;
  artistName: string;
  artistId: string;
  year: number;
  genre: string;
  imageUrl: string;
  duration: number;
  trackCount: number;
  communityRating: number;
  isFavorite: boolean;
  overview?: string;
}

export interface JellyfinTrack {
  id: string;
  name: string;
  albumId: string;
  albumName: string;
  artistName: string;
  artistId: string;
  trackNumber: number;
  duration: number;
  format: string;
  bitrate: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  imageUrl: string;
  isFavorite: boolean;
  playCount: number;
}

export interface JellyfinPlaylist {
  id: string;
  name: string;
  imageUrl: string;
  itemCount: number;
}

export interface JellyfinSearchResults {
  artists: JellyfinArtist[];
  albums: JellyfinAlbum[];
  tracks: JellyfinTrack[];
  playlists: JellyfinPlaylist[];
}

// ── Constants ──────────────────────────────────────────────

const PAGE_SIZE = 40;

// ── Mapper Helpers ─────────────────────────────────────────

/** Map a Jellyfin Container string to a human-readable format name */
function getFormatName(container?: string): string {
  if (!container) return '';
  const lower = container.toLowerCase();
  const map: Record<string, string> = {
    flac: 'FLAC',
    mp3: 'MP3',
    wav: 'WAV',
    m4a: 'AAC',
    aac: 'AAC',
    ogg: 'OGG',
    opus: 'OPUS',
    wma: 'WMA',
    aiff: 'AIFF',
    dsd: 'DSD',
    dsf: 'DSD',
   dff: 'DSD',
  };
  return map[lower] || upperFirst(lower);
}

function upperFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Safely get an image URL from the Jellyfin client, returning an empty string on failure */
function safeGetImageUrl(
  itemId: string,
  maxWidth?: number,
  maxHeight?: number
): string {
  try {
    return jellyfinClient.getImageUrl(itemId, 'Primary', maxWidth, maxHeight);
  } catch {
    return '';
  }
}

/** Map a JellyfinItem (MusicArtist) → JellyfinArtist */
function mapArtist(item: JellyfinItem): JellyfinArtist {
  return {
    id: item.Id,
    name: item.Name,
    imageUrl: safeGetImageUrl(item.Id, 300, 300),
    albumCount: item.ChildCount ?? 0,
  };
}

/** Map a JellyfinItem (MusicAlbum) → JellyfinAlbum */
function mapAlbum(item: JellyfinItem): JellyfinAlbum {
  const artistObj = item.AlbumArtists?.[0];
  return {
    id: item.Id,
    name: item.Name,
    artistName: artistObj?.Name ?? item.AlbumArtist ?? 'Unknown Artist',
    artistId: artistObj?.Id ?? '',
    year: item.ProductionYear ?? 0,
    genre: item.Genres?.[0] ?? '',
    imageUrl: safeGetImageUrl(item.Id, 300, 300),
    duration: ticksToSeconds(item.RunTimeTicks),
    trackCount: item.ChildCount ?? 0,
    communityRating: item.CommunityRating ?? 0,
    isFavorite: item.UserData?.IsFavorite ?? false,
    overview: item.Overview,
  };
}

/** Map a JellyfinItem (Audio) → JellyfinTrack */
function mapTrack(item: JellyfinItem): JellyfinTrack {
  const artistObj = item.AlbumArtists?.[0];
  const albumArtist = artistObj?.Name ?? item.Artists?.[0] ?? 'Unknown Artist';
  const albumArtistId = artistObj?.Id ?? '';

  return {
    id: item.Id,
    name: item.Name,
    albumId: item.AlbumId ?? item.ParentId ?? '',
    albumName: '', // populated from parent context when available
    artistName: albumArtist,
    artistId: albumArtistId,
    trackNumber: 0, // Jellyfin SortName is typically "disc-track name"; use index from list
    duration: ticksToSeconds(item.RunTimeTicks),
    format: getFormatName(item.Container),
    bitrate: item.BitRate ?? 0,
    sampleRate: item.SampleRate ?? 0,
    bitDepth: item.BitsPerSample ?? 0,
    channels: item.Channels ?? 0,
    imageUrl: safeGetImageUrl(item.AlbumId ?? item.ParentId ?? item.Id, 300, 300),
    isFavorite: item.UserData?.IsFavorite ?? false,
    playCount: item.UserData?.PlayCount ?? 0,
  };
}

/** Map a JellyfinItem (Playlist) → JellyfinPlaylist */
function mapPlaylist(item: JellyfinItem): JellyfinPlaylist {
  return {
    id: item.Id,
    name: item.Name,
    imageUrl: safeGetImageUrl(item.Id, 300, 300),
    itemCount: item.ChildCount ?? item.UserData?.UnplayedItemCount ?? 0,
  };
}

/** Enrich a mapped track with album name from the album item (or parent) */
function enrichTrackWithAlbumName(track: JellyfinTrack, albumName: string): JellyfinTrack {
  return { ...track, albumName };
}

/** Build a static Jellyfin stream URL for a given item ID (synchronous) */
function buildStreamUrl(itemId: string, config: JellyfinConfig): string {
  const baseUrl = config.serverUrl.replace(/\/+$/, '');
  return `${baseUrl}/Audio/${itemId}/stream?static=true&api_key=${config.accessToken}&UserId=${config.userId}`;
}

/** Fetch the total track count and update the store (fire-and-forget helper) */
async function refreshTotalTrackCount(): Promise<void> {
  try {
    const state = useJellyfinStore.getState();
    if (state.connectionStatus !== 'connected') return;
    const response = await jellyfinClient.getItems({
      includeItemTypes: ['Audio'],
      recursive: true,
      limit: 1,
    });
    useJellyfinStore.setState({ totalTracks: response.TotalRecordCount });
  } catch {
    // Non-critical; ignore
  }
}

// ── State Interface ────────────────────────────────────────

interface JellyfinState {
  // Connection
  connectionStatus: JellyfinConnectionStatus;
  config: JellyfinConfig | null;
  error: string | null;

  // Browse cache
  artists: JellyfinArtist[];
  albums: JellyfinAlbum[];
  recentAlbums: JellyfinAlbum[];
  playlists: JellyfinPlaylist[];
  totalArtists: number;
  totalAlbums: number;
  totalTracks: number;

  // Detail cache
  currentArtistAlbums: JellyfinAlbum[];
  currentArtistTracks: JellyfinTrack[];
  currentAlbumTracks: JellyfinTrack[];
  currentPlaylistTracks: JellyfinTrack[];

  // Loading states
  isLoadingArtists: boolean;
  isLoadingAlbums: boolean;
  isLoadingTracks: boolean;
  isLoadingRecent: boolean;

  // Pagination
  artistsPage: number;
  albumsPage: number;

  // Actions — Connection
  connect: (serverUrl: string, username: string, password: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  clearError: () => void;

  // Actions — Browse
  fetchArtists: (reset?: boolean) => Promise<void>;
  fetchAlbums: (reset?: boolean) => Promise<void>;
  fetchRecentAlbums: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  loadMoreArtists: () => Promise<void>;
  loadMoreAlbums: () => Promise<void>;

  // Actions — Detail
  fetchArtistDetail: (artistId: string) => Promise<void>;
  fetchAlbumTracks: (albumId: string) => Promise<void>;
  fetchPlaylistTracks: (playlistId: string) => Promise<void>;

  // Actions — Search
  search: (query: string) => Promise<JellyfinSearchResults>;

  // Actions — Convert
  convertToTrack: (jfTrack: JellyfinTrack) => Track;

  // Actions — Helpers
  getArtistImageUrl: (itemId: string, imageTag?: string) => string;
  getAlbumImageUrl: (itemId: string, imageTag?: string) => string;
}

// ── Store ──────────────────────────────────────────────────

export const useJellyfinStore = create<JellyfinState>((set, get) => ({
  // ── Initial State ──

  connectionStatus:
    typeof window !== 'undefined' && jellyfinClient.isAuthenticated()
      ? 'connected'
      : 'disconnected',
  config: typeof window !== 'undefined' ? jellyfinClient.getConfig() : null,
  error: null,

  // Browse cache
  artists: [],
  albums: [],
  recentAlbums: [],
  playlists: [],
  totalArtists: 0,
  totalAlbums: 0,
  totalTracks: 0,

  // Detail cache
  currentArtistAlbums: [],
  currentArtistTracks: [],
  currentAlbumTracks: [],
  currentPlaylistTracks: [],

  // Loading states
  isLoadingArtists: false,
  isLoadingAlbums: false,
  isLoadingTracks: false,
  isLoadingRecent: false,

  // Pagination
  artistsPage: 0,
  albumsPage: 0,

  // ═══════════════════════════════════════════════════════
  // Connection
  // ═══════════════════════════════════════════════════════

  connect: async (serverUrl, username, password) => {
    set({ connectionStatus: 'connecting', error: null });
    try {
      const config = await jellyfinClient.connect(serverUrl, username, password);
      set({
        connectionStatus: 'connected',
        config,
        error: null,
      });
      // Auto-fetch recent albums after successful connection
      get().fetchRecentAlbums();
      return true;
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Connection failed';
      set({ connectionStatus: 'error', error: message });
      return false;
    }
  },

  disconnect: async () => {
    try {
      await jellyfinClient.disconnect();
    } catch {
      // Best-effort disconnect
    }
    set({
      connectionStatus: 'disconnected',
      config: null,
      error: null,
      artists: [],
      albums: [],
      recentAlbums: [],
      playlists: [],
      totalArtists: 0,
      totalAlbums: 0,
      totalTracks: 0,
      currentArtistAlbums: [],
      currentArtistTracks: [],
      currentAlbumTracks: [],
      currentPlaylistTracks: [],
      isLoadingArtists: false,
      isLoadingAlbums: false,
      isLoadingTracks: false,
      isLoadingRecent: false,
      artistsPage: 0,
      albumsPage: 0,
    });
  },

  clearError: () => set({ error: null }),

  // ═══════════════════════════════════════════════════════
  // Browse
  // ═══════════════════════════════════════════════════════

  fetchArtists: async (reset = false) => {
    const { connectionStatus, artistsPage } = get();
    if (connectionStatus !== 'connected') return;

    const page = reset ? 0 : artistsPage;
    set({ isLoadingArtists: true });

    try {
      const response = await jellyfinClient.getArtists({
        limit: PAGE_SIZE,
        startIndex: page * PAGE_SIZE,
      });

      const mapped = response.Items.map(mapArtist);
      set({
        artists: reset ? mapped : [...get().artists, ...mapped],
        totalArtists: response.TotalRecordCount,
        artistsPage: page + 1,
        isLoadingArtists: false,
      });

      // Also fetch total track count in the background
      if (get().totalTracks === 0) {
        refreshTotalTrackCount();
      }
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch artists';
      set({ isLoadingArtists: false, error: message });
    }
  },

  fetchAlbums: async (reset = false) => {
    const { connectionStatus, albumsPage } = get();
    if (connectionStatus !== 'connected') return;

    const page = reset ? 0 : albumsPage;
    set({ isLoadingAlbums: true });

    try {
      const response = await jellyfinClient.getAlbums({
        limit: PAGE_SIZE,
        startIndex: page * PAGE_SIZE,
      });

      const mapped = response.Items.map(mapAlbum);
      set({
        albums: reset ? mapped : [...get().albums, ...mapped],
        totalAlbums: response.TotalRecordCount,
        albumsPage: page + 1,
        isLoadingAlbums: false,
      });

      // Also fetch total track count in the background
      if (get().totalTracks === 0) {
        refreshTotalTrackCount();
      }
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch albums';
      set({ isLoadingAlbums: false, error: message });
    }
  },

  fetchRecentAlbums: async () => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') return;

    set({ isLoadingRecent: true });

    try {
      const response = await jellyfinClient.getRecentItems(20);
      // Recent items may include non-album types; filter to albums only
      const albumItems = response.Items.filter(
        item => item.Type === 'MusicAlbum'
      );
      const mapped = albumItems.map(mapAlbum);
      set({ recentAlbums: mapped, isLoadingRecent: false });
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch recent albums';
      set({ isLoadingRecent: false, error: message });
    }
  },

  fetchPlaylists: async () => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') return;

    try {
      const response = await jellyfinClient.getPlaylists();
      const mapped = response.Items.map(mapPlaylist);
      set({ playlists: mapped });
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch playlists';
      set({ error: message });
    }
  },

  loadMoreArtists: async () => {
    const { isLoadingArtists, artists, totalArtists } = get();
    if (isLoadingArtists || artists.length >= totalArtists) return;
    get().fetchArtists(false);
  },

  loadMoreAlbums: async () => {
    const { isLoadingAlbums, albums, totalAlbums } = get();
    if (isLoadingAlbums || albums.length >= totalAlbums) return;
    get().fetchAlbums(false);
  },

  // ═══════════════════════════════════════════════════════
  // Detail
  // ═══════════════════════════════════════════════════════

  fetchArtistDetail: async (artistId: string) => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') return;

    set({ isLoadingAlbums: true, isLoadingTracks: true });

    try {
      // Fetch albums by this artist
      const albumResponse = await jellyfinClient.getArtistItems(artistId, ['MusicAlbum']);
      const mappedAlbums = albumResponse.Items.map(mapAlbum);

      // Fetch tracks by this artist
      const trackResponse = await jellyfinClient.getItems({
        albumArtistIds: [artistId],
        includeItemTypes: ['Audio'],
        sortBy: 'Album,SortName',
        sortOrder: 'Ascending',
        recursive: true,
      });
      const mappedTracks = trackResponse.Items.map(item => mapTrack(item));

      // Enrich tracks with album names from the album items we just fetched
      const albumNameMap = new Map(mappedAlbums.map(a => [a.id, a.name]));
      const enrichedTracks = mappedTracks.map(t =>
        albumNameMap.has(t.albumId)
          ? enrichTrackWithAlbumName(t, albumNameMap.get(t.albumId)!)
          : t
      );

      set({
        currentArtistAlbums: mappedAlbums,
        currentArtistTracks: enrichedTracks,
        isLoadingAlbums: false,
        isLoadingTracks: false,
      });
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch artist detail';
      set({ isLoadingAlbums: false, isLoadingTracks: false, error: message });
    }
  },

  fetchAlbumTracks: async (albumId: string) => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') return;

    set({ isLoadingTracks: true });

    try {
      // Fetch the album item for name/artist info
      let albumName = '';
      try {
        const albumItem = await jellyfinClient.getItem(albumId);
        albumName = albumItem.Name;
      } catch {
        // Continue without album name
      }

      const response = await jellyfinClient.getAlbumTracks(albumId);
      const mapped = response.Items.map((item, index) => {
        const track = mapTrack(item);
        return {
          ...track,
          trackNumber: index + 1,
          albumName,
        };
      });

      set({ currentAlbumTracks: mapped, isLoadingTracks: false });
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch album tracks';
      set({ isLoadingTracks: false, error: message });
    }
  },

  fetchPlaylistTracks: async (playlistId: string) => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') return;

    set({ isLoadingTracks: true });

    try {
      const response = await jellyfinClient.getPlaylistItems(playlistId);
      const mapped = response.Items.map((item, index) => {
        const track = mapTrack(item);
        return {
          ...track,
          trackNumber: index + 1,
        };
      });

      set({ currentPlaylistTracks: mapped, isLoadingTracks: false });
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch playlist tracks';
      set({ isLoadingTracks: false, error: message });
    }
  },

  // ═══════════════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════════════

  search: async (query: string) => {
    const { connectionStatus } = get();
    if (connectionStatus !== 'connected') {
      return { artists: [], albums: [], tracks: [], playlists: [] };
    }

    try {
      const response = await jellyfinClient.search(query);

      const artists: JellyfinArtist[] = [];
      const albums: JellyfinAlbum[] = [];
      const tracks: JellyfinTrack[] = [];
      const playlists: JellyfinPlaylist[] = [];

      for (const item of response.Items) {
        switch (item.Type) {
          case 'MusicArtist':
            artists.push(mapArtist(item));
            break;
          case 'MusicAlbum':
            albums.push(mapAlbum(item));
            break;
          case 'Audio':
            tracks.push(mapTrack(item));
            break;
          case 'Playlist':
            playlists.push(mapPlaylist(item));
            break;
        }
      }

      return { artists, albums, tracks, playlists };
    } catch (err) {
      const message =
        err instanceof JellyfinApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Search failed';
      set({ error: message });
      return { artists: [], albums: [], tracks: [], playlists: [] };
    }
  },

  // ═══════════════════════════════════════════════════════
  // Convert
  // ═══════════════════════════════════════════════════════

  convertToTrack: (jfTrack: JellyfinTrack): Track => {
    const config = get().config;
    const filePath = config
      ? buildStreamUrl(jfTrack.id, config)
      : `jellyfin://${jfTrack.id}`;

    return {
      id: `jf-${jfTrack.id}`,
      title: jfTrack.name,
      albumId: `jf-${jfTrack.albumId}`,
      albumName: jfTrack.albumName,
      artistId: `jf-${jfTrack.artistId}`,
      artistName: jfTrack.artistName,
      trackNumber: jfTrack.trackNumber,
      discNumber: 1,
      duration: jfTrack.duration,
      format: jfTrack.format,
      bitDepth: jfTrack.bitDepth,
      sampleRate: jfTrack.sampleRate,
      channels: jfTrack.channels,
      bitrate: jfTrack.bitrate,
      filePath,
      fileSize: 0,
      composers: [],
      performers: [],
      genre: '',
      loved: jfTrack.isFavorite,
      playCount: jfTrack.playCount,
      source: 'local',
      isAvailable: true,
    };
  },

  // ═══════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════

  getArtistImageUrl: (itemId: string, _imageTag?: string): string => {
    return safeGetImageUrl(itemId, 300, 300);
  },

  getAlbumImageUrl: (itemId: string, _imageTag?: string): string => {
    return safeGetImageUrl(itemId, 300, 300);
  },
}));
