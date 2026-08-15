// POST /api/tracks/upload
// Uploads an audio file to Supabase Storage and returns the public URL.
//
// Body (FormData):
//   file    — Audio file blob
//   trackId — Track ID for the storage path
//   format  — File format extension (flac, mp3, wav, etc.)
//
// NOTE: For large files (>4MB), the browser should upload DIRECTLY to Supabase Storage
// using the Supabase JS client (bypassing this route). This route is a fallback for
// smaller files and cover art uploads.
//
// Returns: { success: true, storagePath: string, storageUrl: string }

import { NextRequest, NextResponse } from 'next/server';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const trackId = formData.get('trackId') as string | null;
    const format = formData.get('format') as string | null;
    const type = formData.get('type') as string | null; // 'audio' or 'cover'

    if (!file || !trackId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or trackId.' },
        { status: 400 },
      );
    }

    const bucket = type === 'cover' ? STORAGE_BUCKETS.coverArt : STORAGE_BUCKETS.audio;
    const ext = format || file.name.split('.').pop() || 'bin';
    const storagePath = `audio/${trackId}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true, // Overwrite if re-importing same track
        cacheControl: '31536000', // 1 year cache (music doesn't change)
      });

    if (error) {
      console.error('[tracks/upload] Supabase upload error:', error);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${error.message}` },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      storagePath,
      storageUrl: urlData.publicUrl,
    });
  } catch (err) {
    console.error('[tracks/upload] Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Upload failed.' },
      { status: 500 },
    );
  }
}
