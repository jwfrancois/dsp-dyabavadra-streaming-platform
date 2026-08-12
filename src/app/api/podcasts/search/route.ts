import { NextRequest, NextResponse } from 'next/server';

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 200);
  const id = searchParams.get('id')?.trim(); // iTunes ID for direct lookup

  // Validate input
  if (!query && !id) {
    return NextResponse.json(
      { error: 'Missing required parameter: q (search query) or id (iTunes podcast ID)' },
      { status: 400 }
    );
  }

  try {
    let url: string;

    if (id) {
      // Direct lookup by iTunes ID
      url = `${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(id)}&entity=podcast`;
    } else {
      // Search query
      url = `${ITUNES_SEARCH_URL}?${new URLSearchParams({
        term: query!,
        media: 'podcast',
        entity: 'podcast',
        limit: limit.toString(),
        country: 'US',
        lang: 'en_us',
      }).toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DSP-Platform/1.0',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`iTunes API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform iTunes response into our internal format
    const results = (data.results || []).map((item: Record<string, unknown>) => ({
      id: String(item.collectionId || item.trackId || ''),
      itunesId: Number(item.collectionId || item.trackId || 0),
      title: String(item.collectionName || item.trackName || 'Unknown'),
      author: String(item.artistName || 'Unknown Author'),
      artworkUrl: String(item.artworkUrl600 || item.artworkUrl100 || item.artworkUrl60 || ''),
      artworkUrlSmall: String(item.artworkUrl60 || item.artworkUrl100 || ''),
      artworkUrlMedium: String(item.artworkUrl100 || item.artworkUrl600 || ''),
      artworkUrlLarge: String(item.artworkUrl600 || item.artworkUrl100 || ''),
      genre: String(item.primaryGenreName || 'Podcast'),
      category: String(item.primaryGenreName || 'Podcast'),
      feedUrl: String(item.feedUrl || ''),
      episodeCount: Number(item.trackCount || item.collectionSize || 0),
      description: String(
        item.description || item.shortDescription || item.longDescription || ''
      ),
      rating: String(item.contentAdvisoryRating || 'clean'),
      country: String(item.country || 'USA'),
      language: String(item.language || 'en'),
      releaseDate: String(item.releaseDate || ''),
      price: Number(item.collectionPrice || item.trackPrice || 0),
      currency: String(item.currency || 'USD'),
      storeUrl: String(item.collectionViewUrl || item.trackViewUrl || ''),
    }));

    return NextResponse.json({
      resultCount: results.length,
      results,
    });
  } catch (error) {
    console.error('[iTunes Podcast Search Error]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to search iTunes podcast directory', details: message },
      { status: 502 }
    );
  }
}
