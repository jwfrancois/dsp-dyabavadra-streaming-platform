import { NextRequest, NextResponse } from 'next/server';

// GET /api/proxy/podcast?url=https://example.com/episode.mp3
// Proxies podcast audio files to the browser.
// Identical to the stream proxy but with podcast-specific tuning:
//   - Longer connection timeout (podcast episodes can be large)
//   - Podcast-app User-Agent string
//   - Explicit redirect following

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
  'Access-Control-Expose-Headers':
    'Content-Range, Content-Length, Content-Type, Accept-Ranges',
};

const PODCAST_TIMEOUT_MS = 120_000; // 2 minutes — podcast episodes are large

const PODCAST_USER_AGENT =
  'AppleCoreMedia/1.0.0.22E250 (iPhone; iOS 18.2; Model/iPhone17,2)';

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

  // Build forwarding headers
  const fetchHeaders: Record<string, string> = {
    'User-Agent': PODCAST_USER_AGENT,
  };

  // Pass through Range header for seeking support
  const range = request.headers.get('range');
  if (range) {
    fetchHeaders['Range'] = range;
  }

  // Longer timeout for potentially large podcast files
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    PODCAST_TIMEOUT_MS,
  );

  // Abort upstream when the client disconnects
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

    // Assemble response headers
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

    // Default Accept-Ranges so the browser knows seeking is possible
    if (!responseHeaders['accept-ranges']) {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    // Cache hint — podcast episodes rarely change
    responseHeaders['Cache-Control'] = 'public, max-age=86400';

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
      if (request.signal.aborted) {
        return new NextResponse(null, { status: 499, headers: CORS_HEADERS });
      }
      return NextResponse.json(
        { error: 'Upstream connection timed out' },
        { status: 504, headers: CORS_HEADERS },
      );
    }

    console.error('[proxy/podcast] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast audio' },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
