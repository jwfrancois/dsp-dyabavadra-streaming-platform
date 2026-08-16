# DSP (Dyabavadra Streaming Platform) — Competitive Analysis & Gap Report

> **Scope**: Audit of 7 best-in-class music platforms vs. DSP's current codebase.
> **Tech constraint**: Recommendations scoped to what's achievable in a Next.js + Web Audio API web app.
> **Date**: July 2025

---

## PART 1: Platform-by-Platform Deep Dive

---

### 1. ROON — The Audiophile Gold Standard

**Price**: $12.99/mo (lifetime $899) | **Architecture**: Core + Remote + RAAT protocol + ARC (mobile)

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **Metadata Engine** | Proprietary enriched dataset sourced from MusicBrainz, TiVo/AllMusic, Rovi. Cross-references performers, composers, producers, engineers. Every person is a link to deep biographical info. |
| **Classical Music** | Composer-first hierarchy (not artist-album-track). Supports multi-part works (movements), period, instrumentation, form. Lists conductor, ensemble, soloists, recording venue, and date per recording. |
| **Versions** | Shows all album versions (different masterings, sample rates, encodings) across local + streaming (Qobuz, TIDAL, nugs, KKBOX). User can highlight a favorite version. |
| **MUSE DSP Engine** | Parametric + procedural EQ, volume leveling, upsampling, room correction (convolution), headphone crossfeed. Works on PCM, MQA, DSD. Up to 768kHz/32-bit PCM and DSD512. |
| **Signal Path Display** | Transparent real-time view of every processing step between source file and DAC output. Shows sample rate, bit depth, bit-perfect status per stage. |
| **Multi-Room Sync** | Synchronized playback to multiple endpoints via RAAT protocol. Zone grouping with sample-accurate sync. |
| **Discovery** | Infinite cross-linking: influences, followers, collaborators, related artists — even for artists NOT in your library. |
| **Lyrics** | Synced (line-by-line scrolling) and static lyric sheets for millions of tracks. |
| **Localization** | "Fluency" — UI genres, credit roles, artist name transliteration to other character sets. Wikipedia reviews in 20 languages. |
| **Bit-Perfect** | Checks DAC capabilities, adjusts sample rate/bit depth automatically. ASIO/WASAPI/CoreAudio exclusive mode. |

#### What Roon Does BETTER Than Anyone
- **Metadata density**: No other platform comes close to linking composers → performers → recording venues → works → movements.
- **Unified library**: Seamlessly merges local files + 4 streaming services into one browsable, cross-referenced graph.
- **Classical music**: The only platform that treats classical music as first-class with proper work/movement hierarchy.
- **Signal Path transparency**: The gold standard for showing exactly what's happening to the audio.

#### UX Patterns Worth Copying
1. **Everything is a link** — tap any person, place, or credit to explore deeper.
2. **Version comparison** — see all masterings of an album side-by-side with quality indicators.
3. **Focus/focus+ layouts** — clean, visual browsing that scales from album art grids to dense metadata tables.
4. **Valence** (AI-powered recommendations launched 2024) — uses listening habits + metadata graph for discovery.

---

### 2. SPOTIFY — The Discovery King

**Price**: Free / $11.99/mo Premium | **Users**: 640M+

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **AI DJ** | Personalized AI guide with voice narration. Selects tracks based on user taste profile. Powered by generative AI + Spotify's recommendation models. |
| **Daylist** | Auto-updating playlist that changes 3x/day based on time-of-day, listening patterns, and inferred mood. Creative, whimsical titles ("late night soft indie vibes"). |
| **AI Playlist** | Prompt-based playlist generation ("a playlist for a road trip through the desert"). Uses NLP to interpret intent. |
| **Blend** | Social feature that creates a shared playlist merging taste profiles of 2-10 users. Shows "taste match" score. |
| **Collaborative Playlists** | Real-time multi-user playlist editing. Invite via link. |
| **Wrapped** | Annual data storytelling experience. 2.3 billion impressions (2025). Highly shareable, gamified year-in-review. |
| **Discover Weekly / Release Radar** | ML-driven weekly fresh music recommendations. Algorithm considers co-listening patterns, audio analysis, and user behavior. |
| **Smart Shuffle** | Adds sonically similar songs to existing playlists in real-time. |
| **Canvas** | Short visual loops that play over tracks — adds visual identity to songs. |
| **Spotify Connect** | Cross-device playback control (phone → speaker → TV). |

#### What Spotify Does BETTER Than Anyone
- **Discovery UX**: The best algorithmic recommendations in the industry. Daylist and AI DJ are genuinely delightful.
- **Social/viral features**: Wrapped, collaborative playlists, Blend — all designed for sharing.
- **Frictionless listening**: The fastest path from "open app" to "music playing" of any platform.
- **Data storytelling**: Wrapped proves that presenting user data back to them in a beautiful way drives massive engagement.

#### UX Patterns Worth Copying
1. **Daylist's auto-evolving concept** — context-aware playlists that shift with time/mood.
2. **Blend taste-matching** — visual representation of how two users' tastes overlap.
3. **AI DJ narration** — voice-guided listening that explains WHY a track was chosen.
4. **Wrapped's shareable cards** — data visualization as social content.
5. **"Add to queue" vs "Play next"** — clear, immediate queue manipulation.

---

### 3. APPLE MUSIC — Quality Meets Ecosystem

**Price**: $11.99/mo (included in Apple One) | **Catalog**: 100M+ tracks

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **Lossless Audio** | ALAC up to 24-bit/192 kHz across entire catalog. No extra cost. |
| **Spatial Audio (Dolby Atmos)** | Thousands of tracks in immersive spatial audio. Head-tracked on AirPods Pro/Max. |
| **Apple Music Classical** | Dedicated app (now web too, 5M+ tracks). Composer → Work → Recording hierarchy. Search by composer, opus number, conductor, ensemble, soloist. |
| **Siri Integration** | Voice control for playback, search, and queue management. |
| **Curated Playlists** | Human-edited playlists by music journalists and experts. Apple Music Editorial team. |
| **Sing** | Real-time lyrics with adjustable vocal volume (karaoke mode). |
| **Apple Music Replay** | Year-in-review feature (Spotify Wrapped competitor). |
| **Dynamic Island / Live Activities** | Tight iOS integration for playback controls. |

#### What Apple Music Does BETTER Than Anyone
- **Spatial Audio catalog**: The largest Dolby Atmos music library.
- **Classical app**: Best dedicated classical music experience after Roon (now on web).
- **Ecosystem integration**: Siri, AirPlay, HomePod, Dynamic Island, CarPlay — seamless.
- **Value proposition**: Lossless + Spatial at no extra cost over base price.

#### UX Patterns Worth Copying
1. **Classical app's search by metadata** — opus number, key, conductor, period.
2. **Sing mode** — adjustable vocal volume for karaoke.
3. **Lossless badge** — clear visual indicators for quality tier on every track.
4. **Editorial sections** — human-curated content with magazine-quality presentation.

---

### 4. TIDAL & QOBUZ — The Audiophile Streamers

**Tidal**: $11.49/mo (HiFi) / $19.49/mo (HiFi Plus) | **Qobuz**: $10.83/mo (Studio) / $15/mo (Sublime)

#### Key Differentiating Features

| Feature | TIDAL | Qobuz |
|---------|-------|-------|
| **Max Quality** | FLAC up to 24-bit/192 kHz (dropped MQA in 2024) | FLAC up to 24-bit/192 kHz |
| **MQA** | Dropped in 2024, replaced with FLAC HiRes | Never supported (purist approach) |
| **Artist Payouts** | TIDAL pays ~1.5x Spotify per stream | Qobuz pays highest per-stream rate among streamers |
| **Booklet/Liner Notes** | Limited | **Qobuz provides digital booklets** for many albums |
| **Mastering Quality** | "Master Quality" tier | Qobuz consistently sounds more focused/natural in blind tests |
| **Discovery** | Improving algorithm, TIDAL Rising for emerging artists | Weaker discovery; relies on editorial curation |
| **Videos** | Music videos, live sessions | Music videos, interviews |
| **Offline** | Full offline downloads at selected quality | Full offline downloads |

#### What They Do BETTER Than Others
- **Qobuz**: Liner notes/booklets, highest artist payouts, purist approach (no MQA), consistently praised sound quality.
- **TIDAL**: Better discovery features, music videos, larger user base, artist-first initiatives (TIDAL Rising, artist-owned).

#### UX Patterns Worth Copying
1. **Qobuz's digital booklets** — PDF-style liner notes that enrich the album experience.
2. **Quality badges on every track** — clear display of format, sample rate, bit depth.
3. **TIDAL's Master Quality indicator** — visual confirmation of hi-res stream.
4. **Album credits visibility** — detailed production credits easily accessible.

---

### 5. AUDIRVANA — The Bit-Perfect Purist

**Price**: $14.99/mo (Studio) / $119.99 (Origin, perpetual) | **Platform**: macOS, Windows

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **Bit-Perfect by Default** | DAC receives exact data from source file. No hidden processing. |
| **Format Support** | FLAC, WAV, AIFF, ALAC, DSD (DSF/DFF/ISO), up to 32-bit/768kHz PCM, DSD512. |
| **Qobuz Integration** | Native streaming of Qobuz in Hi-Res, seamlessly integrated with local library. |
| **DAC Integration** | Exclusive mode (ASIO/WASAPI/CoreAudio). Auto sample rate switching per track. |
| **Memory Play** | Loads entire track into RAM before playback — eliminates disk I/O jitter. |
| **Volume Control Modes** | Integer mode (lossless digital volume), hybrid mode, direct hardware control. |
| **Minimal UI** | Clean, functional interface focused on sound quality, not social features. |

#### What Audirvana Does BETTER Than Anyone
- **True bit-perfect** with automatic sample rate switching.
- **Memory play** — zero disk activity during playback.
- **DAC integration** — the most direct path from file to DAC.

#### UX Patterns Worth Copying
1. **Integer volume control** — lossless digital volume that preserves bit-perfect output.
2. **Auto sample rate display** — always shows what the DAC is currently receiving.
3. **Minimal chrome** — UI that gets out of the way of the music.

---

### 6. PLEXAMP — Visual Design + Sonic Intelligence

**Price**: Free with Plex Pass ($4.99/mo) | **Platform**: macOS, Windows, Linux, iOS, Android

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **Sonic Analysis** | Neural network analyzes every track in your library creating a sonic fingerprint (tempo, mood, energy, key, instrumentation). Powers DJ, radios, and recommendations. |
| **Visualizers** | Multiple stunning audio visualizer modes (Glow, Waveform, Spectrum, Retro-fio). Reactive to real-time audio using WebGL/Canvas. |
| **Plexamp DJ** | AI-powered DJ that mixes tracks from your library based on sonic similarity + BPM matching. |
| **Sonically Similar Radio** | Generates endless streams of music that sounds like a seed track/artist. |
| **Compact/Mini Mode** | Ultra-small Always-On-Top player. |
| **Rich Visual Design** | Album art-focused UI with smooth animations. Multiple layout themes. |
| **Local-First** | No cloud dependency for local library playback. |

#### What Plexamp Does BETTER Than Anyone
- **Audio visualizations**: The most beautiful and varied visualizer in any music app.
- **Sonic analysis for local libraries**: No other self-hosted solution does audio-feature extraction at this level.
- **Visual design polish**: Feels like a premium product despite being an "indie" app.

#### UX Patterns Worth Copying
1. **Sonic fingerprinting** — analyze audio features (not just metadata) for recommendations.
2. **Multiple visualizer modes** — give users visual options that react to the music.
3. **Mini/compact mode** — always-on-top tiny player for desktop.
4. **DJ-style transitions** — beat-matched crossfades between tracks.

---

### 7. NAVIDROME — The Open Source Champion

**Price**: Free (MIT License) | **Platform**: Self-hosted, any OS, Docker

#### Key Differentiating Features

| Feature | Details |
|---------|---------|
| **Lightweight** | Single Go binary. ~15MB RAM. Runs on Raspberry Pi. Handles 100K+ track libraries. |
| **Subsonic API** | Compatible with 50+ existing Subsonic client apps. |
| **Web UI** | Modern, responsive web interface. Custom themes supported. |
| **Smart Playlists** | Rule-based auto-updating playlists (newest, most played, genre filters, etc.). |
| **Multi-Library** | Support for multiple music libraries with separate configs. |
| **Jukebox Mode** | Server-side playback (audio output on the server machine). |
| **Last.fm/ListenBrainz Scrobbling** | Built-in scrobbling support. |
| **Plugins** | Extensible plugin system (AudioMuse AI plugin available). |
| **Podcast Support** | Native podcast subscription and playback. |
| **Sharing** | Share specific tracks/albums via public links. |

#### What Navidrome Does BETTER Than Anyone
- **Resource efficiency**: The lightest self-hosted option by far.
- **Subsonic compatibility**: Largest ecosystem of client apps.
- **Zero cost + open source**: Complete freedom.

#### UX Patterns Worth Copying
1. **Smart playlists with live rules** — auto-updating collections based on criteria.
2. **Jukebox mode** — server-side audio output.
3. **Plugin architecture** — community extensions for features the core doesn't provide.
4. **Theme system** — user-customizable visual themes.

---

## PART 2: DSP CURRENT STATE AUDIT

After examining the DSP codebase (`/src/`), here's what currently exists:

### What DSP Already Has
| Feature | Status | Implementation |
|---------|--------|----------------|
| **Web Audio DSP Pipeline** | ✅ Real | `audio-engine.ts` — parametric EQ, crossfeed (bs2b-style), loudness normalization, volume limiter, master gain |
| **Signal Path Display** | ✅ Real | `SignalPathView.tsx` — shows format/rate/depth/bit-perfect per processing stage |
| **Per-Zone DSP Config** | ✅ Real | `dsp-engine.ts` store — separate DSP configs per output zone |
| **Zone Management** | ✅ Real | `ZonesView.tsx`, `ZonePicker.tsx` — multi-zone concept with endpoint management |
| **Endpoint Management** | ✅ Real | `OutputEndpointsView.tsx` — DAC details, protocol, buffer, clock source |
| **Local File Playback** | ✅ Real | `AudioEngineProvider.tsx` + `/api/library/stream` — browser file import + server-side streaming |
| **Library Scanning** | ✅ Real | `library-data.ts`, `/api/library/scan` — file discovery, metadata parsing, music-metadata npm package |
| **Metadata: Basic** | ✅ Real | Track/Album/Artist types with composers, performers, credits, format, bitDepth, sampleRate |
| **Classical Music: Structure** | ⚠️ Partial | `WorkDetailView.tsx`, `ComposerDetailView.tsx`, `PerformerDetailView.tsx` exist but are stub/placeholder |
| **Podcast Support** | ✅ Real | Full podcast store, feed parsing, speed control, sleep timer, silence skip |
| **Radio Streaming** | ✅ Real | Internet radio with proxy, station favorites, genre browsing |
| **Play Queue** | ✅ Real | Full queue management: add, remove, reorder (dnd-kit), shuffle, repeat |
| **User Profiles** | ✅ Real | Multiple profiles, loved tracks, play history per profile |
| **Smart Collections** | ⚠️ Partial | `LibraryManagementView.tsx` has rules but no real evaluation engine |
| **DSP Config UI** | ✅ Real | `DSPConfigView.tsx` — full EQ band editor, crossfeed presets, volume limit, loudness config |
| **Plugin System** | ⚠️ UI only | `PluginManagerView.tsx` exists, types defined, but no runtime plugin loading |
| **Search** | ✅ Real | `SearchView.tsx` — search across tracks, albums, artists |
| **Play History** | ⚠️ Partial | Store exists, no rich analytics/visualization |
| **Browse Views** | ✅ Real | Artists, Albums, Tracks, Genres, Playlists — all with grid/list views |
| **Cover Art** | ✅ Real | `CoverArt.tsx` — embedded art extraction, gradient fallbacks |
| **Licensing View** | ✅ Real | Codec/protocol licensing tracking |
| **System Health** | ✅ Real | `SystemHealthView.tsx` — CPU, memory, engine load monitoring |
| **Streaming Service Integration** | ⚠️ Types only | `StreamingView.tsx` shows Tidal/Qobuz connection UI, but no real OAuth flow |

### What DSP is Missing (Explicitly Absent from Codebase)
- Audio visualization (no Canvas/WebGL, no AnalyserNode usage)
- Real recommendation/discovery engine (store is stub)
- Lyrics display (no component or API)
- Collaborative/social features
- Gapless playback (store flag exists, no implementation)
- Any audio analysis / sonic fingerprinting
- Real Loudness measurement (uses fallbackGain, not actual LUFS)

---

## PART 3: GAP ANALYSIS — Prioritized by Impact

### TIER 1: Critical Gaps (High Impact, Feasible in Web Audio)

#### GAP-1: Audio Visualization (AnalyserNode)
**Who does it best**: Plexamp
**Current State**: DSP has zero visualization. No `AnalyserNode` is created in `audio-engine.ts`.
**Why Critical**: Visual feedback is the single most impactful UX differentiator for a web-based player. It's what makes the app feel *alive*.

**Implementation (Web Audio API)**:
```
Add AnalyserNode branch from the DSP chain → Canvas/WebGL renderers
```
- Add `AnalyserNode` to the DSP chain (before master gain)
- Create 3 visualization modes:
  - **Spectrum bars** — frequency domain (`getByteFrequencyData`)
  - **Waveform** — time domain (`getByteTimeDomainData`) 
  - **Circular visualizer** — frequency mapped to radial bars (Plexamp Glow-style)
- Use `requestAnimationFrame` loop with Canvas API (no WebGL needed for initial impl)
- Expose visualization data to React via a custom hook (`useAudioAnalyser`)
- ~3-4 days effort

---

#### GAP-2: Real-Time Loudness Measurement (EBU R128 / ReplayGain)
**Who does it best**: Roon (MUSE engine), Audirvana
**Current State**: DSP has `LoudnessConfig` with `targetLUFS` and method fields, but the audio engine just applies a static `fallbackGain` (1.0). No actual LUFS measurement.
**Why Critical**: The loudness normalization feature is currently non-functional. This is a core audiophile feature.

**Implementation (Web Audio API)**:
```
OfflineAudioContext → RMS measurement → LUFS calculation → gain compensation
```
- Implement EBU R128 short-term loudness measurement using `OfflineAudioContext`
- Pre-scan tracks on load to measure integrated loudness
- Cache LUFS values per track in IndexedDB / server-side DB
- Apply real-time gain compensation in the loudness GainNode
- Show measured LUFS value in Now Playing and Signal Path views
- ~5-7 days effort

---

#### GAP-3: Gapless Playback
**Who does it best**: Roon, Apple Music, every serious player
**Current State**: Store has `gaplessPlayback: boolean` flag. No implementation. Web Audio `HTMLAudioElement` doesn't natively support gapless.
**Why Critical**: Audible gaps between tracks (especially in classical/concept albums) break the listening experience. This is table-stakes.

**Implementation (Web Audio API)**:
```
Web Audio API → AudioBufferSourceNode scheduling with precise timing
```
- Switch from `HTMLAudioElement` to `AudioBufferSourceNode` for local files
- Use `AudioContext.currentTime` for sample-accurate scheduling
- Pre-decode next track while current plays
- Crossfade overlap (0-500ms configurable)
- For streaming URLs, use MediaSource Extensions (MSE) or keep HTMLAudioElement with timed pre-loading
- ~5-7 days effort

---

#### GAP-4: Lyrics Display (Synced + Static)
**Who does it best**: Apple Music (Sing), Spotify, Roon
**Current State**: Track type has `lyrics?: string` field. `useLyrics` hook exists in `NowPlayingView.tsx` but implementation is unclear/external. No lyrics display component.
**Why Critical**: Lyrics are the #1 most-requested feature in any music app. It's expected behavior.

**Implementation**:
```
LRCLIB.net API (free) → sync lyric parsing → scroll-along component
```
- Integrate LRCLIB.net or Musixmatch API for lyrics fetching
- Parse LRC format (timestamped lyrics) for synced display
- Create `LyricsView` component with:
  - Auto-scroll to current line (smooth CSS transform)
  - Tap-to-seek on lyric lines
  - Static/synced toggle
- Cache lyrics server-side in DB
- ~3-4 days effort

---

### TIER 2: High-Impact Gaps (Strong Differentiation)

#### GAP-5: Smart Discovery / Recommendation Engine
**Who does it best**: Spotify (AI DJ, Daylist, Discover Weekly)
**Current State**: `discovery.ts` store has `startRadioFrom()` that returns an empty radio with no tracks. No collaborative filtering, no audio analysis.
**Why Important**: Without recommendations, users must know what they want. This limits engagement and library exploration.

**Implementation**:
```
Content-based filtering using audio features + metadata + play history
```
- Implement a simple content-based recommendation using:
  - Metadata similarity (same genre, artist, label)
  - Play history patterns (co-occurrence, frequency)
  - Audio feature similarity (if GAP-7 implemented)
- Build a "For You" homepage section with:
  - Recently played → similar tracks
  - Genre deep-dives
  - "Rediscover" — forgotten favorites
  - Time-based suggestions (morning/afternoon/evening, inspired by Daylist)
- Server-side scoring + caching (Next.js API routes + DB)
- ~7-10 days effort

---

#### GAP-6: Real Classical Music Support
**Who does it best**: Roon, Apple Music Classical
**Current State**: `WorkDetailView.tsx`, `ComposerDetailView.tsx`, `PerformerDetailView.tsx` exist but are **empty stubs**. Track type has `composers: string[]` and `performers: Credit[]` but no work/movement hierarchy.
**Why Important**: Classical music metadata is fundamentally different from pop. If DSP claims audiophile credentials, classical support must be real.

**Implementation**:
```
Work/Movement data model → Composer-first browse mode → Recording comparison
```
- Define `Work`, `Movement`, `Recording` data models
- Parse classical metadata from MusicBrainz API (work ID, movement, opus number, key)
- Implement Composer-first browse mode:
  - Composer → Works → Recordings → Tracks
  - Alternative: Composer → Period → Works
- Show recording comparison table (conductor, ensemble, year, quality)
- ~7-10 days effort

---

#### GAP-7: Sonic Analysis / Audio Feature Extraction
**Who does it best**: Plexamp (neural network), Spotify (internal)
**Current State**: Zero audio analysis. No feature extraction.
**Why Important**: Metadata-based recommendations miss the mark for mood/energy matching. Sonic analysis enables "sounds like" features and better recommendations.

**Implementation**:
```
Web Audio API AnalyserNode → statistical feature extraction → DB storage
```
- During library scan or on-demand, extract audio features:
  - RMS energy, spectral centroid, spectral rolloff, zero-crossing rate
  - BPM/tempo estimation (autocorrelation or onset detection)
  - Key detection (chroma features)
  - Dynamic range (DR value)
- Use `OfflineAudioContext` + `AnalyserNode` for server-side extraction (or WASM in browser)
- Store features as JSON in track metadata
- Power "sonically similar" recommendations and radio stations
- ~7-10 days effort

---

#### GAP-8: Volume Leveling / Smart Volume
**Who does it best**: Spotify (built-in, transparent), Roon (volume leveling)
**Current State**: `LoudnessConfig` exists. Volume limiter works (brick-wall DynamicsCompressor). No track-to-track leveling.
**Why Important**: Jumping between tracks with wildly different volumes (classical vs. pop vs. podcast) is jarring.

**Implementation**:
```
Pre-computed LUFS per track → gain ramp between tracks
```
- Prerequisite: GAP-2 (loudness measurement)
- Store ReplayGain / LUFS values per track
- Apply gain adjustment in the DSP chain before output
- Smooth gain ramp (100-300ms) between tracks to avoid clicks
- Show leveling status in signal path
- ~2-3 days (after GAP-2)

---

### TIER 3: Medium-Impact Gaps (Polish & Engagement)

#### GAP-9: Listening Stats / Wrapped-Style Analytics
**Who does it best**: Spotify (Wrapped), Apple Music (Replay)
**Current State**: `PlayHistoryView.tsx` exists. `PlayHistoryEntry` has playedAt, completed, zone, source. No analytics, no charts, no visualizations.
**Why Important**: Data storytelling drives engagement. Users love seeing their listening patterns visualized.

**Implementation**:
```
Aggregate play history → charts (recharts) → shareable summary cards
```
- Top artists, albums, tracks (by play count, total time)
- Genre breakdown pie chart
- Listening time by day/week/month line chart
- Audio quality distribution (format/sample rate breakdown)
- "Your Year in Music" shareable card (image generation via Canvas or HTML-to-image)
- DSP already has `recharts` in dependencies!
- ~4-5 days effort

---

#### GAP-10: Room Correction / Convolution
**Who does it best**: Roon (MUSE), Audirvana
**Current State**: `RoomCorrection` type exists with filterName, samplerate, channels, delayMs. Not implemented in `audio-engine.ts`.
**Why Important**: Room correction is the single biggest audio quality improvement for most listeners. This is a key audiophile feature.

**Implementation (Web Audio API)**:
```
ConvolverNode → impulse response WAV → per-channel application
```
- Load impulse response (IR) WAV file via file upload or URL
- Create `ConvolverNode` in the DSP chain
- Support mono/stereo/multi-channel IRs
- Allow per-zone room correction profiles
- Show IR frequency response curve in the UI
- ~3-5 days effort

---

#### GAP-11: Real Upsampling
**Who does it best**: Roon (MUSE), Audirvana, HQPlayer
**Current State**: `UpsamplingConfig` type exists with targetRate, targetBitDepth, filterType. Not implemented.
**Why Important**: Upsampling can improve DAC performance (many DACs sound better at higher rates).

**Implementation (Web Audio API)**:
```
AudioContext sample rate → OfflineAudioContext resampling → ScriptProcessorNode/AudioWorklet
```
- Create `AudioWorklet` (or `ScriptProcessorNode` as fallback) for custom resampling
- Support target rates: 48kHz, 88.2kHz, 96kHz, 176.4kHz, 192kHz
- Implement windowed-sinc interpolation (quality resampling)
- Show the resampling in Signal Path with before/after rates
- **Limitation**: Browser AudioContext max sample rate is typically 96kHz (varies by browser). Can use OfflineAudioContext for higher.
- ~5-7 days effort

---

#### GAP-12: Collaborative Playlists
**Who does it best**: Spotify, Apple Music
**Current State**: Playlist type exists. No sharing, no collaboration.
**Why Important**: Social features increase retention and make the platform "sticky."

**Implementation**:
```
Share link → real-time sync (WebSocket) → multi-user edit
```
- Generate share links for playlists
- Real-time collaboration via WebSocket (Next.js API routes)
- Show contributor avatars
- Permission model: owner, editor, viewer
- ~5-7 days effort

---

#### GAP-13: Crossfade Between Tracks
**Who does it best**: Plexamp DJ, Spotify
**Current State**: Not implemented.
**Why Important**: Smooth transitions between tracks elevate the listening experience from "jukebox" to "curated flow."

**Implementation (Web Audio API)**:
```
Two simultaneous AudioBufferSourceNodes with gain ramps
```
- Overlap next track's start with current track's end
- Gain ramp down on outgoing, ramp up on incoming
- Configurable crossfade duration (0-12 seconds)
- Smart crossfade: beat-matched if BPM data available
- Part of GAP-3 (gapless) architecture
- ~2-3 days (with GAP-3)

---

#### GAP-14: Keyboard Shortcuts / Global Hotkeys
**Who does it best**: Spotify, Plexamp
**Current State**: Not implemented.
**Why Important**: Power users expect keyboard control. It's a small effort, high perceived value.

**Implementation**:
- Global `keydown` listener in `AudioEngineProvider`
- Space = play/pause, ←/→ = seek, ↑/↓ = volume
- Cmd/Ctrl+→ = next, Cmd/Ctrl+← = previous
- `/` = focus search
- Show shortcut overlay on `?` key press
- ~1-2 days effort

---

### TIER 4: Lower Priority (Nice-to-Have, Higher Effort)

#### GAP-15: Album Liner Notes / Booklets
**Inspired by**: Qobuz
**Effort**: ~3-5 days
**Implementation**: Upload PDF/images per album. Display in a dedicated modal with page navigation.

#### GAP-16: Theme System
**Inspired by**: Navidrome
**Effort**: ~3-5 days
**Implementation**: CSS custom properties + theme persistence. DSP already uses `next-themes` for dark mode.

#### GAP-17: "AI DJ" Style Narrated Discovery
**Inspired by**: Spotify AI DJ
**Effort**: ~10+ days (requires LLM integration)
**Implementation**: Use LLM API to generate track introductions. TTS for narration. Would require z-ai-web-dev-sdk.

#### GAP-18: Mobile PWA / Installable App
**Inspired by**: All platforms
**Effort**: ~2-3 days
**Implementation**: Add `manifest.json`, service worker, offline caching. DSP is already a SPA.

#### GAP-19: Last.fm / ListenBrainz Scrobbling
**Inspired by**: Navidrome
**Effort**: ~2-3 days
**Implementation**: Call Last.fm scrobble API on track complete (50% played threshold). Settings page for API key.

#### GAP-20: Headphone Correction Profiles
**Inspired by**: Roon, AutoEq
**Current State**: `HeadphoneCorrection` type exists. Not implemented.
**Effort**: ~5-7 days
**Implementation**: Import EQ curves from AutoEq database. Apply via BiquadFilterNode chain.

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-3) — *Make it feel alive*

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | GAP-1: Audio Visualization | 3-4 days | ★★★★★ |
| 2 | GAP-4: Lyrics Display | 3-4 days | ★★★★★ |
| 3 | GAP-14: Keyboard Shortcuts | 1-2 days | ★★★★☆ |
| 4 | GAP-18: PWA Installable | 2-3 days | ★★★★☆ |

### Phase 2: Audio Quality (Weeks 4-6) — *Earn the "audiophile" label*

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 5 | GAP-2: Real Loudness Measurement | 5-7 days | ★★★★★ |
| 6 | GAP-8: Volume Leveling | 2-3 days | ★★★★☆ |
| 7 | GAP-3: Gapless Playback | 5-7 days | ★★★★★ |
| 8 | GAP-13: Crossfade | 2-3 days | ★★★★☆ |
| 9 | GAP-10: Room Correction (ConvolverNode) | 3-5 days | ★★★★☆ |

### Phase 3: Intelligence (Weeks 7-10) — *Make it smart*

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 10 | GAP-7: Sonic Analysis | 7-10 days | ★★★★★ |
| 11 | GAP-5: Smart Discovery | 7-10 days | ★★★★★ |
| 12 | GAP-6: Classical Music | 7-10 days | ★★★★☆ |

### Phase 4: Engagement (Weeks 11-13) — *Make it sticky*

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 13 | GAP-9: Listening Stats | 4-5 days | ★★★★☆ |
| 14 | GAP-12: Collaborative Playlists | 5-7 days | ★★★☆☆ |
| 15 | GAP-19: Last.fm Scrobbling | 2-3 days | ★★★☆☆ |
| 16 | GAP-11: Upsampling | 5-7 days | ★★★☆☆ |

### Phase 5: Polish (Weeks 14+) — *Make it exceptional*

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 17 | GAP-20: Headphone Correction | 5-7 days | ★★★★☆ |
| 18 | GAP-15: Liner Notes | 3-5 days | ★★☆☆☆ |
| 19 | GAP-16: Theme System | 3-5 days | ★★★☆☆ |
| 20 | GAP-17: AI DJ | 10+ days | ★★★★☆ |

---

## PART 5: QUICK WINS (Under 1 Day Each)

These can be done immediately for maximum visual/UX impact:

1. **Add `AnalyserNode` to the DSP chain** — just 5 lines of code to start capturing frequency data
2. **Track-level quality badges** — show "Hi-Res", "Lossless", "DSD" badges on tracks (data already exists in Track type)
3. **"Now Playing" blur backdrop** — extract dominant color from cover art, apply as gradient background (inspired by Spotify)
4. **Duration/size in track list** — format and display file size + bitrate in browse views
5. **Audio quality indicator in PlayerBar** — show "FLAC 24/96" or "MP3 320k" next to the track title
6. **Drag-to-reorder in playlists** — dnd-kit is already installed
7. **"Love" heart animation** — add a micro-animation when toggling loved tracks
8. **Play count display** — show play count on tracks/albums (data model supports it)

---

## SUMMARY: DSP's Competitive Position

```
                    AUDIO QUALITY    DISCOVERY    VISUAL UX    SOCIAL    CLASSICAL
                    ─────────────    ─────────    ─────────    ──────    ────────
Roon                ██████████       ████████░░   ████████░░   ██░░░░░░░   ██████████
Spotify             ██████░░░░       ██████████   ███████░░░   ██████████   ██░░░░░░░
Apple Music         █████████░       ████████░░   ████████░░   ███████░░░   ████████░░
Tidal/Qobuz         ██████████       ██████░░░░   ██████░░░░   ██████░░░░   ████░░░░░
Audirvana           ██████████       ██░░░░░░░   █████░░░░░   ░░░░░░░░░   █████░░░░
Plexamp             ██████░░░░       ████████░░   ██████████   ██░░░░░░░   ░░░░░░░░░
Navidrome           ██████░░░░       ████░░░░░   ██████░░░░   ██░░░░░░░   ██░░░░░░░
                    ─────────────    ─────────    ─────────    ──────    ────────
DSP (current)       ████████░░       ██░░░░░░░   ██████░░░░   ░░░░░░░░░   ██░░░░░░░
DSP (after Phase 1) ████████░░       ██░░░░░░░   █████████░   ░░░░░░░░░   ██░░░░░░░
DSP (after Phase 3) █████████░       ████████░░   █████████░   ░░░░░░░░░   ████████░░
```

**DSP's core strength**: The Web Audio DSP pipeline (EQ, crossfeed, limiter, signal path) is genuinely best-in-class for a web app. No other web-based player has this level of DSP configurability.

**DSP's biggest weakness**: Zero visual feedback (no visualizer), zero discovery intelligence, and non-functional loudness normalization. The classical music views are stubs. These three gaps, if addressed, would transform DSP from "technically impressive demo" to "daily-driver player."

**Recommended first action**: Implement GAP-1 (Audio Visualization) and GAP-4 (Lyrics) this week. Together they take ~7 days and will make the app feel 10x more polished and engaging.
