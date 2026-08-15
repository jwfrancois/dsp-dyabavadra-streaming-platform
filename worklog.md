---
Task ID: 1
Agent: Main Agent
Task: Enhance DSP Now Playing, Player Bar, and Artist views with album covers, artist photos, and rich web metadata

Work Log:
- Explored entire DSP codebase structure: 35+ components, 11 Zustand stores, API routes, hooks
- Read all key files: NowPlayingView.tsx, PlayerBar.tsx, ArtistDetailView.tsx, AlbumDetailView.tsx, CoverArt.tsx, data.ts, use-music-metadata.ts, music-metadata API route, audio-db.ts, local-library.ts
- Added `artist-image` and `similar-artists` API endpoints to `/api/music-metadata/route.ts`
- Added `useArtistImage` and `useSimilarArtists` hooks to `src/lib/use-music-metadata.ts`
- Added `ArtistImageResult` and `SimilarArtistsResult` type interfaces
- Enhanced `NowPlayingView.tsx` with:
  - Real album cover art from local library (resolved from sibling tracks in same album)
  - Artist info card with quick bio fetched from web
  - Album info card with web-fetched album description
  - Signal path visualization showing current track format chain
  - Format/sample rate/bit depth badges prominently displayed
  - Dynamic background gradient
  - Vinyl peek effect on cover art hover
  - File info card
  - Up Next queue with real cover art per track
  - External links to full bio and album info sources
- Enhanced `PlayerBar.tsx` with:
  - Real cover art images in the music mode player bar (resolved from local library)
  - Cover art shine overlay for visual polish
  - Same enhancement for queue items in up-next
- Enhanced `ArtistDetailView.tsx` with:
  - Large hero section with gradient background blur and prominent artist photo area
  - 4-column stats grid (Albums, Tracks, Total Duration, Genres)
  - Full artist biography from web (Wikipedia, AllMusic, Britannica, Discogs)
  - Web discography section with source links
  - Similar/Related artists from web search
  - Audio format breakdown with file size totals
  - Shuffle play button
  - Cover art on discography album cards with format badges
  - Cover art on track list items with format/sample rate info per track
  - Source attribution card
- Enhanced `CoverArt.tsx` to accept optional `coverArtUrl` prop for real images
- Build verified: `next build` succeeded with 0 errors

Stage Summary:
- All 6 components enhanced for premium Roon/Spotify-beating quality
- Web metadata fetching: artist bios, album info, discography, similar artists, artist images
- Real cover art displayed throughout: PlayerBar, NowPlaying, Artist Detail, Album Detail
- Build passes cleanly

---
Task ID: 2
Agent: Main Agent
Task: Fix music library data persistence issue on Vercel deployment

Work Log:
- Diagnosed root cause: Next.js SSR hydration mismatch with Zustand persist middleware
  - SSR renders page with empty default state (no localStorage access on server)
  - Zustand rehydrates from localStorage but hydration may not trigger visible re-render
  - User sees empty library even though data exists in localStorage
- Secondary issue: onRehydrateStorage had fragile pending counter that could hang forever
  - Hundreds of individual IndexedDB reads with Promise.all inside a loop
  - If any promise threw before decrementing, counter never reached 0
- Tertiary issue: Server-side scan (fs.readdir) incompatible with Vercel serverless

- Fixed `src/store/local-library.ts`:
  - Rewrote onRehydrateStorage with Promise.allSettled (never hangs)
  - Added batch IndexedDB reads with proper error handling
  - Added diagnostic logging for rehydration debugging
- Created `src/components/StoreHydration.tsx`:
  - Hydration gate component that blocks rendering until Zustand rehydrates
  - Shows "Restoring library..." loading spinner during rehydration
  - Falls back to server-side backup if localStorage is empty
  - 3-second safety timeout to prevent infinite loading
- Updated `src/app/page.tsx`:
  - Wrapped entire app in StoreHydrationGate
  - Prevents flash of empty content before rehydration completes
- Updated `src/lib/audio-db.ts`:
  - Added error handling for getAudioBlobURL (catch and log instead of throw)
  - Added onclose/onerror handlers for database connection
- Updated `src/store/player.ts`:
  - Added async resolveAudioUrl() with IndexedDB fallback
  - For client-imported tracks without blobUrl, tries to get from IndexedDB on demand
- Created `src/app/api/library/save/route.ts`:
  - Server-side library backup API (POST save, GET load, DELETE clear)
  - Stores track metadata as JSON in data/library-backup.json
  - Audio blobs NOT uploaded (too large), only metadata persisted
- Updated `src/components/dsp/LibraryManagementView.tsx`:
  - Auto-saves library to server backup after successful import
  - Fire-and-forget POST to /api/library/save

Stage Summary:
- Core fix: Hydration gate prevents Next.js SSR from showing empty library
- Reliability fix: Batch IndexedDB reads with Promise.allSettled never hangs
- Server backup: Library metadata saved to server on import, restored on load
- Audio fallback: resolveAudioUrl() tries IndexedDB if blobUrl is missing
- Build compiles successfully with all changes
