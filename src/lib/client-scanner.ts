// src/lib/client-scanner.ts
// Client-side music file scanner that runs entirely in the browser.
// Uses the File API + music-metadata parseBlob to extract metadata
// from audio files selected by the user.
//
// Supports:
//   - Folder selection via <input webkitdirectory> or showDirectoryPicker()
//   - Individual file selection
//   - Drag & drop
//   - Progress reporting via callback
//   - Audio blob caching in IndexedDB for playback

import { parseBlob } from 'music-metadata';
import { storeAudioTrack, storeCoverArt } from './audio-db';

// ── Types ──

export interface ScannedTrack {
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
  fileName: string;
  fileSize: number;
  year: number;
  genre: string;
  composer: string;
  coverArt?: string; // base64 data URL
  isLocal: true;     // Mark as client-side scanned
  cached?: boolean;  // Whether audio blob is in IndexedDB
  _blobUrl?: string; // Internal: blob URL for immediate playback
}

export interface ScanProgress {
  phase: 'reading' | 'parsing' | 'caching' | 'done';
  current: number;
  total: number;
  fileName?: string;
  tracksFound: number;
}

// ── Config ──

const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'aiff', 'aif', 'ogg', 'opus',
  'aac', 'm4a', 'wma', 'dsf', 'dff', 'dsd', 'mp4',
  'ape', 'wv', 'tak',
]);

const MAX_FILES = 5000;

// ── Helpers ──

/** Deterministic hash from file name + size for track ID */
function hashFile(file: File): string {
  const raw = `${file.name}:${file.size}:${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/** Get extension from file name */
function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Detect format name from extension */
function detectFormat(ext: string): string {
  const map: Record<string, string> = {
    mp3: 'MP3', flac: 'FLAC', wav: 'WAV', aiff: 'AIFF', aif: 'AIFF',
    ogg: 'OGG', opus: 'OPUS', aac: 'AAC', m4a: 'M4A', wma: 'WMA',
    dsf: 'DSF', dff: 'DFF', dsd: 'DSD', mp4: 'MP4',
    ape: 'APE', wv: 'WavPack', tak: 'TAK',
  };
  return map[ext] || ext.toUpperCase();
}

/** Extract cover art from picture metadata to base64 data URL */
function extractCoverArt(
  pictures: Array<{ format: string; data: Uint8Array }>,
): string | undefined {
  if (!pictures || pictures.length === 0) return undefined;
  try {
    const pic = pictures[0];
    const base64 = btoa(
      Array.from(pic.data)
        .map(b => String.fromCharCode(b))
        .join(''),
    );
    return `data:${pic.format || 'image/jpeg'};base64,${base64}`;
  } catch {
    return undefined;
  }
}

// ── Scanner ──

/** Filter audio files from a list of File objects. */
function filterAudioFiles(files: File[]): File[] {
  return files.filter(file => {
    if (file.name.startsWith('.')) return false;
    const ext = getExtension(file.name);
    return AUDIO_EXTENSIONS.has(ext);
  });
}

/** Scan a single audio file and extract metadata + cache audio. */
async function scanSingleFile(
  file: File,
  cacheAudio: boolean,
): Promise<ScannedTrack | null> {
  const ext = getExtension(file.name);
  const trackId = hashFile(file);

  try {
    const metadata = await parseBlob(file);
    const common = metadata.common;
    const format = metadata.format;

    const coverArt = common.picture
      ? extractCoverArt(common.picture)
      : undefined;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    const title =
      common.title ||
      baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim() ||
      'Unknown Title';

    const artist = common.artist || 'Unknown Artist';
    const album = common.album || 'Unknown Album';
    const albumArtist = common.albumartist || artist;

    let composer = '';
    if (common.composer) {
      composer = Array.isArray(common.composer)
        ? common.composer.join(', ')
        : common.composer;
    }

    let genre = 'Unknown Genre';
    if (common.genre) {
      genre = Array.isArray(common.genre) ? common.genre[0] : common.genre;
    }

    const track: ScannedTrack = {
      id: trackId,
      title,
      artist,
      album,
      albumArtist,
      trackNumber: common.track?.no ?? 0,
      discNumber: common.disk?.no ?? 0,
      duration: format.duration ?? 0,
      format: detectFormat(ext),
      sampleRate: format.sampleRate ?? 0,
      bitDepth: format.bitsPerSample ?? 0,
      channels: format.numberOfChannels ?? 0,
      bitrate: Math.round((format.bitrate ?? 0) / 1000),
      fileName: file.name,
      fileSize: file.size,
      year: common.year ?? 0,
      genre,
      composer,
      coverArt,
      isLocal: true,
      cached: false,
    };

    // Cache audio blob in IndexedDB for playback
    if (cacheAudio) {
      try {
        await storeAudioTrack(trackId, file, {
          title, artist, album, albumArtist, format: track.format,
          fileName: file.name, fileSize: file.size,
        });
        track.cached = true;
      } catch (err) {
        console.warn('[client-scanner] Failed to cache audio:', err);
      }
    }

    // Store cover art in IndexedDB (separate from localStorage to avoid quota)
    if (coverArt) {
      try {
        await storeCoverArt(trackId, coverArt);
      } catch (err) {
        console.warn('[client-scanner] Failed to cache cover art:', err);
      }
    }

    // Create blob URL for immediate playback (lives as long as page is open)
    track._blobUrl = URL.createObjectURL(file);

    return track;
  } catch (err) {
    console.warn(`[client-scanner] Failed to parse: ${file.name}`, err);
    return null;
  }
}

/**
 * Scan an array of File objects (from folder picker, file input, or drag-and-drop).
 * Reports progress via callback. Returns scanned tracks.
 */
export async function scanFiles(
  files: File[],
  options: {
    cacheAudio?: boolean;
    maxFiles?: number;
    onProgress?: (progress: ScanProgress) => void;
  } = {},
): Promise<ScannedTrack[]> {
  const {
    cacheAudio = true,
    maxFiles = MAX_FILES,
    onProgress,
  } = options;

  const audioFiles = filterAudioFiles(files).slice(0, maxFiles);
  const total = audioFiles.length;

  onProgress?.({
    phase: 'reading',
    current: 0,
    total,
    tracksFound: 0,
  });

  const tracks: ScannedTrack[] = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];

    onProgress?.({
      phase: 'parsing',
      current: i + 1,
      total,
      fileName: file.name,
      tracksFound: tracks.length,
    });

    const track = await scanSingleFile(file, cacheAudio);
    if (track) {
      tracks.push(track);
    }
  }

  onProgress?.({
    phase: 'done',
    current: total,
    total,
    tracksFound: tracks.length,
  });

  console.log(
    `[client-scanner] Scan complete: ${tracks.length} tracks from ${audioFiles.length} audio files`,
  );

  return tracks;
}

/**
 * Open a folder picker and scan all audio files found.
 * Uses the File System Access API if available, falls back to <input webkitdirectory>.
 */
export async function scanFolder(
  options: {
    cacheAudio?: boolean;
    onProgress?: (progress: ScanProgress) => void;
  } = {},
): Promise<ScannedTrack[]> {
  const { cacheAudio = true, onProgress } = options;

  // Try File System Access API first (Chromium browsers)
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });
      const files: File[] = [];

      async function collectFiles(handle: any, path: string = '') {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path ? `${path}/${file.name}` : file.name,
              writable: false,
            });
            files.push(file);
          } else if (entry.kind === 'directory') {
            await collectFiles(entry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      }

      await collectFiles(dirHandle);
      return scanFiles(files, { cacheAudio, onProgress });
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return [];
      console.warn('[client-scanner] showDirectoryPicker failed, falling back:', err);
    }
  }

  // Fallback: trigger a hidden <input webkitdirectory>
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      const tracks = await scanFiles(files, { cacheAudio, onProgress });
      resolve(tracks);
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}

/**
 * Open a file picker for individual audio files.
 */
export async function scanSelectedFiles(
  options: {
    cacheAudio?: boolean;
    onProgress?: (progress: ScanProgress) => void;
  } = {},
): Promise<ScannedTrack[]> {
  const { cacheAudio = true, onProgress } = options;

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = Array.from(AUDIO_EXTENSIONS)
      .map(ext => `.${ext}`)
      .join(',');

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      const tracks = await scanFiles(files, { cacheAudio, onProgress });
      resolve(tracks);
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}
