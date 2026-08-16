import { useState, useEffect, useCallback, useRef } from 'react';

export interface LyricsResult {
  source: string;
  sourceName: string;
  preview: string;
  fullLyricsUrl: string;
  error?: string;
}

export interface ArtistBioResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  readMoreUrl: string;
  error?: string;
}

export interface AlbumInfoResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  readMoreUrl: string;
  error?: string;
}

export interface ArtistImageResult {
  imageUrl: string;
  source: string;
  artist: string;
  error?: string;
}

export interface SimilarArtistsResult {
  artist: string;
  results: Array<{ name: string; snippet: string; url: string; source: string }>;
  error?: string;
}

export interface ComposerBioResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  readMoreUrl: string;
  error?: string;
}

export interface GenreInfoResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  readMoreUrl: string;
  characteristics?: string;
  origins?: string;
  moods?: string[];
  error?: string;
}

export interface AlbumCreditsResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  error?: string;
}

export interface TrackInfoResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  error?: string;
}

export interface AlbumReviewResult {
  summaries: Array<{ title: string; snippet: string; url: string; source: string }>;
  rating?: string;
  error?: string;
}

export interface SearchResult {
  query: string;
  results: Array<{ title: string; snippet: string; url: string; source: string; date: string }>;
  error?: string;
}

// ─── Generic fetch with cache ───

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min client cache

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data as T;
  memoryCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

async function fetchAPI<T>(url: string, cacheKey: string): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  setCache(cacheKey, data);
  return data as T;
}

// ─── Lyrics Hook ───

export function useLyrics(artist: string, title: string) {
  const [data, setData] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !title || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'lyrics', artist, title });
    fetchAPI<LyricsResult>(`/api/music-metadata?${params}`, `lyrics:${artist}:${title}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, title]);

  return { data, loading, error };
}

// ─── Artist Biography Hook ───

export function useArtistBio(artist: string, enabled = true) {
  const [data, setData] = useState<ArtistBioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'artist-bio', artist });
    fetchAPI<ArtistBioResult>(`/api/music-metadata?${params}`, `bio:${artist}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, enabled]);

  return { data, loading, error };
}

// ─── Album Info Hook ───

export function useAlbumInfo(artist: string, album: string, enabled = true) {
  const [data, setData] = useState<AlbumInfoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !album || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'album-info', artist, album });
    fetchAPI<AlbumInfoResult>(`/api/music-metadata?${params}`, `album:${artist}:${album}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, album, enabled]);

  return { data, loading, error };
}

// ─── Discography Hook ───

export function useDiscography(artist: string, enabled = true) {
  const [data, setData] = useState<ArtistBioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'discography', artist });
    fetchAPI<ArtistBioResult>(`/api/music-metadata?${params}`, `discog:${artist}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, enabled]);

  return { data, loading, error };
}

// ─── Generic Search Hook ───

export function useMusicSearch(query: string, enabled = false) {
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({ query });
    fetchAPI<SearchResult>(`/api/music-metadata?${params}`, `search:${query}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (enabled && query) search();
  }, [enabled, query, search]);

  return { data, loading, error, search };
}

// ─── Artist Image Hook ───

export function useArtistImage(artist: string, enabled = true) {
  const [data, setData] = useState<ArtistImageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'artist-image', artist });
    fetchAPI<ArtistImageResult>(`/api/music-metadata?${params}`, `artist-img:${artist}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, enabled]);

  return { data, loading, error };
}

// ─── Similar Artists Hook ───

export function useSimilarArtists(artist: string, enabled = true) {
  const [data, setData] = useState<SimilarArtistsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'similar-artists', artist });
    fetchAPI<SimilarArtistsResult>(`/api/music-metadata?${params}`, `similar:${artist}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, enabled]);

  return { data, loading, error };
}

// ─── Composer Biography Hook ───

export function useComposerBio(artist: string, enabled = true) {
  const [data, setData] = useState<ComposerBioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'composer-bio', artist });
    fetchAPI<ComposerBioResult>(`/api/music-metadata?${params}`, `composer-bio:${artist}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, enabled]);

  return { data, loading, error };
}

// ─── Genre Info Hook ───

export function useGenreInfo(query: string, enabled = true) {
  const [data, setData] = useState<GenreInfoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!query || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'genre-info', query });
    fetchAPI<GenreInfoResult>(`/api/music-metadata?${params}`, `genre:${query}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, enabled]);

  return { data, loading, error };
}

// ─── Album Credits Hook ───

export function useAlbumCredits(artist: string, album: string, enabled = true) {
  const [data, setData] = useState<AlbumCreditsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !album || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'album-credits', artist, album });
    fetchAPI<AlbumCreditsResult>(`/api/music-metadata?${params}`, `credits:${artist}:${album}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, album, enabled]);

  return { data, loading, error };
}

// ─── Track Info Hook ───

export function useTrackInfo(artist: string, title: string, enabled = true) {
  const [data, setData] = useState<TrackInfoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !title || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'track-info', artist, title });
    fetchAPI<TrackInfoResult>(`/api/music-metadata?${params}`, `track:${artist}:${title}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, title, enabled]);

  return { data, loading, error };
}

// ─── Album Review Hook ───

export function useAlbumReview(artist: string, album: string, enabled = true) {
  const [data, setData] = useState<AlbumReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!artist || !album || !enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: 'album-review', artist, album });
    fetchAPI<AlbumReviewResult>(`/api/music-metadata?${params}`, `review:${artist}:${album}`)
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [artist, album, enabled]);

  return { data, loading, error };
}
