// POST /api/library/save — Save entire library metadata to server-side JSON
// GET  /api/library/save — Load library metadata from server-side JSON
//
// This provides server-side persistence for the music library so that:
// 1. Data survives browser storage clearing (localStorage/IndexedDB wipe)
// 2. Data survives cross-origin changes (preview → production URLs on Vercel)
// 3. Audio blobs in IndexedDB can be re-linked to their metadata
//
// NOTE: Audio blobs are NOT uploaded to the server (too large).
// Only track metadata (without audio) is persisted server-side.
// On restore, the client must re-import audio files to rebuild IndexedDB cache.

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';

const LIBRARY_DIR = join(process.cwd(), 'data');
const LIBRARY_FILE = join(LIBRARY_DIR, 'library-backup.json');

// ── Types ──

interface LibraryBackup {
  version: number;
  savedAt: string;
  tracks: Array<{
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
    isLocal: boolean;
  }>;
  directories: string[];
  lastScanTime: string | null;
  scanStats: {
    totalFiles: number;
    scannedFiles: number;
    failedFiles: number;
    totalDuration: number;
    totalSize: number;
    formats: Record<string, number>;
    scanDurationMs: number;
  } | null;
}

// ── GET: Load library backup ──

export async function GET() {
  try {
    const raw = await readFile(LIBRARY_FILE, 'utf-8');
    const backup: LibraryBackup = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      backup: {
        ...backup,
        savedAt: backup.savedAt,
        trackCount: backup.tracks.length,
      },
    });
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        backup: null,
        message: 'No library backup found on server.',
      });
    }
    console.error('[library/save] Failed to read backup:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to read library backup.' },
      { status: 500 },
    );
  }
}

// ── POST: Save library backup ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tracks, directories, lastScanTime, scanStats } = body;

    if (!Array.isArray(tracks)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "tracks" array.' },
        { status: 400 },
      );
    }

    await mkdir(LIBRARY_DIR, { recursive: true });

    const backup: LibraryBackup = {
      version: 1,
      savedAt: new Date().toISOString(),
      tracks: tracks.map((t: any) => ({
        id: t.id,
        title: t.title || 'Unknown',
        artist: t.artist || 'Unknown Artist',
        album: t.album || 'Unknown Album',
        albumArtist: t.albumArtist || t.artist || 'Unknown Artist',
        trackNumber: t.trackNumber ?? 0,
        discNumber: t.discNumber ?? 0,
        duration: t.duration ?? 0,
        format: t.format || 'Unknown',
        sampleRate: t.sampleRate ?? 0,
        bitDepth: t.bitDepth ?? 0,
        channels: t.channels ?? 0,
        bitrate: t.bitrate ?? 0,
        filePath: t.filePath || '',
        fileSize: t.fileSize ?? 0,
        year: t.year ?? 0,
        genre: t.genre || 'Unknown',
        composer: t.composer || '',
        isLocal: t.isLocal ?? false,
      })),
      directories: Array.isArray(directories) ? directories : [],
      lastScanTime: lastScanTime || null,
      scanStats: scanStats || null,
    };

    const json = JSON.stringify(backup, null, 2);
    await writeFile(LIBRARY_FILE, json, 'utf-8');

    console.log(
      `[library/save] Saved ${backup.tracks.length} tracks to ${LIBRARY_FILE}`,
    );

    return NextResponse.json({
      success: true,
      trackCount: backup.tracks.length,
      savedAt: backup.savedAt,
    });
  } catch (err) {
    console.error('[library/save] Failed to save backup:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save library backup.' },
      { status: 500 },
    );
  }
}

// ── DELETE: Clear library backup ──

export async function DELETE() {
  try {
    await unlink(LIBRARY_FILE);
    return NextResponse.json({ success: true, message: 'Library backup deleted.' });
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return NextResponse.json({ success: true, message: 'No backup to delete.' });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete library backup.' },
      { status: 500 },
    );
  }
}
