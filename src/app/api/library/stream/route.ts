// GET /api/library/stream?file=/absolute/path/to/file.mp3
// Streams the audio file with proper Content-Type and Content-Length headers.
// Supports HTTP Range requests for seeking.

import { NextRequest, NextResponse } from 'next/server';
import { stat, createReadStream } from 'fs';
import { extname } from 'path';
import { stat as fsStat } from 'fs/promises';

/** Map of file extension → MIME Content-Type */
const CONTENT_TYPES: Record<string, string> = {
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
 * Parse an HTTP Range header into start/end byte positions.
 * Returns null if the header is malformed.
 */
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  // Expected format: "bytes=0-499" or "bytes=500-"
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  if (parts.length !== 2) return null;

  const start = parts[0] ? parseInt(parts[0], 10) : 0;
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  if (isNaN(start) || isNaN(end)) return null;
  if (start >= fileSize || end >= fileSize || start > end) return null;

  return { start, end };
}

/**
 * GET /api/library/stream
 * Streams a local audio file. Supports Range requests for seeking.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filePath = searchParams.get('file');

  // Validate query parameter
  if (!filePath) {
    return NextResponse.json(
      { error: 'Missing "file" query parameter. Usage: /api/library/stream?file=/absolute/path/to/file.mp3' },
      { status: 400 },
    );
  }

  // Security: only allow absolute paths
  if (!filePath.startsWith('/')) {
    return NextResponse.json(
      { error: 'Only absolute file paths are allowed.' },
      { status: 400 },
    );
  }

  // Determine Content-Type
  const ext = extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  try {
    const fileStat = await fsStat(filePath);

    if (!fileStat.isFile()) {
      return NextResponse.json(
        { error: 'Requested path is not a file.' },
        { status: 400 },
      );
    }

    const fileSize = fileStat.size;
    const rangeHeader = request.headers.get('range');

    // Set common response headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    });

    if (rangeHeader) {
      // ── Range request (partial content for seeking) ──
      const range = parseRange(rangeHeader, fileSize);

      if (!range) {
        return new NextResponse(null, {
          status: 416,
          headers: new Headers({
            'Content-Range': `bytes */${fileSize}`,
          }),
        });
      }

      const { start, end } = range;
      const contentLength = end - start + 1;

      const stream = createReadStream(filePath, { start, end });

      headers.set('Content-Length', contentLength.toString());
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);

      return new NextResponse(stream as unknown as BodyInit, {
        status: 206,
        headers,
      });
    }

    // ── Full file request ──
    const stream = createReadStream(filePath);
    headers.set('Content-Length', fileSize.toString());

    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found.' },
        { status: 404 },
      );
    }

    if (code === 'EACCES' || code === 'EPERM') {
      return NextResponse.json(
        { error: 'Permission denied.' },
        { status: 403 },
      );
    }

    console.error('[library/stream] Error streaming file:', error);
    return NextResponse.json(
      { error: 'Internal server error while streaming file.' },
      { status: 500 },
    );
  }
}
