import { NextRequest, NextResponse } from 'next/server';

// GET /api/proxy/stream?url=https://example.com/stream.mp3
// Proxies the audio stream from the given URL to the browser.
// Supports HTTP Range requests for seeking in audio files.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
  'Access-Control-Expose-Headers':
    'Content-Range, Content-Length, Content-Type, Accept-Ranges',
};

const CONNECTION_TIMEOUT_MS = 30_000;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url || !isValidUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid or missing url parameter. Must be http:// or https://' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Build forwarding headers — pass through Range for seek support
  const fetchHeaders: Record<string, string> = {};
  const range = request.headers.get('range');
  if (range) {
    fetchHeaders['Range'] = range;
  }

  // Timeout for the initial connection
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    CONNECTION_TIMEOUT_MS,
  );

  // If the client disconnects, abort the upstream fetch
  request.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
    abortController.abort();
  });

  try {
    const response = await fetch(url, {
      signal: abortController.signal,
      headers: fetchHeaders,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Assemble response headers, forwarding relevant audio/stream headers
    const responseHeaders: Record<string, string> = { ...CORS_HEADERS };

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ];

    for (const key of passthroughHeaders) {
      const value = response.headers.get(key);
      if (value) {
        responseHeaders[key] = value;
      }
    }

    // Default Accept-Ranges for audio content
    if (!responseHeaders['accept-ranges']) {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (
      error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      // Client may have already disconnected — don't send a response body
      if (request.signal.aborted) {
        return new NextResponse(null, { status: 499, headers: CORS_HEADERS });
      }
      return NextResponse.json(
        { error: 'Upstream connection timed out' },
        { status: 504, headers: CORS_HEADERS },
      );
    }

    console.error('[proxy/stream] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
