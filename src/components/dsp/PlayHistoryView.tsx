'use client';

import React, { useState, useMemo } from 'react';
import { useHistoryStore } from '@/store/history';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { useProfilesStore } from '@/store/profiles';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Play,
  Trash2,
  Music,
  TrendingUp,
  Calendar,
  BarChart3,
  User,
  MapPin,
  Radio,
  HardDrive,
  Globe,
  Filter,
  ArrowLeft,
  Check,
  Pause,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getDateLabel(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';

  const diffDays = Math.floor((todayStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSourceBadge(source: 'local' | 'tidal' | 'qobuz' | 'radio') {
  switch (source) {
    case 'local':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] gap-1">
          <HardDrive className="w-3 h-3" />
          Local
        </Badge>
      );
    case 'tidal':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] gap-1">
          <Globe className="w-3 h-3" />
          TIDAL
        </Badge>
      );
    case 'qobuz':
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] gap-1">
          <Globe className="w-3 h-3" />
          Qobuz
        </Badge>
      );
    case 'radio':
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] gap-1">
          <Radio className="w-3 h-3" />
          Radio
        </Badge>
      );
  }
}

function getZoneById(zoneId: string) {
  return undefined;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PlayHistoryView() {
  const { entries, clearHistory } = useHistoryStore();
  const { play } = usePlayerStore();
  const { navigate } = useUIStore();
  const { profiles, activeProfileId, switchProfile } = useProfilesStore();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter entries by selected profile
  const filteredEntries = useMemo(() => {
    if (!selectedProfileId) return entries;
    return entries.filter((e) => e.profileId === selectedProfileId);
  }, [entries, selectedProfileId]);

  // Group entries by date label
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: typeof filteredEntries }[] = [];
    let currentLabel = '';

    for (const entry of filteredEntries) {
      const label = getDateLabel(entry.playedAt);
      if (label !== currentLabel) {
        groups.push({ label, entries: [entry] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [filteredEntries]);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPlays = filteredEntries.length;
    let totalListeningTime = 0;
    const artistPlayCount: Record<string, number> = {};
    const genrePlayCount: Record<string, number> = {};

    for (const entry of filteredEntries) {
      const track = undefined as any;
      if (track) {
        totalListeningTime += entry.completed ? track.duration : track.duration / 2;
        artistPlayCount[track.artistName] = (artistPlayCount[track.artistName] || 0) + 1;
        genrePlayCount[track.genre] = (genrePlayCount[track.genre] || 0) + 1;
      }
    }

    const mostPlayedArtist =
      Object.entries(artistPlayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const mostPlayedGenre =
      Object.entries(genrePlayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return { totalPlays, totalListeningTime, mostPlayedArtist, mostPlayedGenre };
  }, [filteredEntries]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  const handleSelectProfile = (profileId: string | null) => {
    setSelectedProfileId(profileId);
  };

  const handleReplayTrack = (trackId: string) => {
    const track = undefined as any;
    if (track) play(track);
  };

  const handleNavigateToAlbum = (albumId: string) => {
    navigate('album-detail', { albumId });
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('home')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Play History
              </h1>
            </div>
            <Badge variant="secondary" className="ml-2">
              {filteredEntries.length} entries
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Clear all history?</span>
                <Button size="sm" variant="destructive" onClick={handleClearHistory}>
                  Yes, Clear
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowClearConfirm(true)}
                disabled={entries.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* ─── Empty State ──────────────────────────────────────────────── */}
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Music className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No play history</p>
            <p className="text-sm mt-1">
              {entries.length === 0
                ? 'Start playing music to build your history.'
                : 'No entries found for the selected profile.'}
            </p>
          </div>
        ) : (
          <>
            {/* ─── Stats Summary ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPlays}</p>
                      <p className="text-xs text-muted-foreground">Total Plays</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatDuration(Math.round(stats.totalListeningTime))}</p>
                      <p className="text-xs text-muted-foreground">Listening Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold truncate">{stats.mostPlayedArtist}</p>
                      <p className="text-xs text-muted-foreground">Most Played Artist</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold truncate">{stats.mostPlayedGenre}</p>
                      <p className="text-xs text-muted-foreground">Most Played Genre</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Profile Filter ───────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-1">Profile:</span>
              <div className="flex items-center gap-2">
                {/* All Profiles */}
                <button
                  onClick={() => handleSelectProfile(null)}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${
                      selectedProfileId === null
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-surface'
                        : 'bg-surface/50 hover:bg-surface'
                    }
                  `}
                  title="All Profiles"
                >
                  <User className="w-4 h-4" />
                </button>

                {profiles.map((profile) => {
                  const isActive = selectedProfileId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile.id)}
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${
                          isActive
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'hover:ring-1 hover:ring-muted-foreground/30'
                        }
                        ${profile.color}
                      `}
                      title={profile.name}
                    >
                      {profile.avatar}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* ─── History Timeline ──────────────────────────────────────── */}
            <div className="space-y-6">
              {groupedEntries.map((group) => (
                <div key={group.label}>
                  {/* Date Group Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h2>
                    <Badge variant="outline" className="text-[10px]">
                      {group.entries.length}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>

                  {/* Entries */}
                  <div className="space-y-1">
                    {group.entries.map((entry) => {
                      const track = undefined as any;
                      if (!track) return null;

                      const zone = getZoneById(entry.zoneId);
                      const profile = profiles.find((p) => p.id === entry.profileId);

                      return (
                        <div
                          key={entry.id}
                          className="group flex items-center gap-3 p-3 rounded-lg hover:bg-surface/50 transition-colors"
                        >
                          {/* Time */}
                          <span className="font-mono text-sm text-muted-foreground w-12 text-right flex-shrink-0">
                            {formatTime(entry.playedAt)}
                          </span>

                          {/* Cover Thumbnail */}
                          <button
                            onClick={() => handleNavigateToAlbum(track.albumId)}
                            className="w-10 h-10 rounded-md bg-gradient-to-br flex-shrink-0 cover-art-hover cursor-pointer"
                            style={{
                              backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                            }}
                          >
                            <div
                              className={`w-full h-full rounded-md bg-gradient-to-br ${getCoverGradient(track.albumId)}`}
                            />
                          </button>

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleNavigateToAlbum(track.albumId)}
                              className="text-sm font-medium truncate block hover:text-primary transition-colors text-left"
                            >
                              {track.title}
                            </button>
                            <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getSourceBadge(entry.source)}
                            {zone && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <MapPin className="w-3 h-3" />
                                {zone.name}
                              </Badge>
                            )}
                          </div>

                          {/* Profile Avatar */}
                          {profile && (
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${profile.color}`}
                              title={profile.name}
                            >
                              {profile.avatar}
                            </div>
                          )}

                          {/* Completion Indicator */}
                          <div className="flex-shrink-0">
                            {entry.completed ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Pause className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Play Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={() => handleReplayTrack(entry.trackId)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
