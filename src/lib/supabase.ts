// src/lib/supabase.ts
// Supabase client for DSP — provides:
//   1. Browser client: direct upload/download from the user's browser (bypasses Vercel serverless)
//   2. Server client: for server-side DB queries (API routes)
//
// Environment variables (set in Vercel dashboard → Settings → Environment Variables):
//   NEXT_PUBLIC_SUPABASE_URL      — e.g. https://abc123.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY — anon/public key (safe for browser)
//   SUPABASE_SERVICE_ROLE_KEY     — service role key (server-side only, admin access)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
    'Cloud persistence is disabled. Set these in .env.local or Vercel dashboard.',
  );
}

// Browser/client-side Supabase client (anon key, respects RLS)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client with service role (bypasses RLS, full access)
// Only use in API routes, never expose to the browser
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  audio: 'audio',       // Music files (FLAC, MP3, WAV, etc.)
  coverArt: 'cover-art', // Album cover art images
} as const;

// Public CDN base URL for Supabase Storage
export function getStoragePublicUrl(bucket: string, path: string): string | null {
  if (!supabase) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}
