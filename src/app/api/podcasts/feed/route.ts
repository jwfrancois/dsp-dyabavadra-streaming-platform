import { NextRequest, NextResponse } from 'next/server';

/**
 * RSS Feed Parser API Route
 *
 * Accepts a feed URL, fetches and parses the RSS/XML feed,
 * and returns structured podcast episode data.
 *
 * In production, this would use a proper RSS parser library.
 * For now, we implement a lightweight XML parser using regex-based
 * extraction that handles common podcast RSS patterns.
 */

interface ParsedEpisode {
  id: string;
  title: string;
  description: string;
  showNotes: string;
  artworkUrl: string;
  audioUrl: string;
  audioType: string;
  duration: number;
  publishDate: string;
  fileSize: number;
  format: string;
  bitrate: number;
  season?: number;
  episodeNumber?: number;
}

interface ParsedFeed {
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  feedUrl: string;
  link: string;
  language: string;
  category: string;
  explicit: boolean;
  episodes: ParsedEpisode[];
}

// Simple XML tag content extractor
function getTagContent(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle nested tags (e.g., <content:encoded>)
  const nestedRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const nestedMatch = xml.match(nestedRegex);
  if (nestedMatch) return nestedMatch[1].trim();

  // Self-closing tag
  const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'i');
  const selfMatch = xml.match(selfClosingRegex);
  if (selfMatch) return '';

  return '';
}

// Extract attribute from a tag
function getAttribute(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*?${attr}=["']([^"']*)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

// Parse iTunes-specific duration string (HH:MM:SS or MM:SS or just seconds)
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const trimmed = durationStr.trim();

  // Try parsing as seconds number
  const num = parseFloat(trimmed);
  if (!isNaN(num) && trimmed === String(num)) return Math.floor(num);

  // Try HH:MM:SS
  const parts = trimmed.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];

  return 0;
}

// Parse file size from byte string
function parseFileSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const num = parseInt(sizeStr, 10);
  return isNaN(num) ? 0 : num;
}

// Generate a simple hash for episode IDs
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// HTML entity decoder (basic)
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&nbsp;/g, ' ');
}

// Strip HTML tags
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const feedUrl = searchParams.get('url')?.trim();
  const maxEpisodes = Math.min(parseInt(searchParams.get('max') || '20', 10), 100);

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing required parameter: url (RSS feed URL)' },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(feedUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid feed URL format' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'DSP-Platform/1.0 (Podcast Aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Feed fetch returned ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();

    // Parse RSS channel info
    const channelMatch = xml.match(/<channel>([\s\S]*?)<\/channel>/i);
    if (!channelMatch) {
      throw new Error('Could not find <channel> element in RSS feed');
    }

    const channelXml = channelMatch[1];

    // Extract channel metadata
    const title = decodeHtmlEntities(getTagContent(channelXml, 'title'));
    const author = decodeHtmlEntities(
      getTagContent(channelXml, 'itunes:author') ||
      getTagContent(channelXml, 'managingEditor') ||
      getTagContent(channelXml, 'dc:creator') ||
      ''
    );
    const description = decodeHtmlEntities(
      getTagContent(channelXml, 'description') ||
      getTagContent(channelXml, 'itunes:summary') ||
      ''
    );
    const link = getTagContent(channelXml, 'link') || '';
    const language = getTagContent(channelXml, 'language') || 'en';
    const explicit = (getTagContent(channelXml, 'itunes:explicit') || 'no').toLowerCase() === 'yes';

    // Artwork — prefer iTunes image, fallback to channel image
    const artworkUrl =
      getAttribute(channelXml, 'itunes:image', 'href') ||
      getTagContent(channelXml, 'itunes:image') ||
      getTagContent(channelXml, 'image:url') ||
      getTagContent(channelXml, 'image');

    // Category
    const category = getTagContent(channelXml, 'itunes:category') ||
      getTagContent(channelXml, 'category') || 'Podcast';

    // Parse episodes
    const episodeRegex = /<item>([\s\S]*?)<\/item>/gi;
    const episodeMatches = [...xml.matchAll(episodeRegex)].slice(0, maxEpisodes);

    const episodes: ParsedEpisode[] = episodeMatches.map((match) => {
      const itemXml = match[1];
      const epTitle = decodeHtmlEntities(getTagContent(itemXml, 'title'));
      const epDesc = decodeHtmlEntities(getTagContent(itemXml, 'description') || '');
      const epShowNotes = decodeHtmlEntities(
        getTagContent(itemXml, 'content:encoded') ||
        getTagContent(itemXml, 'itunes:summary') ||
        ''
      );
      const epLink = getTagContent(itemXml, 'link') || '';
      const pubDate = getTagContent(itemXml, 'pubDate') || '';
      const guid = getTagContent(itemXml, 'guid') || epLink || epTitle;

      // Enclosure (audio file)
      const encUrl = getAttribute(itemXml, 'enclosure', 'url');
      const encLength = parseFileSize(getAttribute(itemXml, 'enclosure', 'length'));
      const encType = getAttribute(itemXml, 'enclosure', 'type');

      // Duration
      const duration = parseDuration(getTagContent(itemXml, 'itunes:duration'));

      // Season/Episode numbers
      const season = parseInt(getTagContent(itemXml, 'itunes:season'), 10) || undefined;
      const episodeNumber = parseInt(getTagContent(itemXml, 'itunes:episode'), 10) || undefined;

      // Episode-specific artwork
      const epArtwork =
        getAttribute(itemXml, 'itunes:image', 'href') ||
        getTagContent(itemXml, 'itunes:image') ||
        artworkUrl;

      // Determine format from mime type
      let format = 'MP3';
      let bitrate = 128;
      if (encType) {
        if (encType.includes('aac') || encType.includes('m4a')) format = 'AAC';
        else if (encType.includes('opus')) format = 'OPUS';
        else if (encType.includes('ogg')) format = 'OGG';
        else if (encType.includes('mp4')) format = 'M4A';
        else if (encType.includes('wav')) format = 'WAV';
      }

      // Estimate bitrate from file size and duration
      if (encLength > 0 && duration > 0) {
        bitrate = Math.round((encLength * 8) / duration / 1000);
      }

      return {
        id: `feed-${simpleHash(guid || epTitle)}`,
        title: epTitle,
        description: stripHtml(epDesc),
        showNotes: stripHtml(epShowNotes),
        artworkUrl: epArtwork,
        audioUrl: encUrl,
        audioType: encType,
        duration,
        publishDate: pubDate,
        fileSize: encLength,
        format,
        bitrate: Math.min(bitrate, 320), // Cap display at 320kbps
        season,
        episodeNumber,
      };
    });

    const parsedFeed: ParsedFeed = {
      title,
      author,
      description: stripHtml(description),
      artworkUrl,
      feedUrl,
      link,
      language,
      category,
      explicit,
      episodes,
    };

    return NextResponse.json(parsedFeed);
  } catch (error) {
    console.error('[RSS Feed Parse Error]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to parse RSS feed', details: message },
      { status: 502 }
    );
  }
}

// POST endpoint for adding/refreshing a podcast subscription
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { feedUrl } = body as { feedUrl?: string };

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing required field: feedUrl' },
      { status: 400 }
    );
  }

  try {
    new URL(feedUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid feed URL format' },
      { status: 400 }
    );
  }

  // Reuse the GET handler logic
  const mockRequest = new NextRequest(
    new URL(`/api/podcasts/feed?url=${encodeURIComponent(feedUrl)}&max=50`, request.url)
  );
  return GET(mockRequest);
}
