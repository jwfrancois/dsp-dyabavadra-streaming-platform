import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// JELLYFIN API PROXY
// Routes ALL Jellyfin REST API calls through Next.js
// to avoid browser CORS issues when connecting to self-hosted
// Jellyfin servers on different origins.
// ═══════════════════════════════════════════════════════════════
//
// Client sends:
//   POST /api/jellyfin/Users/AuthenticateByName
//   Header X-Jellyfin-Server-Url: https://jellyfin.example.com
//   Header X-Jellyfin-Skip-Auth: true  (for unauthenticated endpoints)
//   Body: { ... JSON ... }
//
// Proxy:
//   Forwards the request to {serverUrl}/Users/AuthenticateByName
//   Returns the upstream response to the client
//

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
};

/** Validate that a server URL is http/https */
function isValidServerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Connection timeout — Jellyfin servers may be on slow home connections */
const CONNECTION_TIMEOUT_MS = 30_000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'GET', params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'POST', params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, 'DELETE', params);
}

async function proxyRequest(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  // 1. Extract the Jellyfin API path from the catch-all route
  const { path } = await params;
  const apiPath = '/' + path.join('/');

  // 2. Get the target server URL from the client header
  const serverUrl = request.headers.get('x-jellyfin-server-url');

  if (!serverUrl || !isValidServerUrl(serverUrl)) {
    return NextResponse.json(
      { error: 'Missing or invalid X-Jellyfin-Server-Url header' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // 3. Check if this is a skip-auth request (for login endpoint)
  const skipAuth = request.headers.get('x-jellyfin-skip-auth') === 'true';

  // 4. Build the upstream URL
  const baseUrl = serverUrl.replace(/\/+$/, '');
  const upstreamUrl = `${baseUrl}${apiPath}`;

  // 5. Build forwarding headers
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'DSP/1.0 (Jellyfin Proxy)',
    'Accept': 'application/json',
  };

  // Forward auth token if available (unless skip-auth)
  const token = request.headers.get('x-jellyfin-token');
  if (token && !skipAuth) {
    upstreamHeaders['X-Emby-Token'] = token;
  }

  // Forward the MediaBrowser authorization header if present (for login)
  const authHeader = request.headers.get('x-jellyfin-authorization');
  if (authHeader) {
    upstreamHeaders['Authorization'] = authHeader;
  }

  // 6. Get request body for POST/DELETE
  let body: string | null = null;
  if (method === 'POST' || method === 'DELETE') {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await request.text();
      upstreamHeaders['Content-Type'] = 'application/json';
    }
  }

  // 7. Execute the proxied request
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), CONNECTION_TIMEOUT_MS);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
    abortController.abort();
  });

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body,
      signal: abortController.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // 8. Read the response body
    const responseBody = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || '';

    // 9. Build response headers
    const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
    if (contentType) {
      responseHeaders['Content-Type'] = contentType;
    }
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    return new NextResponse(responseBody, {
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
        {
          error: 'Jellyfin server connection timed out. Check that the server URL is correct and the server is reachable.',
          code: 'TIMEOUT',
        },
        { status: 504, headers: CORS_HEADERS },
      );
    }

    console.error(`[api/jellyfin] ${method} ${apiPath} fetch error:`, error);

    return NextResponse.json(
      {
        error: `Network error connecting to Jellyfin server. Ensure the server URL is correct, the server is running, and is accessible from this network.`,
        code: 'NETWORK_ERROR',
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
