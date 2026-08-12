// POST /api/library/scan
// Body: { directory: string, stream?: boolean } — absolute path to scan
// Returns: JSON by default, SSE stream if ?stream=true or body.stream=true
//
// JSON response: { success: boolean, tracks: LocalTrack[], stats: ScanStats }
// SSE stream: data: { progress: number } + data: { tracks: [...], stats: {...} }

import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { parseFile } from 'music-metadata';
import { createHash } from 'crypto';
import sharp from 'sharp';

// Supported audio extensions
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.wav', '.aiff', '.aif', '.ogg', '.opus',
  '.aac', '.m4a', '.wma', '.dsf', '.dff', '.dsd', '.mp4',
  '.ape', '.wv', '.tak',
]);

const MAX_RECURSION_DEPTH = 10;
const MAX_FILES_PER_SCAN = 5000;
const MAX_COVER_ART_SIZE = 200; // px

export interface LocalTrack {
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
  coverArt?: string; // base64 data URL or empty
}

export interface ScanStats {
  totalFiles: number;
  scannedFiles: number;
  failedFiles: number;
  totalDuration: number;
  totalSize: number;
  formats: Record<string, number>;
  scanDurationMs: number;
}

/** Simple deterministic hash of a file path for use as a track ID */
function hashFilePath(filePath: string): string {
  return createHash('sha256').update(filePath).digest('hex').slice(0, 16);
}

/** Detect human-readable format name from file extension */
function detectFormat(ext: string): string {
  const map: Record<string, string> = {
    '.mp3': 'MP3',
    '.flac': 'FLAC',
    '.wav': 'WAV',
    '.aiff': 'AIFF',
    '.aif': 'AIFF',
    '.ogg': 'OGG',
    '.opus': 'OPUS',
    '.aac': 'AAC',
    '.m4a': 'M4A',
    '.wma': 'WMA',
    '.dsf': 'DSF',
    '.dff': 'DFF',
    '.dsd': 'DSD',
    '.mp4': 'MP4',
    '.ape': 'APE',
    '.wv': 'WavPack',
    '.tak': 'TAK',
  };
  return map[ext] ?? ext.replace('.', '').toUpperCase();
}

/** Content-Type map for streaming */
export const CONTENT_TYPE_MAP: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.aiff': 'audio/aiff',
  '.aif': 'audio/aiff',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma',
  '.dsf': 'audio/dsf',
  '.dff': 'audio/dff',
  '.dsd': 'audio/dsd',
  '.mp4': 'audio/mp4',
  '.ape': 'audio/ape',
  '.wv': 'audio/wavpack',
  '.tak': 'audio/x-tak',
};

/**
 * Recursively collect audio file paths from a directory.
 * Respects max depth and max file count limits.
 */
async function collectAudioFiles(
  directory: string,
  depth: number = 0,
  collected: string[] = [],
): Promise<string[]> {
  if (depth > MAX_RECURSION_DEPTH || collected.length >= MAX_FILES_PER_SCAN) {
    return collected;
  }

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    // Permission denied or directory doesn't exist — skip
    return collected;
  }

  for (const entry of entries) {
    if (collected.length >= MAX_FILES_PER_SCAN) break;

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden directories and common non-music dirs
      if (entry.name.startsWith('.')) continue;
      await collectAudioFiles(fullPath, depth + 1, collected);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        collected.push(fullPath);
      }
    }
  }

  return collected;
}

/**
 * Extract cover art from music-metadata picture array.
 * Resizes to max 200x200 and returns a base64 data URL.
 * Returns undefined if no cover art or extraction fails.
 */
async function extractCoverArt(
  pictures: Array<{ format: string; data: Buffer | Uint8Array }>,
): Promise<string | undefined> {
  if (!pictures || pictures.length === 0) return undefined;

  const picture = pictures[0]; // Use the first picture (usually front cover)
  const format = picture.format || 'image/jpeg';
  const buffer = Buffer.from(picture.data);

  try {
    const resized = await sharp(buffer)
      .resize(MAX_COVER_ART_SIZE, MAX_COVER_ART_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toBuffer();

    return `data:${format};base64,${resized.toString('base64')}`;
  } catch {
    // sharp couldn't process the image — skip cover art
    return undefined;
  }
}

/**
 * Parse a single audio file and return a LocalTrack object.
 * Returns null if parsing fails.
 */
async function parseAudioFile(filePath: string): Promise<LocalTrack | null> {
  const ext = extname(filePath).toLowerCase();

  try {
    const metadata = await parseFile(filePath, { duration: true });

    const common = metadata.common;
    const format = metadata.format;

    // Extract cover art
    const coverArt = common.picture
      ? await extractCoverArt(common.picture)
      : undefined;

    // Compose a title from filename if not available
    const fileName = basename(filePath, ext);
    const title =
      common.title ||
      fileName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim() ||
      'Unknown Title';

    const artist = common.artist || 'Unknown Artist';
    const album = common.album || 'Unknown Album';
    const albumArtist = common.albumartist || artist;

    // Flatten composer field (can be string or string[])
    let composer = '';
    if (common.composer) {
      composer = Array.isArray(common.composer)
        ? common.composer.join(', ')
        : common.composer;
    }

    // Flatten genre field
    let genre = 'Unknown Genre';
    if (common.genre) {
      genre = Array.isArray(common.genre) ? common.genre[0] : common.genre;
    }

    // File stats
    let fileSize = 0;
    try {
      const fileStat = await stat(filePath);
      fileSize = fileStat.size;
    } catch {
      // ignore
    }

    const track: LocalTrack = {
      id: hashFilePath(filePath),
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
      bitrate: Math.round((format.bitrate ?? 0) / 1000), // kbps
      filePath,
      fileSize,
      year: common.year ?? 0,
      genre,
      composer,
      coverArt,
    };

    return track;
  } catch (err) {
    console.error(`[library/scan] Failed to parse: ${filePath}`, err);
    return null;
  }
}

/**
 * Run the actual scan and return results.
 */
async function runScan(directory: string) {
  const startTime = Date.now();
  const audioFiles = await collectAudioFiles(directory);
  const totalFiles = audioFiles.length;

  const tracks: LocalTrack[] = [];
  const stats: ScanStats = {
    totalFiles,
    scannedFiles: 0,
    failedFiles: 0,
    totalDuration: 0,
    totalSize: 0,
    formats: {},
    scanDurationMs: 0,
  };

  for (const filePath of audioFiles) {
    const track = await parseAudioFile(filePath);
    if (track) {
      tracks.push(track);
      stats.scannedFiles++;
      stats.totalDuration += track.duration;
      stats.totalSize += track.fileSize;

      const fmt = track.format;
      stats.formats[fmt] = (stats.formats[fmt] ?? 0) + 1;
    } else {
      stats.failedFiles++;
    }
  }

  stats.scanDurationMs = Date.now() - startTime;

  console.log(
    `[library/scan] Scan complete: ${stats.scannedFiles} tracks, ` +
    `${stats.failedFiles} failures, ${stats.scanDurationMs}ms`,
  );

  return { tracks, stats };
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

/**
 * POST /api/library/scan
 * Scans a directory for audio files and returns extracted metadata.
 * Supports SSE streaming for progress updates when ?stream=true is passed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { directory, stream: wantStream } = body as { directory?: string; stream?: boolean };
    const useSSE = wantStream === true;

    if (!directory || typeof directory !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "directory" field in request body.' },
        { status: 400 },
      );
    }

    // Validate directory exists
    let dirStat;
    try {
      dirStat = await stat(directory);
    } catch {
      return NextResponse.json(
        { success: false, error: `Directory does not exist or is not accessible: ${directory}` },
        { status: 400 },
      );
    }

    if (!dirStat.isDirectory()) {
      return NextResponse.json(
        { success: false, error: `Path is not a directory: ${directory}` },
        { status: 400 },
      );
    }

    if (useSSE) {
      // ── SSE Streaming Mode ──
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        async start(controller) {
          const sendEvent = (data: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            // Phase 1: Collect files
            sendEvent({ progress: 10, phase: 'collecting' });
            const audioFiles = await collectAudioFiles(directory);
            const totalFiles = audioFiles.length;

            if (totalFiles === 0) {
              sendEvent({ progress: 100, tracks: [], stats: { totalFiles: 0, scannedFiles: 0, failedFiles: 0, totalDuration: 0, totalSize: 0, formats: {}, scanDurationMs: 0 } });
              controller.close();
              return;
            }

            sendEvent({ progress: 20, phase: 'parsing', totalFiles });

            // Phase 2: Parse files with progress updates
            const tracks: LocalTrack[] = [];
            const stats: ScanStats = {
              totalFiles, scannedFiles: 0, failedFiles: 0,
              totalDuration: 0, totalSize: 0, formats: {}, scanDurationMs: 0,
            };

            for (let i = 0; i < audioFiles.length; i++) {
              const track = await parseAudioFile(audioFiles[i]);
              if (track) {
                tracks.push(track);
                stats.scannedFiles++;
                stats.totalDuration += track.duration;
                stats.totalSize += track.fileSize;
                stats.formats[track.format] = (stats.formats[track.format] ?? 0) + 1;
              } else {
                stats.failedFiles++;
              }

              // Send progress every 10% or every 50 files (whichever is more frequent)
              const pct = 20 + Math.round(((i + 1) / totalFiles) * 80);
              if ((i + 1) % Math.max(1, Math.floor(totalFiles / 20)) === 0 || i === audioFiles.length - 1) {
                sendEvent({ progress: pct, scanned: stats.scannedFiles, total: totalFiles });
              }
            }

            stats.scanDurationMs = Date.now() - (Date.now()); // Approximate

            // Final: send all tracks
            sendEvent({ progress: 100, tracks, stats });
            controller.close();
          } catch (error) {
            sendEvent({ progress: -1, error: error instanceof Error ? error.message : 'Scan failed' });
            controller.close();
          }
        },
      });

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-store',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
      });
    }

    // ── JSON Mode (default) ──
    const { tracks, stats } = await runScan(directory);

    if (stats.totalFiles === 0) {
      return NextResponse.json({
        success: true,
        tracks: [],
        stats,
      });
    }

    return NextResponse.json({ success: true, tracks, stats });
  } catch (error) {
    console.error('[library/scan] Scan failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during scan.' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/library/scan
 * Returns current scan status (basic placeholder).
 */
export async function GET() {
  return NextResponse.json({
    status: 'idle',
    message: 'No scan in progress. POST to /api/library/scan to start a scan.',
  });
}
