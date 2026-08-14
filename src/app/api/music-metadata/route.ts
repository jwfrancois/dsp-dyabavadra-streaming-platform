import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for metadata lookups
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function webSearch(query: string, num = 5) {
  try {
    const ZAI = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.create();
    const results = await zai.functions.invoke('web_search', { query, num });
    return results;
  } catch (err) {
    console.error('Web search error:', err);
    return [];
  }
}

async function fetchWithTimeout(url: string, timeout = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Fetch lyrics from various free sources
async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  // Try multiple search queries
  const queries = [
    `${artist} ${title} lyrics`,
    `${artist} "${title}" song lyrics`,
  ];

  for (const query of queries) {
    const results = await webSearch(query, 3);
    for (const result of results) {
      if (
        result.url.includes('genius.com') ||
        result.url.includes('azlyrics.com') ||
        result.url.includes('lyrics.com') ||
        result.url.includes('musixmatch.com')
      ) {
        // Return the snippet as a preview + the URL for full lyrics
        const snippet = result.snippet || '';
        const cleanSnippet = snippet
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        return JSON.stringify({
          source: result.url,
          sourceName: new URL(result.url).hostname,
          preview: cleanSnippet,
          fullLyricsUrl: result.url,
        });
      }
    }
  }

  return null;
}

// Fetch artist biography
async function fetchArtistBio(artist: string): Promise<string | null> {
  const queries = [
    `${artist} musician artist biography`,
    `${artist} band history discography`,
  ];

  for (const query of queries) {
    const results = await webSearch(query, 5);
    const snippets = results
      .map(r => ({
        title: r.name,
        snippet: r.snippet,
        url: r.url,
        source: r.host_name,
      }))
      .filter(r =>
        r.source.includes('wikipedia.org') ||
        r.source.includes('allmusic.com') ||
        r.source.includes('britannica.com') ||
        r.source.includes('discogs.com') ||
        r.snippet.length > 100
      );

    if (snippets.length > 0) {
      return JSON.stringify({
        summaries: snippets.slice(0, 3),
        readMoreUrl: snippets[0].url,
      });
    }
  }

  // Fallback: return any results we got
  const results = await webSearch(`${artist} artist biography`, 3);
  if (results.length > 0) {
    return JSON.stringify({
      summaries: results.slice(0, 2).map(r => ({
        title: r.name,
        snippet: r.snippet,
        url: r.url,
        source: r.host_name,
      })),
      readMoreUrl: results[0].url,
    });
  }

  return null;
}

// Fetch album description / review
async function fetchAlbumInfo(artist: string, album: string): Promise<string | null> {
  const queries = [
    `${artist} "${album}" album review description`,
    `${artist} ${album} album wiki`,
  ];

  for (const query of queries) {
    const results = await webSearch(query, 3);
    const snippets = results.map(r => ({
      title: r.name,
      snippet: r.snippet,
      url: r.url,
      source: r.host_name,
    }));

    if (snippets.length > 0) {
      return JSON.stringify({
        summaries: snippets.slice(0, 3),
        readMoreUrl: snippets[0].url,
      });
    }
  }

  return null;
}

// Fetch artist discography info
async function fetchDiscography(artist: string): Promise<string | null> {
  const results = await webSearch(`${artist} complete discography albums list`, 5);
  if (results.length > 0) {
    return JSON.stringify({
      sources: results.slice(0, 3).map(r => ({
        title: r.name,
        snippet: r.snippet,
        url: r.url,
        source: r.host_name,
      })),
      readMoreUrl: results[0].url,
    });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const artist = searchParams.get('artist') || '';
  const title = searchParams.get('title') || '';
  const album = searchParams.get('album') || '';
  const query = searchParams.get('query') || '';

  if (!type && !query) {
    return NextResponse.json({ error: 'Missing type or query parameter' }, { status: 400 });
  }

  try {
    // Generic search
    if (query) {
      const cacheKey = `search:${query}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const results = await webSearch(query, 8);
      const data = {
        query,
        results: results.map(r => ({
          title: r.name,
          snippet: r.snippet,
          url: r.url,
          source: r.host_name,
          date: r.date,
        })),
      };
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    // Typed lookups
    if (type === 'lyrics' && artist && title) {
      const cacheKey = `lyrics:${artist}:${title}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const data = await fetchLyrics(artist, title);
      if (data) {
        const parsed = JSON.parse(data);
        setCache(cacheKey, parsed);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    if (type === 'artist-bio' && artist) {
      const cacheKey = `bio:${artist}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const data = await fetchArtistBio(artist);
      if (data) {
        const parsed = JSON.parse(data);
        setCache(cacheKey, parsed);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'Biography not found' }, { status: 404 });
    }

    if (type === 'album-info' && artist && album) {
      const cacheKey = `album:${artist}:${album}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const data = await fetchAlbumInfo(artist, album);
      if (data) {
        const parsed = JSON.parse(data);
        setCache(cacheKey, parsed);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'Album info not found' }, { status: 404 });
    }

    if (type === 'discography' && artist) {
      const cacheKey = `discog:${artist}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const data = await fetchDiscography(artist);
      if (data) {
        const parsed = JSON.parse(data);
        setCache(cacheKey, parsed);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'Discography not found' }, { status: 404 });
    }

    // Artist image search — returns URLs of artist photos
    if (type === 'artist-image' && artist) {
      const cacheKey = `artist-img:${artist}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const queries = [
        `${artist} musician artist photo portrait`,
        `${artist} band official photo`,
      ];

      let imageUrl: string | null = null;
      let imageSource: string = '';

      for (const query of queries) {
        const results = await webSearch(query, 5);
        for (const result of results) {
          // Prefer Wikipedia, official sites, music platforms for artist images
          const host = new URL(result.url).hostname;
          if (
            host.includes('wikipedia.org') ||
            host.includes('allmusic.com') ||
            host.includes('discogs.com') ||
            host.includes('last.fm') ||
            host.includes('musicbrainz.org') ||
            host.includes('rateyourmusic.com') ||
            result.snippet.toLowerCase().includes('photo') ||
            result.snippet.toLowerCase().includes('portrait')
          ) {
            imageUrl = result.url;
            imageSource = host;
            break;
          }
        }
        if (imageUrl) break;
      }

      // Fallback: use any result with a reasonable URL
      if (!imageUrl) {
        const results = await webSearch(`${artist} artist`, 3);
        if (results.length > 0) {
          imageUrl = results[0].url;
          imageSource = new URL(results[0].url).hostname;
        }
      }

      if (imageUrl) {
        const data = { imageUrl, source: imageSource, artist };
        setCache(cacheKey, data);
        return NextResponse.json(data);
      }
      return NextResponse.json({ error: 'Artist image not found' }, { status: 404 });
    }

    // Similar artists search
    if (type === 'similar-artists' && artist) {
      const cacheKey = `similar:${artist}`;
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);

      const results = await webSearch(`${artist} similar artists related musicians`, 5);
      const data = {
        artist,
        results: results.slice(0, 5).map(r => ({
          name: r.name,
          snippet: r.snippet,
          url: r.url,
          source: r.host_name,
        })),
      };
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid type parameter. Use: lyrics, artist-bio, album-info, discography, artist-image, similar-artists, or query' }, { status: 400 });
  } catch (err) {
    console.error('Music metadata API error:', err);
    return NextResponse.json({ error: 'Failed to fetch music metadata' }, { status: 500 });
  }
}
