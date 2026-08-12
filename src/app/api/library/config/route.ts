// GET  /api/library/config — read library configuration
// POST /api/library/config — update library configuration
// Persists to <project-root>/.library-config.json

import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const CONFIG_PATH = join(process.cwd(), '.library-config.json');

interface LibraryConfig {
  directories: string[];
  lastScan: string | null;
  trackCount: number;
}

const DEFAULT_CONFIG: LibraryConfig = {
  directories: [],
  lastScan: null,
  trackCount: 0,
};

/** Read the config file, returning defaults if it doesn't exist or is corrupt. */
async function readConfig(): Promise<LibraryConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LibraryConfig>;
    return {
      directories: Array.isArray(parsed.directories) ? parsed.directories : [],
      lastScan: typeof parsed.lastScan === 'string' ? parsed.lastScan : null,
      trackCount: typeof parsed.trackCount === 'number' ? parsed.trackCount : 0,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** Write the config file atomically (best-effort). */
async function writeConfig(config: LibraryConfig): Promise<void> {
  try {
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error('[library/config] Failed to write config:', err);
    throw err;
  }
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /api/library/config
 * Returns the current library configuration.
 */
export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config);
}

/**
 * POST /api/library/config
 * Update library configuration. Accepts partial updates.
 * Body examples:
 *   { directories: ["/music", "/nas/music"] }   — replace the full directory list
 *   { lastScan: "2026-08-12T02:30:45Z" }       — update last scan timestamp
 *   { trackCount: 1234 }                        — update cached track count
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<LibraryConfig>;

    const current = await readConfig();
    const updated: LibraryConfig = {
      directories: Array.isArray(body.directories) ? body.directories : current.directories,
      lastScan: typeof body.lastScan === 'string' ? body.lastScan : current.lastScan,
      trackCount: typeof body.trackCount === 'number' ? body.trackCount : current.trackCount,
    };

    await writeConfig(updated);

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error) {
    console.error('[library/config] Failed to update config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update library configuration.' },
      { status: 500 },
    );
  }
}
