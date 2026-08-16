-- =============================================================================
-- DSP (Dyabavadra Streaming Platform) — Supabase Database Setup
-- =============================================================================
-- Run this in the Supabase SQL Editor (https://supabase.com → Your Project → SQL Editor)
--
-- This creates ALL tables matching prisma/schema.prisma, plus storage buckets
-- for audio files and cover art.
--
-- Steps:
--   1. Create a new Supabase project at https://supabase.com
--   2. Open the SQL Editor in your project dashboard
--   3. Paste this entire file and click "Run"
--   4. Add the following environment variables to your Vercel project:
--      DATABASE_URL      = your connection string from Supabase → Settings → Database
--      DIRECT_URL        = your direct pooler connection string
--      NEXT_PUBLIC_SUPABASE_URL        = your project URL (https://xxx.supabase.co)
--      NEXT_PUBLIC_SUPABASE_ANON_KEY  = anon public key from Supabase → Settings → API
--      SUPABASE_SERVICE_ROLE_KEY       = service_role key from Supabase → Settings → API
-- =============================================================================

-- Enable UUID extension (needed by cuid() fallback)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── User ───
CREATE TABLE "User" (
    "id"         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email"      TEXT        NOT NULL UNIQUE,
    "name"       TEXT,
    "avatarUrl"  TEXT,
    "role"       TEXT        NOT NULL DEFAULT 'user',
    "createdAt"  TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── Artist ───
CREATE TABLE "Artist" (
    "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name"        TEXT        NOT NULL,
    "imageUrl"    TEXT,
    "bio"         TEXT,
    "genres"      TEXT        NOT NULL,          -- JSON array stored as string
    "origin"      TEXT,
    "type"        TEXT        NOT NULL DEFAULT 'individual',
    "members"     TEXT,                           -- JSON array stored as string
    "born"        TEXT,
    "yearsActive" TEXT,
    "playCount"   INTEGER     NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── Album ───
CREATE TABLE "Album" (
    "id"            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"         TEXT        NOT NULL,
    "artistId"      TEXT        NOT NULL,
    "imageUrl"      TEXT,
    "year"          INTEGER     NOT NULL,
    "genre"         TEXT        NOT NULL,
    "format"        TEXT        NOT NULL DEFAULT 'FLAC',
    "bitDepth"      INTEGER     NOT NULL DEFAULT 16,
    "sampleRate"    INTEGER     NOT NULL DEFAULT 44100,
    "channels"      INTEGER     NOT NULL DEFAULT 2,
    "label"         TEXT,
    "catalogNumber" TEXT,
    "type"          TEXT        NOT NULL DEFAULT 'album',
    "rating"        INTEGER     NOT NULL DEFAULT 0,
    "review"        TEXT,
    "createdAt"     TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── Track (relational) ───
CREATE TABLE "Track" (
    "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"       TEXT        NOT NULL,
    "albumId"     TEXT        NOT NULL,
    "artistId"    TEXT        NOT NULL,
    "artistName"  TEXT        NOT NULL,
    "trackNumber" INTEGER     NOT NULL,
    "discNumber"  INTEGER     NOT NULL DEFAULT 1,
    "duration"    INTEGER     NOT NULL,
    "format"      TEXT        NOT NULL DEFAULT 'FLAC',
    "bitDepth"    INTEGER     NOT NULL DEFAULT 16,
    "sampleRate"  INTEGER     NOT NULL DEFAULT 44100,
    "channels"    INTEGER     NOT NULL DEFAULT 2,
    "bitrate"     INTEGER     NOT NULL DEFAULT 0,
    "filePath"    TEXT        NOT NULL,
    "fileSize"    INTEGER     NOT NULL DEFAULT 0,
    "storagePath" TEXT,                           -- Supabase Storage path: "audio/{userId}/{trackId}.{ext}"
    "storageUrl"  TEXT,                           -- Full CDN URL for streaming
    "composers"   TEXT,                           -- JSON array
    "credits"     TEXT,                           -- JSON array of Credit objects
    "genre"       TEXT,
    "loved"       BOOLEAN     NOT NULL DEFAULT false,
    "playCount"   INTEGER     NOT NULL DEFAULT 0,
    "lastPlayed"  TIMESTAMP,
    "source"      TEXT        NOT NULL DEFAULT 'local',
    "isAvailable" BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Track_albumId_idx"   ON "Track" ("albumId");
CREATE INDEX "Track_artistId_idx"  ON "Track" ("artistId");
CREATE INDEX "Track_storagePath_idx" ON "Track" ("storagePath");
CREATE INDEX "Track_source_idx"    ON "Track" ("source");

-- ─── LibraryTrack (denormalized flat view — primary model for library UI) ───
CREATE TABLE "LibraryTrack" (
    "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"       TEXT        NOT NULL,
    "artist"      TEXT        NOT NULL,
    "album"       TEXT        NOT NULL,
    "albumArtist" TEXT        NOT NULL DEFAULT '',
    "trackNumber" INTEGER     NOT NULL DEFAULT 0,
    "discNumber"  INTEGER     NOT NULL DEFAULT 0,
    "duration"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "format"      TEXT        NOT NULL DEFAULT 'FLAC',
    "sampleRate"  INTEGER     NOT NULL DEFAULT 44100,
    "bitDepth"    INTEGER     NOT NULL DEFAULT 16,
    "channels"    INTEGER     NOT NULL DEFAULT 2,
    "bitrate"     INTEGER     NOT NULL DEFAULT 0,
    "filePath"    TEXT        NOT NULL DEFAULT '',
    "fileSize"    INTEGER     NOT NULL DEFAULT 0,
    "year"        INTEGER     NOT NULL DEFAULT 0,
    "genre"       TEXT        NOT NULL DEFAULT 'Unknown Genre',
    "composer"    TEXT        NOT NULL DEFAULT '',
    "storagePath" TEXT,
    "storageUrl"  TEXT,
    "isLocal"     BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX "LibraryTrack_artist_idx"     ON "LibraryTrack" ("artist");
CREATE INDEX "LibraryTrack_album_idx"      ON "LibraryTrack" ("album");
CREATE INDEX "LibraryTrack_albumArtist_idx" ON "LibraryTrack" ("albumArtist");
CREATE INDEX "LibraryTrack_genre_idx"      ON "LibraryTrack" ("genre");
CREATE INDEX "LibraryTrack_format_idx"     ON "LibraryTrack" ("format");
CREATE INDEX "LibraryTrack_storagePath_idx" ON "LibraryTrack" ("storagePath");

-- ─── Zone ───
CREATE TABLE "Zone" (
    "id"           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name"         TEXT        NOT NULL,
    "isGroup"      BOOLEAN     NOT NULL DEFAULT false,
    "isPlaying"    BOOLEAN     NOT NULL DEFAULT false,
    "volume"       INTEGER     NOT NULL DEFAULT 50,
    "isMuted"      BOOLEAN     NOT NULL DEFAULT false,
    "isOnline"     BOOLEAN     NOT NULL DEFAULT true,
    "outputFormat" TEXT        NOT NULL DEFAULT 'PCM',
    "sampleRate"   INTEGER     NOT NULL DEFAULT 44100,
    "bitDepth"     INTEGER     NOT NULL DEFAULT 16,
    "dspEnabled"   BOOLEAN     NOT NULL DEFAULT false,
    "dspChain"     TEXT,                           -- JSON array
    "endpoints"    TEXT        NOT NULL,           -- JSON array
    "createdAt"    TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── Playlist ───
CREATE TABLE "Playlist" (
    "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name"        TEXT        NOT NULL,
    "description" TEXT,
    "trackIds"    TEXT        NOT NULL,           -- JSON array of track IDs
    "coverUrl"    TEXT,
    "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── PlayHistory ───
CREATE TABLE "PlayHistory" (
    "id"       TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "trackId"  TEXT        NOT NULL,
    "playedAt" TIMESTAMP   NOT NULL DEFAULT now(),
    "userId"   TEXT
);

-- ─── StorageLocation ───
CREATE TABLE "StorageLocation" (
    "id"         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name"       TEXT        NOT NULL,
    "path"       TEXT        NOT NULL,
    "enabled"    BOOLEAN     NOT NULL DEFAULT true,
    "lastScan"   TIMESTAMP,
    "trackCount" INTEGER     NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── Podcast ───
CREATE TABLE "Podcast" (
    "id"           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"        TEXT        NOT NULL,
    "author"       TEXT        NOT NULL,
    "description"  TEXT,
    "artworkUrl"   TEXT,
    "feedUrl"      TEXT        NOT NULL UNIQUE,
    "genre"        TEXT        NOT NULL DEFAULT 'Podcast',
    "category"     TEXT,
    "language"     TEXT        NOT NULL DEFAULT 'en',
    "rating"       TEXT        NOT NULL DEFAULT 'clean',
    "itunesId"     INTEGER,
    "subscribed"   BOOLEAN     NOT NULL DEFAULT false,
    "autoDownload" BOOLEAN     NOT NULL DEFAULT false,
    "autoArchive"  BOOLEAN     NOT NULL DEFAULT false,
    "keepEpisodes" INTEGER     NOT NULL DEFAULT 0,
    "lastChecked"  TIMESTAMP,
    "episodeCount" INTEGER     NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP   NOT NULL DEFAULT now()
);

-- ─── PodcastEpisode ───
CREATE TABLE "PodcastEpisode" (
    "id"            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "podcastId"     TEXT        NOT NULL,
    "title"         TEXT        NOT NULL,
    "description"   TEXT,
    "showNotes"     TEXT,
    "artworkUrl"    TEXT,
    "audioUrl"      TEXT        NOT NULL,
    "audioType"     TEXT        NOT NULL DEFAULT 'audio/mpeg',
    "duration"      INTEGER     NOT NULL DEFAULT 0,
    "publishDate"   TIMESTAMP,
    "fileSize"      INTEGER     NOT NULL DEFAULT 0,
    "format"        TEXT        NOT NULL DEFAULT 'MP3',
    "bitrate"       INTEGER     NOT NULL DEFAULT 128,
    "season"        INTEGER,
    "episodeNumber" INTEGER,
    "isDownloaded"  BOOLEAN     NOT NULL DEFAULT false,
    "isPlayed"      BOOLEAN     NOT NULL DEFAULT false,
    "completed"     BOOLEAN     NOT NULL DEFAULT false,
    "resumePosition" INTEGER    NOT NULL DEFAULT 0,
    "favorite"      BOOLEAN     NOT NULL DEFAULT false,
    "archived"      BOOLEAN     NOT NULL DEFAULT false,
    "playedAt"      TIMESTAMP,
    "createdAt"     TIMESTAMP   NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================================================
-- STORAGE BUCKETS (for audio files and cover art)
-- =============================================================================
-- These are created via Supabase's storage API.
-- Run them in the SQL Editor — Supabase supports storage management via SQL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio', 'Audio Files', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cover-art', 'Cover Art', true, 20971520, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Enable RLS on all tables. For now, allow all operations (anon access).
-- You can tighten these policies later when auth is implemented.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Artist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Album" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Track" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LibraryTrack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Zone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Playlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageLocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Podcast" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PodcastEpisode" ENABLE ROW LEVEL SECURITY;

-- Allow public read/write on LibraryTrack (the main table used by the app)
CREATE POLICY "LibraryTrack_select" ON "LibraryTrack" FOR SELECT USING (true);
CREATE POLICY "LibraryTrack_insert" ON "LibraryTrack" FOR INSERT WITH CHECK (true);
CREATE POLICY "LibraryTrack_update" ON "LibraryTrack" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "LibraryTrack_delete" ON "LibraryTrack" FOR DELETE USING (true);

-- Allow public read/write on Track
CREATE POLICY "Track_select" ON "Track" FOR SELECT USING (true);
CREATE POLICY "Track_insert" ON "Track" FOR INSERT WITH CHECK (true);
CREATE POLICY "Track_update" ON "Track" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Track_delete" ON "Track" FOR DELETE USING (true);

-- Allow public read/write on Artist
CREATE POLICY "Artist_select" ON "Artist" FOR SELECT USING (true);
CREATE POLICY "Artist_insert" ON "Artist" FOR INSERT WITH CHECK (true);
CREATE POLICY "Artist_update" ON "Artist" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Artist_delete" ON "Artist" FOR DELETE USING (true);

-- Allow public read/write on Album
CREATE POLICY "Album_select" ON "Album" FOR SELECT USING (true);
CREATE POLICY "Album_insert" ON "Album" FOR INSERT WITH CHECK (true);
CREATE POLICY "Album_update" ON "Album" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Album_delete" ON "Album" FOR DELETE USING (true);

-- Allow public read/write on Zone
CREATE POLICY "Zone_select" ON "Zone" FOR SELECT USING (true);
CREATE POLICY "Zone_insert" ON "Zone" FOR INSERT WITH CHECK (true);
CREATE POLICY "Zone_update" ON "Zone" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Zone_delete" ON "Zone" FOR DELETE USING (true);

-- Allow public read/write on Playlist
CREATE POLICY "Playlist_select" ON "Playlist" FOR SELECT USING (true);
CREATE POLICY "Playlist_insert" ON "Playlist" FOR INSERT WITH CHECK (true);
CREATE POLICY "Playlist_update" ON "Playlist" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Playlist_delete" ON "Playlist" FOR DELETE USING (true);

-- Allow public read/write on PlayHistory
CREATE POLICY "PlayHistory_select" ON "PlayHistory" FOR SELECT USING (true);
CREATE POLICY "PlayHistory_insert" ON "PlayHistory" FOR INSERT WITH CHECK (true);
CREATE POLICY "PlayHistory_update" ON "PlayHistory" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "PlayHistory_delete" ON "PlayHistory" FOR DELETE USING (true);

-- Allow public read/write on StorageLocation
CREATE POLICY "StorageLocation_select" ON "StorageLocation" FOR SELECT USING (true);
CREATE POLICY "StorageLocation_insert" ON "StorageLocation" FOR INSERT WITH CHECK (true);
CREATE POLICY "StorageLocation_update" ON "StorageLocation" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "StorageLocation_delete" ON "StorageLocation" FOR DELETE USING (true);

-- Allow public read/write on Podcast
CREATE POLICY "Podcast_select" ON "Podcast" FOR SELECT USING (true);
CREATE POLICY "Podcast_insert" ON "Podcast" FOR INSERT WITH CHECK (true);
CREATE POLICY "Podcast_update" ON "Podcast" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Podcast_delete" ON "Podcast" FOR DELETE USING (true);

-- Allow public read/write on PodcastEpisode
CREATE POLICY "PodcastEpisode_select" ON "PodcastEpisode" FOR SELECT USING (true);
CREATE POLICY "PodcastEpisode_insert" ON "PodcastEpisode" FOR INSERT WITH CHECK (true);
CREATE POLICY "PodcastEpisode_update" ON "PodcastEpisode" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "PodcastEpisode_delete" ON "PodcastEpisode" FOR DELETE USING (true);

-- Allow public read/write on User
CREATE POLICY "User_select" ON "User" FOR SELECT USING (true);
CREATE POLICY "User_insert" ON "User" FOR INSERT WITH CHECK (true);
CREATE POLICY "User_update" ON "User" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "User_delete" ON "User" FOR DELETE USING (true);

-- Storage bucket policies: allow public upload/read
CREATE POLICY "audio_select" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "audio_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio');
CREATE POLICY "audio_update" ON storage.objects FOR UPDATE USING (bucket_id = 'audio');
CREATE POLICY "audio_delete" ON storage.objects FOR DELETE USING (bucket_id = 'audio');

CREATE POLICY "cover_art_select" ON storage.objects FOR SELECT USING (bucket_id = 'cover-art');
CREATE POLICY "cover_art_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cover-art');
CREATE POLICY "cover_art_update" ON storage.objects FOR UPDATE USING (bucket_id = 'cover-art');
CREATE POLICY "cover_art_delete" ON storage.objects FOR DELETE USING (bucket_id = 'cover-art');
