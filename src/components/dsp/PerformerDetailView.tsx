'use client';

import React, { useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, formatSampleRate, getCoverGradient, type Track, type Credit, type Album } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Play, Clock, Disc3, Users, Music2, Search,
  User, Heart,
} from 'lucide-react';

interface PerformerCredit {
  track: Track;
  roles: string[];
  instruments: string[];
  isComposer: boolean;
}

export function PerformerDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const performerName = viewParams.performerName;

  const credits = useMemo(() => {
    if (!performerName) return [];

    // Mock tracks removed — performer search is no longer available
    const results: PerformerCredit[] = [];

    return results;
  }, [performerName]);

  const uniqueAlbums = useMemo(() => {
    // Mock albums removed — performer albums no longer available
    return [] as Album[];
  }, [credits]);

  const collaborators = useMemo(() => {
    const collabMap = new Map<string, { name: string; trackCount: number; roles: string[] }>();

    for (const credit of credits) {
      const otherPerformers = credit.track.performers.filter(
        (p) => p.name.toLowerCase() !== performerName?.toLowerCase()
      );
      const otherComposers = credit.track.composers.filter(
        (c) => c.toLowerCase() !== performerName?.toLowerCase()
      );

      for (const p of otherPerformers) {
        const existing = collabMap.get(p.name);
        if (existing) {
          existing.trackCount++;
          if (!existing.roles.includes(p.role)) existing.roles.push(p.role);
        } else {
          collabMap.set(p.name, {
            name: p.name,
            trackCount: 1,
            roles: [p.role],
          });
        }
      }

      for (const c of otherComposers) {
        const existing = collabMap.get(c);
        if (existing) {
          if (!existing.roles.includes('composer')) existing.roles.push('composer');
        } else {
          collabMap.set(c, {
            name: c,
            trackCount: 1,
            roles: ['composer'],
          });
        }
      }
    }

    return Array.from(collabMap.values()).sort((a, b) => b.trackCount - a.trackCount);
  }, [credits, performerName]);

  const stats = useMemo(() => {
    const roleCounts = new Map<string, number>();
    for (const credit of credits) {
      if (credit.isComposer) {
        roleCounts.set('composer', (roleCounts.get('composer') || 0) + 1);
      }
      for (const role of credit.roles) {
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
      }
    }

    let mostCommonRole = '';
    let maxCount = 0;
    for (const [role, count] of roleCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRole = role;
      }
    }

    const allRoles = [...new Set([...Array.from(roleCounts.keys())])];
    const totalTime = credits.reduce((sum, c) => sum + c.track.duration, 0);

    return {
      totalTracks: credits.length,
      uniqueAlbumsCount: uniqueAlbums.length,
      collaboratorCount: collaborators.length,
      mostCommonRole,
      allRoles,
      totalTime,
    };
  }, [credits, uniqueAlbums.length, collaborators.length]);

  const handlePlayTrack = (track: Track) => {
    play(track);
  };

  const handlePlayAll = () => {
    const allTracks = credits.map((c) => c.track);
    if (allTracks.length > 0) setQueue(allTracks, 0);
  };

  if (!performerName) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Performer not found
      </div>
    );
  }

  if (credits.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="max-w-5xl mx-auto p-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground"
            onClick={() => navigate('search')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">No credits found</h1>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              No credits were found for &ldquo;{performerName}&rdquo; in the library.
            </p>
            <Button variant="outline" onClick={() => navigate('search')}>
              <Search className="w-4 h-4 mr-2" /> Try Search
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  const gradientClass = getCoverGradient(performerName);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground"
          onClick={() => navigate('search')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div
            className={`w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br ${gradientClass} shadow-2xl flex-shrink-0 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-20 h-20 text-white/20" />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{performerName}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.allRoles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  {role}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-5">
              <span className="flex items-center gap-1.5">
                <Music2 className="w-4 h-4" />
                {stats.totalTracks} credit{stats.totalTracks !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(stats.totalTime)} total
              </span>
            </div>
            <Button onClick={handlePlayAll}>
              <Play className="w-4 h-4 mr-2" /> Play All Credits
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: 'Tracks Credited',
              value: stats.totalTracks.toString(),
              icon: Music2,
            },
            {
              label: 'Albums',
              value: stats.uniqueAlbumsCount.toString(),
              icon: Disc3,
            },
            {
              label: 'Collaborators',
              value: stats.collaboratorCount.toString(),
              icon: Users,
            },
            {
              label: 'Primary Role',
              value: stats.mostCommonRole
                ? stats.mostCommonRole.charAt(0).toUpperCase() + stats.mostCommonRole.slice(1)
                : '—',
              icon: User,
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg font-bold tabular-nums truncate">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="mb-8" />

        {/* Credits Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Credits</h2>
          <div className="space-y-0.5">
            {credits.map((credit) => {
              const isCurrentTrack = currentTrack?.id === credit.track.id;
              const roleLabel = [
                ...credit.roles,
                ...(credit.isComposer && !credit.roles.includes('composer')
                  ? ['composer']
                  : []),
              ].join(', ');
              const instrumentLabel = credit.instruments.join(', ');

              return (
                <div
                  key={credit.track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                    isCurrentTrack
                      ? 'bg-accent/50'
                      : 'hover:bg-accent/30'
                  }`}
                  onClick={() => handlePlayTrack(credit.track)}
                >
                  <span className="text-sm text-muted-foreground w-8 text-center flex-shrink-0">
                    <span className="group-hover:hidden">
                      {isCurrentTrack && isPlaying ? (
                        <span className="inline-flex gap-[2px] items-end h-3.5">
                          <span className="w-[3px] bg-primary rounded-full animate-pulse" style={{ height: '60%' }} />
                          <span className="w-[3px] bg-primary rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.15s' }} />
                          <span className="w-[3px] bg-primary rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.3s' }} />
                        </span>
                      ) : (
                        <Play className="w-3 h-3 text-primary ml-auto" />
                      )}
                    </span>
                    <Play className="w-3.5 h-3.5 text-primary hidden group-hover:block mx-auto" />
                  </span>
                  <div
                    className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(credit.track.id)} flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isCurrentTrack ? 'text-primary' : ''
                      }`}
                    >
                      {credit.track.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground truncate">
                        {credit.track.albumName}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {roleLabel}
                      </span>
                      {instrumentLabel && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {instrumentLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono hidden sm:inline-flex"
                    >
                      {credit.track.format} {formatSampleRate(credit.track.sampleRate)}/{credit.track.bitDepth}bit
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                      {formatDuration(credit.track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Appears On Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Appears On</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uniqueAlbums.map((album) => (
              <div
                key={album.id}
                className="group cursor-pointer"
                onClick={() =>
                  navigate('album-detail', { albumId: album.id })
                }
              >
                <div className="relative mb-2">
                  <div
                    className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover shadow-lg`}
                  />
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {album.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {album.artistName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {album.year} · {album.genre}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Also Performed With Section */}
        {collaborators.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Also Performed With
            </h2>
            <div className="max-h-96 overflow-y-auto space-y-1 custom-scrollbar">
              {collaborators.map((collab) => (
                <div
                  key={collab.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() =>
                    navigate('performer-detail', {
                      performerName: collab.name,
                    })
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${getCoverGradient(collab.name)} flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {collab.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {collab.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="text-[10px] capitalize"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                    {collab.trackCount} track{collab.trackCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
