// ═══════════════════════════════════════════════════════
// JELLYFIN API CLIENT — DSP Streaming Platform
// ═══════════════════════════════════════════════════════

// ─── Constants ───

const STORAGE_KEY = 'dsp-jellyfin-config';
const DEFAULT_MAX_BITRATE = 128000000; // 128 Mbps — effectively unlimited, lets server decide
const TICKS_PER_SECOND = 10000000;

// ─── Error Classes ───

export class JellyfinApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly path?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'JellyfinApiError';
  }
}

export class JellyfinNotAuthenticatedError extends Error {
  constructor() {
    super('Jellyfin client is not authenticated. Call connect() first.');
    this.name = 'JellyfinNotAuthenticatedError';
  }
}

// ─── Types ───

/** Persisted Jellyfin connection configuration */
export interface JellyfinConfig {
  serverUrl: string;       // e.g., "https://jellyfin.example.com"
  username: string;
  accessToken: string;
  userId: string;
  serverId: string;
  serverName: string;
  serverVersion: string;
  connectedAt: string;      // ISO date
  lastHeartbeat: string;    // ISO date
  musicLibraryId: string;   // the media folder ID for "Music"
}

/** Generic Jellyfin API item (music album, track, artist, etc.) */
export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;          // 'MusicAlbum', 'MusicArtist', 'Audio', 'Playlist', 'CollectionFolder'
  SortName?: string;
  ProductionYear?: number;
  PremiereDate?: string;
  Overview?: string;
  CommunityRating?: number;
  OfficialRating?: string;
  Genres?: string[];
  Tags?: string[];
  Studios?: Array<{ Name: string; Id: string }>;
  Artists?: string[];
  AlbumArtists?: Array<{ Name: string; Id: string }>;
  AlbumArtist?: string;
  AlbumId?: string;
  ArtistItems?: Array<{ Name: string; Id: string }>;
  RunTimeTicks?: number;   // Jellyfin uses ticks (1 tick = 100ns = 0.0001ms)
  ParentId?: string;
  Path?: string;
  Size?: number;
  Container?: string;       // "mp3", "flac", "wav", "m4a", etc.
  BitRate?: number;         // in bps
  SampleRate?: number;
  BitsPerSample?: number;
  Channels?: number;
  Width?: number;
  Height?: number;
  ImageTags?: Record<string, string>;  // { "Primary": "guid" }
  BackdropImageTags?: string[];
  UserData?: {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    UnplayedItemCount?: number;
    PlayedPercentage?: number;
  };
  People?: Array<{
    Id: string;
    Name: string;
    Role: string;
    Type: string;
    PrimaryImageTag?: string;
  }>;
  ChildCount?: number;
}

/** Paged items response from Jellyfin */
export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

/** Authentication response from /Users/AuthenticateByName */
export interface JellyfinAuthResponse {
  User: JellyfinItem & {
    ServerId: string;
    HasPassword: boolean;
    AccessToken: string;
  };
  AccessToken: string;
  ServerId: string;
}

/** Server info from /System/Info */
export interface JellyfinSystemInfo {
  Id: string;
  ServerName: string;
  Version: string;
  ProductName: string;
  OperatingSystem: string;
  OperatingSystemDisplayName: string;
  HasPendingRestart: boolean;
  CanSelfRestart: boolean;
  HttpServerPortNumber: number;
  HttpsPortNumber: number;
  SupportsRemoteControl: boolean;
  SupportsLibraryManagement: boolean;
  LocalAddress: string;
}

/** Playback info from /Items/{id}/PlaybackInfo */
export interface JellyfinPlaybackInfo {
  MediaSources: Array<{
    Id: string;
    Name: string;
    Path: string;
    Size: number;
    Container: string;
    Bitrate: number;
    MediaStreams: Array<{
      Codec: string;
      Type: string;
      Language?: string;
      SampleRate?: number;
      BitDepth?: number;
      Channels?: number;
      BitRate?: number;
      Index: number;
    }>;
    SupportsTranscoding: boolean;
    SupportsDirectStream: boolean;
    SupportsDirectPlay: boolean;
    TranscodingUrl?: string;
    DirectStreamUrl?: string;
  }>;
}

// ─── Utility Functions ───

/** Convert Jellyfin ticks (100ns units) to seconds */
export function ticksToSeconds(ticks: number | undefined): number {
  if (ticks === undefined || ticks === null) return 0;
  return Math.floor(ticks / TICKS_PER_SECOND);
}

/** Convert seconds to Jellyfin ticks */
export function secondsToTicks(seconds: number): number {
  return Math.floor(seconds * TICKS_PER_SECOND);
}

/** Strip trailing slash from a URL */
function normalizeServerUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Build a query string from a record, filtering out undefined/null/empty values */
function buildQueryString(params: Record<string, string | number | boolean | undefined | null | string[] | number[]>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${value.map(v => encodeURIComponent(String(v))).join(',')}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

// ─── Client Class ───

export class JellyfinClient {
  private config: JellyfinConfig | null = null;
  private storageAvailable = true;

  constructor() {
    // Check if localStorage is available (SSR-safe)
    try {
      const testKey = '__dsp_jellyfin_test__';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
      } else {
        this.storageAvailable = false;
      }
    } catch {
      this.storageAvailable = false;
    }

    // Auto-load persisted config
    this.config = this.loadConfig();
  }

  // ═══════════════════════════════════════════════════════
  // Persistence
  // ═══════════════════════════════════════════════════════

  private saveConfig(): void {
    if (!this.config) return;
    if (this.storageAvailable && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch {
        // Storage full or unavailable — silently fail
      }
    }
  }

  private loadConfig(): JellyfinConfig | null {
    if (!this.storageAvailable || typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as JellyfinConfig;
      // Basic validation
      if (!parsed.serverUrl || !parsed.accessToken || !parsed.userId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════
  // Core HTTP
  // ═══════════════════════════════════════════════════════

  private getBaseUrl(): string {
    if (!this.config) throw new JellyfinNotAuthenticatedError();
    return normalizeServerUrl(this.config.serverUrl);
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) throw new JellyfinNotAuthenticatedError();
    return {
      'X-Emby-Token': this.config.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<T>(path: string, options: RequestInit = {}, skipAuth = false): Promise<T> {
    const injectedBaseUrl = (options.headers as Record<string, string> | undefined)?.__baseUrl;
    const baseUrl = skipAuth
      ? normalizeServerUrl(injectedBaseUrl || '')
      : this.getBaseUrl();
    const url = `${baseUrl}${path}`;

    // Build headers — extract __baseUrl before passing to fetch
    const externalHeaders = { ...(options.headers as Record<string, string> | undefined) };
    delete externalHeaders['__baseUrl'];

    const headers: Record<string, string> = skipAuth
      ? externalHeaders
      : {
          ...this.getHeaders(),
          ...externalHeaders,
        };

    // Remove Content-Type for GET/DELETE if no body
    if (!options.body && (options.method === 'GET' || options.method === 'DELETE')) {
      delete headers['Content-Type'];
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err) {
      throw new JellyfinApiError(
        `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        0,
        path,
        err
      );
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      throw new JellyfinApiError(
        `Jellyfin API error ${response.status}: ${response.statusText} — ${errorBody}`,
        response.status,
        path
      );
    }

    // Some endpoints return empty responses (e.g., DELETE, favorite toggles)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return undefined as unknown as T;
  }

  // ═══════════════════════════════════════════════════════
  // Authentication
  // ═══════════════════════════════════════════════════════

  /**
   * Connect to a Jellyfin server. Authenticates and fetches server info.
   * Persists the configuration to localStorage.
   */
  async connect(serverUrl: string, username: string, password: string): Promise<JellyfinConfig> {
    const baseUrl = normalizeServerUrl(serverUrl);

    // Step 1: Authenticate (skip auth headers — we don't have a token yet)
    const authResponse = await this.request<JellyfinAuthResponse>(
      '/Users/AuthenticateByName',
      {
        method: 'POST',
        body: JSON.stringify({ Username: username, Pw: password }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `MediaBrowser Client="DSP", Device="Browser", DeviceId="dsp-jellyfin-${typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 32).replace(/[^a-zA-Z0-9]/g, '') : 'ssr'}", Version="1.0.0"`,
          '__baseUrl': baseUrl,
        } as Record<string, string>,
      },
      true // skipAuth
    );

    const token = authResponse.AccessToken;
    const userId = authResponse.User.Id;
    const serverId = authResponse.ServerId;

    // Step 2: Fetch server info
    let serverName = 'Jellyfin';
    let serverVersion = 'unknown';
    try {
      // Temporarily set config for the getSystemInfo call
      this.config = {
        serverUrl: baseUrl,
        username,
        accessToken: token,
        userId,
        serverId,
        serverName,
        serverVersion,
        connectedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        musicLibraryId: '',
      };
      const sysInfo = await this.getSystemInfo();
      serverName = sysInfo.ServerName;
      serverVersion = sysInfo.Version;
    } catch {
      // If system info fails, continue with defaults
    }

    // Step 3: Auto-detect music library
    let musicLibraryId = '';
    try {
      const views = await this.getViews();
      const musicFolder = views.Items.find(
        item => item.Type === 'CollectionFolder' && item.Name.toLowerCase().includes('music')
      );
      if (musicFolder) {
        musicLibraryId = musicFolder.Id;
      }
    } catch {
      // Continue without auto-detected library
    }

    // Step 4: Build and save config
    const config: JellyfinConfig = {
      serverUrl: baseUrl,
      username,
      accessToken: token,
      userId,
      serverId,
      serverName,
      serverVersion,
      connectedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      musicLibraryId,
    };

    this.config = config;
    this.saveConfig();

    return config;
  }

  /**
   * Disconnect from the Jellyfin server. Revokes the token and clears local state.
   */
  async disconnect(): Promise<void> {
    if (this.config) {
      try {
        await this.request<void>(`/Users/${this.config.userId}/Tokens`, {
          method: 'DELETE',
        });
      } catch {
        // Best-effort — continue clearing local state
      }
    }

    this.config = null;
    if (this.storageAvailable && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  /** Check if the client has a valid authenticated configuration */
  isAuthenticated(): boolean {
    return !!(
      this.config &&
      this.config.accessToken &&
      this.config.userId &&
      this.config.serverUrl
    );
  }

  /** Get the current configuration, or null if not authenticated */
  getConfig(): JellyfinConfig | null {
    return this.config;
  }

  // ═══════════════════════════════════════════════════════
  // Server Info
  // ═══════════════════════════════════════════════════════

  /** Fetch system/server info */
  async getSystemInfo(): Promise<JellyfinSystemInfo> {
    return this.request<JellyfinSystemInfo>('/System/Info');
  }

  // ═══════════════════════════════════════════════════════
  // Library Browsing
  // ═══════════════════════════════════════════════════════

  /**
   * Get all media folders / views (Music, Movies, TV, etc.)
   */
  async getViews(): Promise<JellyfinItemsResponse> {
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Views`
    );
  }

  /**
   * Set the music library folder ID for scoped browsing.
   */
  setMusicLibrary(libraryId: string): void {
    if (!this.config) throw new JellyfinNotAuthenticatedError();
    this.config.musicLibraryId = libraryId;
    this.saveConfig();
  }

  // ═══════════════════════════════════════════════════════
  // Items
  // ═══════════════════════════════════════════════════════

  /**
   * Generic items query. Supports all major Jellyfin /Users/{userId}/Items parameters.
   */
  async getItems(params: {
    parentId?: string;
    includeItemTypes?: string[];
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    limit?: number;
    startIndex?: number;
    searchTerm?: string;
    fields?: string[];
    recursive?: boolean;
    genres?: string[];
    artistIds?: string[];
    albumArtistIds?: string[];
    years?: number[];
    ids?: string[];
    filters?: string[];
  }): Promise<JellyfinItemsResponse> {
    const defaultFields = [
      'PrimaryImageAspectRatio',
      'BasicSyncInfo',
      'Genres',
      'Overview',
      'People',
      'ProductionYear',
      'CommunityRating',
    ];

    const qs = buildQueryString({
      UserId: this.config!.userId,
      ParentId: params.parentId,
      IncludeItemTypes: params.includeItemTypes,
      SortBy: params.sortBy,
      SortOrder: params.sortOrder,
      Limit: params.limit,
      StartIndex: params.startIndex,
      SearchTerm: params.searchTerm,
      Fields: params.fields ?? defaultFields,
      Recursive: params.recursive,
      Genres: params.genres,
      ArtistIds: params.artistIds,
      AlbumArtistIds: params.albumArtistIds,
      Years: params.years,
      Ids: params.ids,
      Filters: params.filters,
    });

    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items${qs}`
    );
  }

  /** Fetch a single item by ID */
  async getItem(itemId: string): Promise<JellyfinItem> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'Overview',
        'People',
        'ProductionYear',
        'CommunityRating',
      ],
    });
    return this.request<JellyfinItem>(`/Users/${this.config!.userId}/Items/${itemId}${qs}`);
  }

  /** Get recently added items */
  async getRecentItems(limit: number = 20): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      Limit: limit,
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'Overview',
        'People',
        'ProductionYear',
        'CommunityRating',
      ],
      ParentId: this.config?.musicLibraryId || undefined,
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items/Recent${qs}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // Artists
  // ═══════════════════════════════════════════════════════

  /**
   * Browse album artists.
   */
  async getArtists(params?: {
    limit?: number;
    startIndex?: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      Limit: params?.limit,
      StartIndex: params?.startIndex,
      SearchTerm: params?.searchTerm,
      SortBy: params?.sortBy ?? 'SortName',
      SortOrder: params?.sortOrder ?? 'Ascending',
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'SortName',
      ],
    });
    return this.request<JellyfinItemsResponse>(
      `/Artists/AlbumArtists${qs}`
    );
  }

  /**
   * Get items (albums, tracks) for a specific artist.
   */
  async getArtistItems(artistId: string, types?: string[]): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      IncludeItemTypes: types ?? ['MusicAlbum'],
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'ProductionYear',
        'CommunityRating',
      ],
    });
    return this.request<JellyfinItemsResponse>(
      `/Artists/${artistId}/Items${qs}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // Albums
  // ═══════════════════════════════════════════════════════

  /**
   * Browse albums with optional filtering.
   */
  async getAlbums(params?: {
    limit?: number;
    startIndex?: number;
    sortBy?: string;
    sortOrder?: string;
    artistIds?: string[];
    genres?: string[];
    years?: number[];
    searchTerm?: string;
  }): Promise<JellyfinItemsResponse> {
    const queryParams: Record<string, unknown> = {
      UserId: this.config!.userId,
      IncludeItemTypes: ['MusicAlbum'],
      SortBy: params?.sortBy ?? 'SortName',
      SortOrder: params?.sortOrder ?? 'Ascending',
      Recursive: true,
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'ProductionYear',
        'CommunityRating',
        'Overview',
      ],
    };

    if (params?.limit !== undefined) queryParams.Limit = params.limit;
    if (params?.startIndex !== undefined) queryParams.StartIndex = params.startIndex;
    if (params?.searchTerm) queryParams.SearchTerm = params.searchTerm;
    if (params?.artistIds?.length) queryParams.AlbumArtistIds = params.artistIds;
    if (params?.genres?.length) queryParams.Genres = params.genres;
    if (params?.years?.length) queryParams.Years = params.years;

    // Scope to music library if set
    if (this.config?.musicLibraryId) {
      queryParams.ParentId = this.config.musicLibraryId;
    }

    const qs = buildQueryString(queryParams as Record<string, string | number | boolean | undefined | null | string[] | number[]>);
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items${qs}`
    );
  }

  /**
   * Get all tracks in an album.
   */
  async getAlbumTracks(albumId: string): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      ParentId: albumId,
      IncludeItemTypes: ['Audio'],
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'MediaSources',
        'MediaStreams',
      ],
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items${qs}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // Playlists
  // ═══════════════════════════════════════════════════════

  /** Get all playlists */
  async getPlaylists(limit: number = 100): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      IncludeItemTypes: ['Playlist'],
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Recursive: true,
      Fields: ['PrimaryImageAspectRatio', 'BasicSyncInfo'],
      Limit: limit,
    });
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items${qs}`
    );
  }

  /** Get the items (tracks) in a playlist */
  async getPlaylistItems(playlistId: string): Promise<JellyfinItemsResponse> {
    const qs = buildQueryString({
      UserId: this.config!.userId,
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'MediaSources',
        'MediaStreams',
      ],
    });
    return this.request<JellyfinItemsResponse>(
      `/Playlists/${playlistId}/Items${qs}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════════════

  /**
   * Search across the library. Defaults to searching albums, artists, and tracks.
   */
  async search(
    query: string,
    types: string[] = ['MusicAlbum', 'MusicArtist', 'Audio', 'Playlist'],
    limit: number = 30
  ): Promise<JellyfinItemsResponse> {
    const queryParams: Record<string, unknown> = {
      UserId: this.config!.userId,
      SearchTerm: query,
      IncludeItemTypes: types,
      Recursive: true,
      Limit: limit,
      Fields: [
        'PrimaryImageAspectRatio',
        'BasicSyncInfo',
        'Genres',
        'ProductionYear',
        'CommunityRating',
        'Overview',
        'MediaSources',
        'MediaStreams',
      ],
    };

    // Scope to music library if set
    if (this.config?.musicLibraryId) {
      queryParams.ParentId = this.config.musicLibraryId;
    }

    const qs = buildQueryString(queryParams as Record<string, string | number | boolean | undefined | null | string[] | number[]>);
    return this.request<JellyfinItemsResponse>(
      `/Users/${this.config!.userId}/Items${qs}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // Playback
  // ═══════════════════════════════════════════════════════

  /**
   * Get a playable audio stream URL for an item.
   * Prefers direct play for best quality; falls back to transcoded stream.
   */
  async getPlaybackStreamUrl(
    itemId: string,
    maxBitrate: number = DEFAULT_MAX_BITRATE
  ): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const token = this.config!.accessToken;
    const userId = this.config!.userId;

    try {
      // Request playback info to determine best playback method
      const playbackInfo = await this.request<JellyfinPlaybackInfo>(
        `/Items/${itemId}/PlaybackInfo`,
        {
          method: 'POST',
          body: JSON.stringify({
            UserId: userId,
            MaxStreamingBitrate: maxBitrate,
            AutoOpenLiveStreams: true,
          }),
        }
      );

      if (playbackInfo.MediaSources && playbackInfo.MediaSources.length > 0) {
        const source = playbackInfo.MediaSources[0];

        // Prefer direct play — best quality, no server transcoding
        if (source.SupportsDirectPlay) {
          return `${baseUrl}/Audio/${itemId}/stream?static=true&api_key=${token}&UserId=${userId}`;
        }

        // Fallback to direct stream
        if (source.SupportsDirectStream && source.DirectStreamUrl) {
          return `${baseUrl}${source.DirectStreamUrl}`;
        }

        // Fallback to transcoded stream (HLS)
        if (source.SupportsTranscoding && source.TranscodingUrl) {
          return `${baseUrl}${source.TranscodingUrl}`;
        }

        // Last resort: construct a universal audio transcoding URL
        const container = source.Container || 'mp3';
        return `${baseUrl}/Audio/${itemId}/universal?api_key=${token}&UserId=${userId}&MaxStreamingBitrate=${maxBitrate}&Container=${container}&TranscodingMaxAudioChannels=2&SegmentContainer=ts&AudioCodec=aac&Protocol=hls`;
      }
    } catch {
      // If playback info fails, fall back to direct stream URL
    }

    // Fallback: try static stream directly
    return `${baseUrl}/Audio/${itemId}/stream?static=true&api_key=${token}&UserId=${userId}`;
  }

  // ═══════════════════════════════════════════════════════
  // Images
  // ═══════════════════════════════════════════════════════

  /**
   * Get the cover art / image URL for an item.
   */
  getImageUrl(
    itemId: string,
    imageType: string = 'Primary',
    maxWidth?: number,
    maxHeight?: number
  ): string {
    if (!this.config) throw new JellyfinNotAuthenticatedError();

    const baseUrl = this.getBaseUrl();
    const token = this.config.accessToken;

    const params: Record<string, string | number> = {
      api_key: token,
    };

    if (maxWidth) params.maxWidth = maxWidth;
    if (maxHeight) params.maxHeight = maxHeight;

    const qs = buildQueryString(params);
    return `${baseUrl}/Items/${itemId}/Images/${imageType}${qs}`;
  }

  // ═══════════════════════════════════════════════════════
  // Favorites
  // ═══════════════════════════════════════════════════════

  /**
   * Toggle favorite status on an item.
   */
  async toggleFavorite(itemId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.request<void>(`/Users/${this.config!.userId}/FavoriteItems/${itemId}`, {
        method: 'POST',
      });
    } else {
      await this.request<void>(`/Users/${this.config!.userId}/FavoriteItems/${itemId}`, {
        method: 'DELETE',
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // Session / Playback Reporting
  // ═══════════════════════════════════════════════════════

  /**
   * Report that playback has started for an item.
   */
  async reportPlaybackStart(itemId: string): Promise<void> {
    const item = await this.getItem(itemId);
    await this.request<void>('/Sessions/Playing', {
      method: 'POST',
      body: JSON.stringify({
        CanSeek: true,
        ItemId: itemId,
        PlaySessionId: `dsp-${Date.now()}`,
        MediaSourceId: itemId,
        IsPaused: false,
        IsMuted: false,
        PositionTicks: 0,
        RunTimeTicks: item.RunTimeTicks ?? 0,
        VolumeLevel: 100,
      }),
    });
  }

  /**
   * Report that playback has stopped for an item.
   */
  async reportPlaybackStopped(itemId: string, positionTicks: number): Promise<void> {
    await this.request<void>('/Sessions/Playing/Stopped', {
      method: 'POST',
      body: JSON.stringify({
        ItemId: itemId,
        PlaySessionId: `dsp-${Date.now()}`,
        MediaSourceId: itemId,
        PositionTicks: positionTicks,
      }),
    });
  }

  // ═══════════════════════════════════════════════════════
  // Heartbeat
  // ═══════════════════════════════════════════════════════

  /**
   * Send a heartbeat to keep the session alive and update lastHeartbeat.
   */
  async sendHeartbeat(): Promise<void> {
    if (!this.config) return;

    try {
      await this.request<void>('/Sessions/Capabilities', {
        method: 'POST',
        body: JSON.stringify({
          PlayableMediaTypes: ['Audio'],
          SupportedCommands: [
            'Play',
            'PlayNext',
            'PlayPrevious',
            'Stop',
            'Seek',
            'Mute',
            'Unmute',
            'ToggleMute',
            'VolumeUp',
            'VolumeDown',
            'SetVolume',
            'SetRepeatMode',
            'SetShuffleMode',
          ],
          SupportsMediaControl: true,
          SupportsPersistentIdentifier: true,
        }),
      });

      this.config.lastHeartbeat = new Date().toISOString();
      this.saveConfig();
    } catch {
      // Heartbeat failure is non-critical
    }
  }
}

// ═══════════════════════════════════════════════════════
// Singleton Export
// ═══════════════════════════════════════════════════════

export const jellyfinClient = new JellyfinClient();
