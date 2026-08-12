import { NextRequest, NextResponse } from 'next/server';

// GET /api/proxy/radio?url=https://ice1.somafm.com/groovesalad-128-mp3
// Proxies live radio streams with automatic reconnection on disconnect.
// Designed for low-latency streaming of infinite/continuous audio sources.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Type',
};

const CONNECTION_TIMEOUT_MS = 30_000;
const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_CONSECUTIVE_ERRORS = 10;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Creates a ReadableStream that transparently reconnects to the upstream
 * radio stream whenever it disconnects.  The loop runs until the client
 * aborts the connection or too many consecutive errors occur.
 */
function createReconnectingStream(
  url: string,
  clientSignal: AbortSignal,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let consecutiveErrors = 0;
      let reconnectDelay = RECONNECT_DELAY_MS;

      while (!clientSignal.aborted) {
        const fetchAbort = new AbortController();

        // Forward client abort to the in-flight fetch
        const onClientAbort = () => fetchAbort.abort();
        clientSignal.addEventListener('abort', onClientAbort, { once: true });

        try {
          // Each connection gets its own 30 s timeout
          const timeoutId = setTimeout(
            () => fetchAbort.abort(),
            CONNECTION_TIMEOUT_MS,
          );

          const response = await fetch(url, {
            signal: fetchAbort.signal,
            headers: {
              'User-Agent': 'DSP/1.0 (Radio Proxy)',
              // Keep-alive to reduce TCP handshake overhead
              Connection: 'keep-alive',
            },
            redirect: 'follow',
            // Prevent buffering — we want live data ASAP
            cache: 'no-store',
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(
              `[proxy/radio] Upstream returned ${response.status}`,
            );
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;

            // Back off before retrying
            await sleep(reconnectDelay, clientSignal);
            reconnectDelay = Math.min(
              reconnectDelay * 2,
              MAX_RECONNECT_DELAY_MS,
            );
            clientSignal.removeEventListener('abort', onClientAbort);
            continue;
          }

          // Successful connection — reset error counter and back-off
          consecutiveErrors = 0;
          reconnectDelay = RECONNECT_DELAY_MS;

          if (!response.body) {
            clientSignal.removeEventListener('abort', onClientAbort);
            break;
          }

          const reader = response.body.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Live stream ended — this is a disconnect for radio.
                // Reconnect after a short delay.
                break;
              }

              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }

          clientSignal.removeEventListener('abort', onClientAbort);

          // Brief pause before reconnecting to avoid tight loop
          if (!clientSignal.aborted) {
            await sleep(RECONNECT_DELAY_MS, clientSignal);
          }
        } catch (error) {
          clientSignal.removeEventListener('abort', onClientAbort);

          if (clientSignal.aborted) break;

          // Only count as error if it wasn't our own abort
          if (!fetchAbort.signal.aborted) {
            consecutiveErrors++;
            console.error(
              `[proxy/radio] Stream error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
              error,
            );
          }

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;

          await sleep(reconnectDelay, clientSignal);
          reconnectDelay = Math.min(
            reconnectDelay * 2,
            MAX_RECONNECT_DELAY_MS,
          );
        }
      }

      controller.close();
    },

    cancel() {
      // Client hung up — the while-loop exits via clientSignal.aborted
    },
  });
}

/** Promise that resolves after `ms` unless `signal` aborts first. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
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

  const stream = createReconnectingStream(url, request.signal);

  return new NextResponse(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'audio/mpeg', // default for most radio streams
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // Inform the browser this is a live / unbounded stream
      'X-Content-Duration': 'infinity',
    },
  });
}
