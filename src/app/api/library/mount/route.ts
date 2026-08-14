// POST /api/library/mount — mount an SMB/CIFS network share
// GET  /api/library/mount — list currently mounted network shares
// DELETE /api/library/mount — unmount a network share
//
// Handles Windows-style UNC paths (\\SERVER\share\path) and converts them
// to Linux mount points under /tmp/dsp-mounts/.

import { NextRequest, NextResponse } from 'next/server';
import { execSync, exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// ── Types ──

interface NetworkShare {
  id: string;
  uncPath: string;        // Original UNC path: \\10.0.0.80\iguey\Media\Music
  server: string;         // 10.0.0.80
  shareName: string;      // iguey
  subPath: string;        // Media/Music
  mountPoint: string;     // /tmp/dsp-mounts/iguey-Media-Music
  username: string;
  mounted: boolean;
  mountedAt: string | null;
  error: string | null;
}

interface MountState {
  shares: NetworkShare[];
}

// ── Config ──

const MOUNT_BASE = '/tmp/dsp-mounts';
const STATE_FILE = join(process.cwd(), '.network-shares.json');

function loadState(): MountState {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw) as MountState;
    }
  } catch { /* ignore */ }
  return { shares: [] };
}

function saveState(state: MountState) {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error('[library/mount] Failed to save state:', err);
  }
}

/** Create a deterministic ID from UNC path */
function shareId(uncPath: string): string {
  return uncPath.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60);
}

/**
 * Parse a Windows UNC path or SMB URL into components.
 * Accepts:
 *   \\SERVER\share\path
 *   //SERVER/share/path
 *   smb://SERVER/share/path
 *   smb://user:pass@SERVER/share/path
 */
function parseUNCPath(input: string): { server: string; shareName: string; subPath: string; username: string; password: string } | null {
  let server = '';
  let shareName = '';
  let subPath = '';
  let username = '';
  let password = '';

  // Normalize backslashes to forward slashes
  let normalized = input.replace(/\\/g, '/');

  // Strip smb:// prefix if present
  if (normalized.startsWith('smb://')) {
    normalized = normalized.slice(6);
    // Check for credentials: user:pass@server
    const credMatch = normalized.match(/^([^:]+):([^@]+)@(.+)$/);
    if (credMatch) {
      username = credMatch[1];
      password = credMatch[2];
      normalized = credMatch[3];
    }
  }

  // Strip leading //
  normalized = normalized.replace(/^\/+/, '');

  const parts = normalized.split('/');
  if (parts.length < 2) return null;

  server = parts[0];
  shareName = parts[1];
  subPath = parts.slice(2).join('/');

  return { server, shareName, subPath, username, password };
}

/**
 * Check if a path is already mounted using the OS mount table.
 */
function isMountActive(mountPoint: string): boolean {
  try {
    const mounts = readFileSync('/proc/mounts', 'utf-8');
    return mounts.split('\n').some(line => {
      const fields = line.split(/\s+/);
      return fields[1] === mountPoint;
    });
  } catch {
    // /proc/mounts not available (non-Linux) — check if mount point exists and is accessible
    return existsSync(mountPoint) && existsSync(join(mountPoint, '.'));
  }
}

/**
 * Attempt to mount a CIFS share.
 * Returns { success, mountPoint, error? }
 */
function mountCIFS(
  server: string,
  shareName: string,
  mountPoint: string,
  username: string,
  password: string,
): { success: boolean; error?: string } {
  // Create mount point
  if (!existsSync(mountPoint)) {
    try {
      mkdirSync(mountPoint, { recursive: true });
    } catch (err) {
      return { success: false, error: `Cannot create mount point ${mountPoint}: ${err}` };
    }
  }

  // Build mount options
  const opts: string[] = [
    'rw',
    'noexec',
    'nosuid',
    'nodev',
    '_netdev',
    'iocharset=utf8',
    'file_mode=0644',
    'dir_mode=0755',
  ];

  if (username && username !== 'guest') {
    opts.push(`username=${username}`);
    if (password) opts.push(`password=${password}`);
  } else {
    opts.push('guest');
  }

  // Check if cifs-utils is available
  const cifsType = existsSync('/sbin/mount.cifs') ? 'cifs' : 'cifs';

  const mountCmd = `mount -t ${cifsType} "//${server}/${shareName}" "${mountPoint}" -o ${opts.join(',')}`;

  try {
    execSync(mountCmd, { timeout: 15_000, stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true };
  } catch (err: unknown) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() || '';
    const msg = (err as Error).message || String(err);

    // Provide user-friendly error messages
    if (stderr.includes('Permission denied') || msg.includes('Permission denied')) {
      return { success: false, error: 'Permission denied. The server process needs sudo/root privileges to mount CIFS shares. Try mounting manually:\n  sudo mount -t cifs "//' + server + '/' + shareName + '" "' + mountPoint + '" -o guest' };
    }
    if (stderr.includes('No such device') || stderr.includes('mount.cifs')) {
      return { success: false, error: 'cifs-utils not installed. Install it with:\n  sudo apt install cifs-utils\n  or: sudo yum install cifs-utils' };
    }
    if (stderr.includes('Network is unreachable') || stderr.includes('Connection refused')) {
      return { success: false, error: `Cannot reach server ${server}. Check that the server is online and the IP/hostname is correct.` };
    }
    if (stderr.includes('mount error') || stderr.includes('Access denied')) {
      return { success: false, error: `Access denied to share //${server}/${shareName}. Check credentials or try "guest" access.` };
    }

    return { success: false, error: `Mount failed: ${stderr || msg}` };
  }
}

/**
 * Unmount a CIFS share.
 */
function unmountCIFS(mountPoint: string): { success: boolean; error?: string } {
  try {
    execSync(`umount "${mountPoint}"`, { timeout: 10_000, stdio: ['pipe', 'pipe', 'pipe'] });
    // Remove mount point dir
    try { execSync(`rmdir "${mountPoint}"`, { timeout: 5000 }); } catch { /* ignore */ }
    return { success: true };
  } catch (err: unknown) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() || '';
    const msg = (err as Error).message || String(err);
    if (stderr.includes('not mounted') || stderr.includes('No such file')) {
      return { success: true }; // Already unmounted
    }
    if (stderr.includes('busy') || stderr.includes('target is busy')) {
      return { success: false, error: `Cannot unmount — share is in use. Stop any playing tracks first, then try again.\nForce unmount: sudo umount -l "${mountPoint}"` };
    }
    return { success: false, error: `Unmount failed: ${stderr || msg}` };
  }
}

// ── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /api/library/mount
 * Returns all configured network shares with their mount status.
 */
export async function GET() {
  const state = loadState();

  // Refresh mount status for each share
  for (const share of state.shares) {
    share.mounted = isMountActive(share.mountPoint);
  }
  saveState(state);

  return NextResponse.json({ success: true, shares: state.shares });
}

/**
 * POST /api/library/mount
 * Mount a network share. Body:
 *   { uncPath: string, username?: string, password?: string }
 *
 * Accepts: \\SERVER\share\path, //SERVER/share/path, smb://SERVER/share/path
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      uncPath?: string;
      username?: string;
      password?: string;
    };

    const { uncPath, username, password } = body;

    if (!uncPath || typeof uncPath !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing "uncPath" field. Provide a network path like \\\\10.0.0.80\\iguey\\Media\\Music' },
        { status: 400 },
      );
    }

    const parsed = parseUNCPath(uncPath);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: `Invalid network path: "${uncPath}". Expected format: \\\\SERVER\\share\\path or smb://SERVER/share/path` },
        { status: 400 },
      );
    }

    // Override username/password from body if provided
    const effectiveUsername = username || parsed.username || 'guest';
    const effectivePassword = password || parsed.password || '';

    const id = shareId(uncPath);
    const mountPoint = join(MOUNT_BASE, id);

    const state = loadState();

    // Check if already configured
    const existing = state.shares.find(s => s.id === id);
    if (existing) {
      // Already configured — try mounting
      existing.username = effectiveUsername;
      const result = mountCIFS(parsed.server, parsed.shareName, mountPoint, effectiveUsername, effectivePassword);
      if (result.success) {
        existing.mounted = true;
        existing.mountedAt = new Date().toISOString();
        existing.error = null;
      } else {
        existing.mounted = false;
        existing.error = result.error || null;
      }
      saveState(state);
      return NextResponse.json({
        success: result.success,
        share: existing,
        mountPoint,
        scanPath: join(mountPoint, parsed.subPath),
      });
    }

    // New share — mount and add to state
    const share: NetworkShare = {
      id,
      uncPath,
      server: parsed.server,
      shareName: parsed.shareName,
      subPath: parsed.subPath,
      mountPoint,
      username: effectiveUsername,
      mounted: false,
      mountedAt: null,
      error: null,
    };

    const result = mountCIFS(parsed.server, parsed.shareName, mountPoint, effectiveUsername, effectivePassword);
    if (result.success) {
      share.mounted = true;
      share.mountedAt = new Date().toISOString();
    } else {
      share.mounted = false;
      share.error = result.error || null;
    }

    state.shares.push(share);
    saveState(state);

    return NextResponse.json({
      success: result.success,
      share,
      mountPoint,
      scanPath: join(mountPoint, parsed.subPath),
    });
  } catch (error) {
    console.error('[library/mount] Mount error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during mount.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/library/mount?id=<share-id>
 * Unmount a network share and remove it from config.
 */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Missing "id" query parameter.' },
      { status: 400 },
    );
  }

  const state = loadState();
  const shareIndex = state.shares.findIndex(s => s.id === id);
  if (shareIndex === -1) {
    return NextResponse.json(
      { success: false, error: `Share "${id}" not found.` },
      { status: 404 },
    );
  }

  const share = state.shares[shareIndex];
  const unmountResult = unmountCIFS(share.mountPoint);

  if (unmountResult.success) {
    state.shares.splice(shareIndex, 1);
    saveState(state);
    return NextResponse.json({ success: true, message: `Unmounted and removed ${share.uncPath}` });
  } else {
    // Remove from config but report unmount error
    state.shares.splice(shareIndex, 1);
    saveState(state);
    return NextResponse.json({
      success: false,
      error: unmountResult.error,
      message: `Removed from config but unmount failed: ${unmountResult.error}`,
    });
  }
}
