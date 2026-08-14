'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { useDiscoveryStore } from '@/store/discovery';
import {
  getCoverGradient,
  formatDuration,
} from '@/lib/data';
import type {
  Composer,
  Work,
  WorkRecording,
} from '@/lib/metadata';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  Music,
  Users,
  Calendar,
  Star,
  Disc3,
  Clock,
} from 'lucide-react';

export function ComposerDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { browseBy, setBrowseBy } = useDiscoveryStore();
  const composerId = viewParams.composerId;
  const composer = undefined as any;

  if (!composer) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Composer not found
      </div>
    );
  }

  const composerWorks: any[] = [];
  const allRecordings = composerWorks.flatMap(w => w.recordings);
  const totalRecordings = allRecordings.length;
  const periods = [...new Set(composerWorks.map(w => w.genre))];
  const similarComposers: any[] = [];

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground"
          onClick={() => navigate('home')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Browse Mode Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <Tabs
            value={browseBy}
            onValueChange={(v) => setBrowseBy(v as typeof browseBy)}
          >
            <TabsList>
              <TabsTrigger value="composer-work" className="text-xs">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                By Composer / Work
              </TabsTrigger>
              <TabsTrigger value="artist-album" className="text-xs">
                <Disc3 className="w-3.5 h-3.5 mr-1.5" />
                By Artist / Album
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div
            className={`w-48 h-60 rounded-xl bg-gradient-to-br ${getCoverGradient(composer.id)} shadow-2xl flex-shrink-0 flex items-center justify-center`}
          >
            <Music className="w-16 h-16 text-white/30" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{composer.name}</h1>
            <p className="text-lg text-muted-foreground mb-3">{composer.nameFull}</p>
            <div className="flex flex-wrap gap-3 mb-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {composer.born}{composer.died ? ` — ${composer.died}` : ''}
              </span>
              <Badge variant="secondary">{composer.period}</Badge>
              <Badge variant="outline">{composer.nationality}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={BookOpen}
                label="Works"
                value={composerWorks.length.toString()}
              />
              <StatCard
                icon={Disc3}
                label="Recordings"
                value={totalRecordings.toString()}
              />
              <StatCard
                icon={Users}
                label="Genres"
                value={periods.length.toString()}
              />
            </div>
          </div>
        </div>

        {/* Biography */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Biography</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {composer.bio}
          </p>
        </section>

        <Separator className="mb-8" />

        {/* Works Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Works
            <Badge variant="secondary" className="text-xs">
              {composerWorks.length}
            </Badge>
          </h2>

          {composerWorks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No works in the catalog for this composer.</p>
          ) : (
            <div className="space-y-2">
              {composerWorks.map(work => (
                <WorkRow key={work.id} work={work} onClick={() => navigate('work-detail', { workId: work.id })} />
              ))}
            </div>
          )}
        </section>

        {/* Recordings Section (only in composer-work browse mode) */}
        {browseBy === 'composer-work' && allRecordings.length > 0 && (
          <>
            <Separator className="mb-8" />
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Disc3 className="w-5 h-5" />
                Recordings
                <Badge variant="secondary" className="text-xs">
                  {allRecordings.length}
                </Badge>
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allRecordings.map(rec => (
                  <RecordingRow key={rec.id} recording={rec} onAlbumClick={(albumId) => navigate('album-detail', { albumId })} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Similar Composers */}
        {similarComposers.length > 0 && (
          <>
            <Separator className="mb-8" />
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Similar Composers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {similarComposers.map(sim => (
                  <button
                    key={sim.id}
                    className="group text-left"
                    onClick={() => navigate('composer-detail', { composerId: sim.id })}
                  >
                    <div
                      className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${getCoverGradient(sim.id)} mb-2 flex items-center justify-center shadow-md`}
                    >
                      <Music className="w-10 h-10 text-white/25 group-hover:text-white/40 transition-colors" />
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {sim.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{sim.period}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Stat Card ───

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Work Row ───

function WorkRow({ work, onClick }: { work: Work; onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-accent/30 text-left group transition-colors"
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(work.id)} flex-shrink-0 flex items-center justify-center`}
      >
        <Music className="w-4 h-4 text-white/50" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {work.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {work.catalogNumber && (
            <span className="text-xs text-muted-foreground">{work.catalogNumber}</span>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {work.genre}
          </Badge>
          {work.key && (
            <span className="text-xs text-muted-foreground">{work.key}</span>
          )}
          {work.yearComposed && (
            <span className="text-xs text-muted-foreground">{work.yearComposed}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDuration(work.duration)}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Disc3 className="w-3 h-3" />
          {work.recordings.length}
        </div>
      </div>
    </button>
  );
}

// ─── Recording Row (used in Recordings section) ───

function RecordingRow({ recording, onAlbumClick }: { recording: WorkRecording; onAlbumClick: (albumId: string) => void }) {
  const album = undefined as any;
  const hasLocalAlbum = !!album;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors">
      <div
        className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(recording.albumId)} flex-shrink-0 flex items-center justify-center`}
      >
        <Disc3 className="w-4 h-4 text-white/50" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {recording.performerNames.filter(Boolean).join(', ') || recording.orchestra || 'Unknown'}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          {recording.conductor && <span>cond. {recording.conductor}</span>}
          {recording.orchestra && recording.conductor && recording.orchestra !== recording.performerNames[0] && (
            <span>{recording.orchestra}</span>
          )}
          {hasLocalAlbum ? (
            <button
              className="text-primary hover:underline truncate max-w-[200px]"
              onClick={(e) => {
                e.stopPropagation();
                onAlbumClick(recording.albumId);
              }}
            >
              {recording.albumName}
            </button>
          ) : (
            <span className="truncate max-w-[200px]">{recording.albumName}</span>
          )}
          <span>{recording.year}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {recording.format} {recording.sampleRate / 1000}kHz/{recording.bitDepth}bit
        </Badge>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < Math.round(recording.rating / 2);
            return (
              <Star
                key={i}
                className={`w-3 h-3 ${filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
