import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/library/scan
 * Triggers a library scan operation.
 * Body: { locationId?: string, full?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, full } = body as { locationId?: string; full?: boolean };

    // In production, this would trigger the actual scanner process
    // For now, return a mock scan initiation response
    return NextResponse.json({
      success: true,
      scanId: `scan-${Date.now()}`,
      status: 'running',
      phase: 'discovering',
      message: locationId
        ? `Scan started for location: ${locationId}`
        : full
          ? 'Full library scan started'
          : 'Incremental scan started',
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 });
  }
}

/**
 * GET /api/library/scan
 * Returns current scan status.
 */
export async function GET() {
  return NextResponse.json({
    scanId: 'scan-latest',
    status: 'completed',
    phase: 'idle',
    progress: 100,
    startedAt: '2026-08-12T02:15:00Z',
    completedAt: '2026-08-12T02:30:45Z',
    totalFiles: 42285,
    processedFiles: 42285,
    newFiles: 47,
    updatedFiles: 12,
    removedFiles: 3,
    errorCount: 2,
  });
}
