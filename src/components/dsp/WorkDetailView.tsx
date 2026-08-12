'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import {
  tracks,
  getCoverGradient,
  formatDuration,
  getAlbumById,
} from '@/lib/data';
import {
  getWorkById,
  type WorkRecording,
} from '@/lib/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Disc3,
  Star,
  Clock,
  Music,
  User,
  Globe,
  Calendar,
} from 'lucide-react';

export function WorkDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const workId = viewParams.workId;
  const work = getWorkById(workId);

  if (!work) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Work not found
      </div>
    );
  }

  const sortedRecordings = [...work.recordings].sort((a, b) => b.rating - a.rating);

  const handlePlayRecording = (recording: WorkRecording) => {
    // Find tracks in the library that belong to this recording's album
    const albumTracks = tracks
      .filter(t => t.albumId === recording.albumId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground"
          onClick={() => navigate('composer-detail', { composerId: work.composerId })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {work.composerName.split(' ').pop()}
        </Button>

        {/* Work Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div
            className={`w-44 h-56 rounded-xl bg-gradient-to-br ${getCoverGradient(work.id)} shadow-2xl flex-shrink-0 flex items-center justify-center`}
          >
            <BookOpen className="w-16 h-16 text-white/25" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{work.title}</h1>
            <p className="text-base text-muted-foreground mb-3">{work.titleFull}</p>
            <button
              className="text-sm text-primary hover:underline mb-3 inline-block"
              onClick={() => navigate('composer-detail', { composerId: work.composerId })}
            >
              {work.composerName}
            </button>
            <div className="flex flex-wrap gap-2 mb-4">
              {work.catalogNumber && (
                <Badge variant="secondary">{work.catalogNumber}</Badge>
              )}
              <Badge variant="outline">{work.genre}</Badge>
              {work.key && (
                <Badge variant="outline" className="gap-1">
                  <Music className="w-3 h-3" />
                  {work.key}
                </Badge>
              )}
              {work.yearComposed && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {work.yearComposed}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(work.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Disc3 className="w-4 h-4" />
                {work.recordings.length} recording{work.recordings.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                {work.movements.length} movement{work.movements.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {work.description && (
          <>
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {work.description}
              </p>
            </section>
            <Separator className="mb-8" />
          </>
        )}

        {/* Movements Table */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5" />
            Movements
            <Badge variant="secondary" className="text-xs">
              {work.movements.length}
            </Badge>
          </h2>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Tempo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Key</th>
                    <th className="text-right p-3 font-medium text-muted-foreground w-20">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {work.movements.map((movement) => (
                    <tr
                      key={movement.number}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors"
                    >
                      <td className="p-3 text-muted-foreground">
                        {movement.number}
                      </td>
                      <td className="p-3 font-medium">{movement.title}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {movement.tempoMarking}
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {movement.key || '—'}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {formatDuration(movement.duration)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <td className="p-3" />
                    <td className="p-3">Total</td>
                    <td className="p-3 hidden sm:table-cell" />
                    <td className="p-3 hidden md:table-cell" />
                    <td className="p-3 text-right">{formatDuration(work.duration)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Recordings Section */}
        {sortedRecordings.length > 0 && (
          <>
            <Separator className="mb-8" />
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Disc3 className="w-5 h-5" />
                Recordings
                <Badge variant="secondary" className="text-xs">
                  {sortedRecordings.length}
                </Badge>
              </h2>

              <div className="space-y-3">
                {sortedRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    onPlay={() => handlePlayRecording(recording)}
                    onAlbumClick={() => navigate('album-detail', { albumId: recording.albumId })}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Recording Card ───

function RecordingCard({
  recording,
  onPlay,
  onAlbumClick,
}: {
  recording: WorkRecording;
  onPlay: () => void;
  onAlbumClick: () => void;
}) {
  const album = getAlbumById(recording.albumId);
  const hasLocalAlbum = !!album;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Album Cover Placeholder */}
          <button
            className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getCoverGradient(recording.albumId)} flex-shrink-0 flex items-center justify-center group/cover shadow-md`}
            onClick={onAlbumClick}
          >
            <Disc3 className="w-7 h-7 text-white/30 group-hover/cover:text-white/50 transition-colors" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Performer Names / Orchestra */}
            <h3 className="font-semibold text-sm mb-1">
              {recording.performerNames.filter(Boolean).join(', ') ||
                recording.orchestra ||
                'Unknown Performers'}
            </h3>

            {/* Conductor & Orchestra */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mb-2">
              {recording.conductor && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  cond. {recording.conductor}
                </span>
              )}
              {recording.orchestra && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {recording.orchestra}
                </span>
              )}
            </div>

            {/* Album Name */}
            {hasLocalAlbum ? (
              <button
                className="text-xs text-primary hover:underline truncate block max-w-md"
                onClick={onAlbumClick}
              >
                <Disc3 className="w-3 h-3 inline mr-1" />
                {recording.albumName}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground truncate max-w-md">
                <Disc3 className="w-3 h-3 inline mr-1" />
                {recording.albumName}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                {recording.year}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {recording.format} {recording.sampleRate >= 1000 ? `${recording.sampleRate / 1000}kHz` : `${recording.sampleRate}Hz`}/{recording.bitDepth}bit
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {recording.label}
              </Badge>
              {/* Star Rating */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < Math.round(recording.rating / 2);
                  return (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  );
                })}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {recording.rating}/10
                </span>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 flex-shrink-0 mt-1"
            onClick={onPlay}
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
