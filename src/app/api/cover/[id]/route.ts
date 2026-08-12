import { NextRequest, NextResponse } from 'next/server';

// Dynamic cover art generation via SVG
const gradients: Record<string, [string, string]> = {};
const palette: [string, string, string][] = [
  ['#4a1d96', '#1e3a5f', '#2d1b69'],
  ['#8b0000', '#c2410c', '#7c2d12'],
  ['#064e3b', '#115e59', '#134e4a'],
  ['#78350f', '#a16207', '#854d0e'],
  ['#881337', '#9f1239', '#be123c'],
  ['#312e81', '#4338ca', '#4f46e5'],
  ['#164e63', '#0e7490', '#0891b2'],
  ['#065f46', '#047857', '#059669'],
  ['#1e293b', '#27272a', '#18181b'],
  ['#701a75', '#86198f', '#a21caf'],
  ['#9a3412', '#c2410c', '#ea580c'],
  ['#115e59', '#0d9488', '#14b8a6'],
];

function getHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hash = getHash(id);
  const [c1, c2, c3] = palette[hash % palette.length];
  const angle = (hash % 360);

  // Generate a unique SVG album cover
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
        <stop offset="50%" style="stop-color:${c2};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${c3};stop-opacity:1" />
      </linearGradient>
      <radialGradient id="shine" cx="30%" cy="30%" r="70%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
        <stop offset="100%" style="stop-color:transparent;stop-opacity:1" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" rx="12" fill="url(#bg)" />
    <rect width="400" height="400" rx="12" fill="url(#shine)" />
    <circle cx="200" cy="200" r="${60 + (hash % 80)}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <circle cx="200" cy="200" r="${100 + (hash % 50)}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
    <circle cx="200" cy="200" r="${140 + (hash % 30)}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    <text x="200" y="380" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-family="system-ui" font-size="11" font-weight="500">DSP</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
