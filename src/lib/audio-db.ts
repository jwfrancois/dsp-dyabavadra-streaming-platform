// src/lib/audio-db.ts
// IndexedDB wrapper for caching audio file blobs and cover art client-side.
// Allows DSP to play locally-scanned music without re-selecting files each time.

const DB_NAME = 'dsp-audio-cache';
const DB_VERSION = 2;
const BLOBS_STORE = 'audio-blobs';
const META_STORE = 'audio-meta';
const COVER_ART_STORE = 'cover-art';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COVER_ART_STORE)) {
        db.createObjectStore(COVER_ART_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle unexpected DB close (e.g., tab in background)
      dbInstance.onclose = () => {
        console.warn('[audio-db] Database connection closed unexpectedly, resetting instance');
        dbInstance = null;
      };
      dbInstance.onerror = (event) => {
        console.error('[audio-db] Database error:', event);
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error}`));
    };
  });
}

/** Store an audio blob and its metadata in IndexedDB */
export async function storeAudioTrack(
  trackId: string,
  audioBlob: Blob,
  metadata: Record<string, unknown>,
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');

    const blobStore = tx.objectStore(BLOBS_STORE);
    blobStore.put({
      id: trackId,
      audioBlob,
      format: metadata.format || 'unknown',
      mimeType: audioBlob.type || 'audio/mpeg',
      addedAt: Date.now(),
    });

    const metaStore = tx.objectStore(META_STORE);
    metaStore.put({ id: trackId, ...metadata });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve an audio blob by track ID */
export async function getAudioBlob(trackId: string): Promise<Blob | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    const request = store.get(trackId);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.audioBlob || null);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Create a blob URL for a cached audio track. Returns null if not cached.
 * NOTE: The caller is responsible for revoking the URL when no longer needed.
 * However, for long-lived playback URLs (restored on rehydrate), we intentionally
 * do NOT revoke them — they live for the page session.
 */
export async function getAudioBlobURL(trackId: string): Promise<string | null> {
  try {
    const blob = await getAudioBlob(trackId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn(`[audio-db] Failed to get audio blob URL for ${trackId}:`, err);
    return null;
  }
}

/** Check if a track is cached */
export async function isCached(trackId: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    const request = store.getKey(trackId);

    request.onsuccess = () => resolve(request.result !== undefined);
    request.onerror = () => reject(request.error);
  });
}

/** Delete a track from cache */
export async function deleteAudioTrack(trackId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
    tx.objectStore(BLOBS_STORE).delete(trackId);
    tx.objectStore(META_STORE).delete(trackId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Clear all cached audio */
export async function clearAllAudio(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
    tx.objectStore(BLOBS_STORE).clear();
    tx.objectStore(META_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get total cache size in bytes */
export async function getCacheSize(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      let total = 0;
      for (const record of request.result || []) {
        const blob = record.audioBlob as Blob;
        if (blob) total += blob.size;
      }
      resolve(total);
    };

    request.onerror = () => reject(request.error);
  });
}

/** Get count of cached tracks */
export async function getCacheCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const request = tx.objectStore(BLOBS_STORE).count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Get all cached track IDs */
export async function getCachedTrackIds(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const request = tx.objectStore(BLOBS_STORE).getAllKeys();

    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

// ── Cover Art Storage ──

/** Store a cover art data URL for a track */
export async function storeCoverArt(trackId: string, coverArtDataUrl: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_ART_STORE, 'readwrite');
    const store = tx.objectStore(COVER_ART_STORE);
    store.put({ id: trackId, coverArt: coverArtDataUrl, addedAt: Date.now() });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get cover art data URL for a track */
export async function getCoverArt(trackId: string): Promise<string | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_ART_STORE, 'readonly');
    const store = tx.objectStore(COVER_ART_STORE);
    const request = store.get(trackId);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.coverArt || null);
    };

    request.onerror = () => reject(request.error);
  });
}

/** Batch store cover art for multiple tracks */
export async function storeCoverArtBatch(entries: Array<{ trackId: string; coverArt: string }>): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_ART_STORE, 'readwrite');
    const store = tx.objectStore(COVER_ART_STORE);

    for (const entry of entries) {
      store.put({ id: entry.trackId, coverArt: entry.coverArt, addedAt: Date.now() });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete cover art for a track */
export async function deleteCoverArt(trackId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_ART_STORE, 'readwrite');
    tx.objectStore(COVER_ART_STORE).delete(trackId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Clear all cover art */
export async function clearAllCoverArt(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_ART_STORE, 'readwrite');
    tx.objectStore(COVER_ART_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Revoke the singleton dbInstance */
export function resetDBInstance(): void {
  dbInstance = null;
}
