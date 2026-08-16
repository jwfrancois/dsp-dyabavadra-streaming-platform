// GET  /api/tracks         — List all library tracks from PostgreSQL
// POST /api/tracks         — Batch upsert library tracks (called after import)
// POST /api/tracks/upload  — Upload a single audio file to Supabase Storage
//
// This API replaces the old localStorage/IndexedDB-only persistence.
// Now track metadata lives in PostgreSQL and audio blobs in Supabase Storage.

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

// ── GET: List all library tracks ──

export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 503 },
    );
  }

  try {
    const tracks = await prisma.libraryTrack.findMany({
      orderBy: [{ artist: 'asc' }, { album: 'asc' }, { trackNumber: 'asc' }],
    });

    return NextResponse.json({ success: true, tracks });
  } catch (err) {
    console.error('[api/tracks] Failed to list tracks:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to list tracks.' },
      { status: 500 },
    );
  }
}

// ── POST: Batch upsert library tracks ──
// Body: { tracks: LibraryTrack[] }
// Uses upsert to handle re-imports (same track ID = update, new ID = create)

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { tracks } = body;

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty tracks array.' },
        { status: 400 },
      );
    }

    // Batch upsert — Prisma doesn't have native bulk upsert for all databases,
    // so we use createMany with skipDuplicates + a manual update loop for existing
    const results = { created: 0, updated: 0 };

    for (const track of tracks) {
      const existing = await prisma.libraryTrack.findUnique({
        where: { id: track.id },
      });

      if (existing) {
        await prisma.libraryTrack.update({
          where: { id: track.id },
          data: {
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumArtist: track.albumArtist || '',
            trackNumber: track.trackNumber ?? 0,
            discNumber: track.discNumber ?? 0,
            duration: track.duration ?? 0,
            format: track.format || 'FLAC',
            sampleRate: track.sampleRate ?? 44100,
            bitDepth: track.bitDepth ?? 16,
            channels: track.channels ?? 2,
            bitrate: track.bitrate ?? 0,
            filePath: track.filePath || '',
            fileSize: track.fileSize ?? 0,
            year: track.year ?? 0,
            genre: track.genre || 'Unknown Genre',
            composer: track.composer || '',
            storagePath: track.storagePath || null,
            storageUrl: track.storageUrl || null,
            isLocal: track.isLocal ?? true,
          },
        });
        results.updated++;
      } else {
        await prisma.libraryTrack.create({
          data: {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumArtist: track.albumArtist || '',
            trackNumber: track.trackNumber ?? 0,
            discNumber: track.discNumber ?? 0,
            duration: track.duration ?? 0,
            format: track.format || 'FLAC',
            sampleRate: track.sampleRate ?? 44100,
            bitDepth: track.bitDepth ?? 16,
            channels: track.channels ?? 2,
            bitrate: track.bitrate ?? 0,
            filePath: track.filePath || '',
            fileSize: track.fileSize ?? 0,
            year: track.year ?? 0,
            genre: track.genre || 'Unknown Genre',
            composer: track.composer || '',
            storagePath: track.storagePath || null,
            storageUrl: track.storageUrl || null,
            isLocal: track.isLocal ?? true,
          },
        });
        results.created++;
      }
    }

    return NextResponse.json({
      success: true,
      created: results.created,
      updated: results.updated,
      total: results.created + results.updated,
    });
  } catch (err) {
    console.error('[api/tracks] Failed to save tracks:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save tracks.' },
      { status: 500 },
    );
  }
}

// ── DELETE: Clear all library tracks ──

export async function DELETE() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 503 },
    );
  }

  try {
    const count = await prisma.libraryTrack.deleteMany({});
    return NextResponse.json({
      success: true,
      deleted: count.count,
    });
  } catch (err) {
    console.error('[api/tracks] Failed to clear tracks:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to clear tracks.' },
      { status: 500 },
    );
  }
}
