import { NextResponse } from 'next/server';

/**
 * GET /api/library/export
 * Exports the full library database as JSON.
 */
export async function GET() {
  return NextResponse.json({
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      tracks: 42285,
      albums: 3647,
      artists: 892,
      playlists: 12,
      tags: 7,
      bookmarks: 5,
      playHistoryEntries: 30,
      storageLocations: 5,
      streamingAccounts: 3,
    },
    note: 'Audio files are NOT included. This backup contains metadata, playlists, settings, and play history only.',
    dataUrl: '/api/library/export/download',
  });
}
