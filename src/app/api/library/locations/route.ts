import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/library/locations
 * Returns all storage locations.
 */
export async function GET() {
  return NextResponse.json({
    locations: [
      { id: 'storage-1', name: 'Music Library (Internal SSD)', type: 'local', status: 'online', enabled: true, trackCount: 12847, totalSize: 185634723584 },
      { id: 'storage-2', name: 'NAS — Synology', type: 'nas', status: 'online', enabled: true, trackCount: 24391, totalSize: 527489997824 },
      { id: 'storage-3', name: 'Hi-Res Collection', type: 'external', status: 'offline', enabled: true, trackCount: 3205, totalSize: 215893491712 },
    ],
  });
}

/**
 * POST /api/library/locations
 * Add a new storage location.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path, type } = body as { name: string; path: string; type: string };

    if (!name || !path) {
      return NextResponse.json({ error: 'Missing name or path' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      location: {
        id: `storage-${Date.now()}`,
        name,
        path,
        type: type || 'local',
        status: 'online',
        enabled: true,
        trackCount: 0,
        totalSize: 0,
      },
      message: `Storage location "${name}" added. Initial scan will begin.`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add location' }, { status: 500 });
  }
}

/**
 * DELETE /api/library/locations?Id=xxx
 * Remove a storage location from indexing.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing location ID' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `Location ${id} removed. Indexed tracks remain in library.`,
  });
}
