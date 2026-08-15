// GET /api/library/sync
// Loads all library tracks from PostgreSQL and returns them in the format
// expected by the Zustand local-library store.
//
// This replaces the old localStorage-based persistence.
// On app load, the hydration gate calls this to populate the library.

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const libraryTracks = await prisma.libraryTrack.findMany({
      orderBy: [{ artist: 'asc' }, { album: 'asc' }, { trackNumber: 'asc' }],
    });

    // Transform to LocalTrack format expected by the Zustand store
    const tracks = libraryTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      albumArtist: t.albumArtist,
      trackNumber: t.trackNumber,
      discNumber: t.discNumber,
      duration: t.duration,
      format: t.format,
      sampleRate: t.sampleRate,
      bitDepth: t.bitDepth,
      channels: t.channels,
      bitrate: t.bitrate,
      filePath: t.filePath,
      fileSize: t.fileSize,
      year: t.year,
      genre: t.genre,
      composer: t.composer,
      coverArt: null as string | null, // Cover art loaded separately from IndexedDB or Supabase Storage
      isLocal: t.isLocal,
      cached: !!t.storageUrl, // Has cloud storage = "cached"
      blobUrl: t.storageUrl || undefined, // Cloud CDN URL replaces blob URL
      storagePath: t.storagePath,
      storageUrl: t.storageUrl,
    }));

    return NextResponse.json({
      success: true,
      tracks,
      totalTracks: tracks.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[library/sync] Failed to sync from DB:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to sync library from database.' },
      { status: 500 },
    );
  }
}
