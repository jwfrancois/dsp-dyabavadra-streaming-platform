'use client';

import React, { useEffect, useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePodcastStore } from '@/store/podcast';
import { usePlayerStore } from '@/store/player';
import {
  formatEpisodeDuration, formatDate, formatFileSize,
} from '@/lib/podcast-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Play, Pause, Download, Circle, CircleCheck, Heart,
  Wifi, WifiOff, Rss, Clock, MoreHorizontal, Bell, BellOff,
  ExternalLink, Share2, Trash2, Scissors, Moon, Archive,
  RefreshCw, HardDrive, Info, Podcast,
} from 'lucide-react';
import { getCoverGradient, formatDuration } from '@/lib/data';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PodcastDetailView() {
  const { viewParams, navigate } = useUIStore();
  const {
    episodeStates, subscribedShowIds, toggleSubscribe,
    playEpisode, markEpisodePlayed, markEpisodeUnplayed,
    toggleEpisodeFavorite, toggleEpisodeDownload, markAllPlayed,
    playbackSpeed, cyclePlaybackSpeed, skipSilence, toggleSkipSilence,
    sleepTimerMinutes, setSleepTimer,
    currentEpisode, isPodcastMode,
  } = usePodcastStore();

  const showId = viewParams.showId;
  const discoveredShows = usePodcastStore(s => s.discoveredShows);
  const discoveredEpisodes = usePodcastStore(s => s.discoveredEpisodes);
  const feedLoading = usePodcastStore(s => s.feedLoading);
  const feedError = usePodcastStore(s => s.feedError);
  const fetchDiscoveredEpisodes = usePodcastStore(s => s.fetchDiscoveredEpisodes);

  const show = discoveredShows[showId] || null;
  const isDiscovered = !!discoveredShows[showId];

  // Auto-fetch episodes for discovered podcasts
  useEffect(() => {
    if (isDiscovered && show?.feedUrl) {
      fetchDiscoveredEpisodes(showId, show.feedUrl);
    }
  }, [isDiscovered, showId, show?.feedUrl, fetchDiscoveredEpisodes]);

  // Get episodes: local or discovered
  const episodes = useMemo(() => {
    if (isDiscovered) {
      return (discoveredEpisodes[showId] || []).sort(
        (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );
    }
    return [];
  }, [isDiscovered, showId, discoveredEpisodes]);

  const unplayed = useMemo(() => {
    return episodes.filter(ep => {
      const st = episodeStates[ep.id];
      return st && !st.isPlayed && !st.completed;
    });
  }, [episodes, episodeStates]);

  // Local state for show settings
  const [autoDownload, setAutoDownload] = React.useState(show?.autoDownload ?? false);
  const [autoArchive, setAutoArchive] = React.useState(false);
  const [keepEpisodes, setKeepEpisodes] = React.useState(0);
  const [expandedEpisodes, setExpandedEpisodes] = React.useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = React.useState(false);

  const toggleExpanded = (epId: string) => {
    setExpandedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(epId)) next.delete(epId);
      else next.add(epId);
      return next;
    });
  };

  if (!show) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Podcast not found</div>;
  }

  const isSubscribed = subscribedShowIds.includes(show.id);

  // Show-level stats
  const totalDuration = episodes.reduce((s, e) => s + e.duration, 0);
  const downloadedCount = episodes.filter(e => episodeStates[e.id]?.isDownloaded).length;
  const totalFileSize = episodes.reduce((s, e) => s + e.fileSize, 0);
  const completedCount = episodes.filter(e => episodeStates[e.id]?.completed).length;

  // Feed loading / error state for discovered podcasts
  if (isDiscovered && feedLoading && episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading episodes from feed...</p>
      </div>
    );
  }
  if (isDiscovered && feedError && episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-destructive">Failed to load episodes: {feedError}</p>
        <p className="text-xs text-muted-foreground">The podcast feed may be unavailable or invalid.</p>
        <Button variant="outline" size="sm" onClick={() => show?.feedUrl && fetchDiscoveredEpisodes(showId, show.feedUrl)}>
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('podcasts')}>
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Podcasts
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('podcasts')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Podcasts
        </Button>

        {/* Show Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className={`w-40 h-40 md:w-48 md:h-48 rounded-xl shadow-2xl flex-shrink-0 relative overflow-hidden ${show.artworkUrl && show.artworkUrl.startsWith('http') ? '' : `bg-gradient-to-br ${getCoverGradient(show.id)}`}`}>
            {show.artworkUrl && show.artworkUrl.startsWith('http') ? (
              <img src={show.artworkUrl} alt={show.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">{show.genre}</Badge>
              {show.category && show.category !== show.genre && (
                <Badge variant="outline" className="text-[10px]">{show.category}</Badge>
              )}
              {show.rating && (
                <Badge variant="outline" className="text-[10px]">{show.rating === 'explicit' ? 'Explicit' : 'Clean'}</Badge>
              )}
              {isDiscovered && (
                <Badge variant="outline" className="text-[10px]">{episodes.length} loaded</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-1">{show.title}</h1>
            <p className="text-lg text-muted-foreground">{show.author}</p>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span>{show.episodeCount} episodes</span>
              <span>·</span>
              <span>{formatEpisodeDuration(totalDuration)} total</span>
              {downloadedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{downloadedCount} downloaded</span>
                </>
              )}
              {completedCount > 0 && (
                <>
                  <span>·</span>
                  <span>{completedCount} completed</span>
                </>
              )}
            </div>

            {show.feedUrl && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Rss className="w-3 h-3" />
                <span className="text-xs font-mono truncate max-w-md">{show.feedUrl}</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{show.description}</p>

            <div className="flex gap-3 mt-5 flex-wrap">
              {isSubscribed ? (
                <Button variant="secondary" onClick={() => toggleSubscribe(show.id)}>
                  <BellOff className="w-4 h-4 mr-2" /> Unsubscribe
                </Button>
              ) : (
                <Button onClick={() => toggleSubscribe(show.id)}>
                  <Bell className="w-4 h-4 mr-2" /> Subscribe
                </Button>
              )}
              <Button variant="outline" onClick={() => markAllPlayed(show.id)}>
                <CircleCheck className="w-4 h-4 mr-2" /> Mark All Played
              </Button>
              <Button variant="outline" size="icon" title="Share">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                title="Show Settings"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>

            {/* Feed & Archive Settings */}
            {isSubscribed && (
              <div className="mt-4 space-y-2">
                {/* Auto-Download */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50">
                  <div className="flex-1">
                    <p className="text-xs font-medium">Auto-Download New Episodes</p>
                    <p className="text-[11px] text-muted-foreground">Automatically download new episodes when available</p>
                  </div>
                  <Switch
                    checked={autoDownload}
                    onCheckedChange={setAutoDownload}
                  />
                </div>

                {/* Auto-Archive */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50">
                  <div className="flex-1">
                    <p className="text-xs font-medium">Auto-Archive After Playing</p>
                    <p className="text-[11px] text-muted-foreground">Mark episodes as archived after they are completed</p>
                  </div>
                  <Switch
                    checked={autoArchive}
                    onCheckedChange={setAutoArchive}
                  />
                </div>

                {/* Keep Episodes */}
                {autoArchive && (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50">
                    <div className="flex-1">
                      <p className="text-xs font-medium">Keep Recent Episodes</p>
                      <p className="text-[11px] text-muted-foreground">How many played episodes to keep before auto-archiving</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[5, 10, 20, 50].map(n => (
                        <Button
                          key={n}
                          variant={keepEpisodes === n ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setKeepEpisodes(n)}
                        >
                          {n}
                        </Button>
                      ))}
                      <Button
                        variant={keepEpisodes === 0 ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setKeepEpisodes(0)}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Feed Check */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50">
                  <div className="flex-1">
                    <p className="text-xs font-medium">Feed Check Interval</p>
                    <p className="text-[11px] text-muted-foreground">Last checked: {formatDate(show.lastChecked)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" /> Check Now
                  </Button>
                </div>

                {/* Storage summary */}
                {totalFileSize > 0 && (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-surface/50">
                    <div className="flex-1">
                      <p className="text-xs font-medium">Downloaded Storage</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatFileSize(totalFileSize)} total for {downloadedCount} episode{downloadedCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Episode List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Episodes ({episodes.length})</h2>
            {isDiscovered && feedLoading && episodes.length > 0 && (
              <Badge variant="outline" className="text-xs"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Loading more...</Badge>
            )}
            {unplayed.length > 0 && (
              <Badge variant="outline" className="text-xs text-signal-red border-signal-red/30">
                {unplayed.length} unplayed
              </Badge>
            )}
          </div>

          {episodes.length === 0 && !feedLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Podcast className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No episodes available</p>
              <p className="text-xs mt-1">{feedError || 'The feed may not have any episodes yet.'}</p>
              {isDiscovered && show?.feedUrl && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchDiscoveredEpisodes(showId, show.feedUrl)}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry Feed
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1">
            {episodes.map(ep => {
              const state = episodeStates[ep.id];
              const isUnplayed = state && !state.isPlayed && !state.completed;
              const isCompleted = state?.completed;
              const isInProgress = state && !state.completed && state.resumePosition > 0;
              const progress = isInProgress ? (state.resumePosition / ep.duration) * 100 : 0;
              const isExpanded = expandedEpisodes.has(ep.id);
              const isCurrentlyPlaying = isPodcastMode && currentEpisode?.id === ep.id;

              return (
                <div key={ep.id} className={`rounded-lg border transition-colors ${isCurrentlyPlaying ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-accent/20'}`}>
                  {/* Main episode row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Status/Play indicator */}
                    <div className="flex-shrink-0">
                      {isUnplayed ? (
                        <Circle className="w-4 h-4 fill-signal-red text-signal-red" />
                      ) : isCompleted ? (
                        <CircleCheck className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" style={{
                          background: `conic-gradient(hsl(var(--primary)) ${progress}%, transparent ${progress}%)`,
                        }} />
                      )}
                    </div>

                    {/* Play button */}
                    <Button
                      variant={isCurrentlyPlaying ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => playEpisode(ep)}
                    >
                      {isCurrentlyPlaying && isPodcastMode ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>

                    {/* Episode info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpanded(ep.id)}>
                      <p className={`text-sm font-medium truncate ${isUnplayed ? '' : 'text-muted-foreground'}`}>
                        {ep.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">{formatDate(ep.publishDate)}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{formatEpisodeDuration(ep.duration)}</span>
                        {ep.fileSize > 0 && (
                          <>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{formatFileSize(ep.fileSize)}</span>
                          </>
                        )}
                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{ep.format} {ep.bitrate}kbps</Badge>
                        {state?.isDownloaded && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0"><WifiOff className="w-2 h-2 mr-0.5" />Local</Badge>
                        )}
                        {!state?.isDownloaded && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0"><Wifi className="w-2 h-2 mr-0.5" />Stream</Badge>
                        )}
                        {ep.season && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">S{ep.season}:E{ep.episodeNumber}</Badge>
                        )}
                        {state?.favorite && (
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Quick download toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleEpisodeDownload(ep.id)}
                        title={state?.isDownloaded ? 'Remove Download' : 'Download'}
                      >
                        {state?.isDownloaded ? (
                          <HardDrive className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => playEpisode(ep)}>
                            <Play className="w-4 h-4 mr-2" /> Play
                          </DropdownMenuItem>
                          {isInProgress && (
                            <DropdownMenuItem onClick={() => playEpisode(ep)}>
                              <Clock className="w-4 h-4 mr-2" /> Resume ({formatEpisodeDuration(state?.resumePosition || 0)})
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isCompleted ? (
                            <DropdownMenuItem onClick={() => markEpisodeUnplayed(ep.id)}>
                              <Circle className="w-4 h-4 mr-2" /> Mark Unplayed
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => markEpisodePlayed(ep.id)}>
                              <CircleCheck className="w-4 h-4 mr-2" /> Mark Played
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toggleEpisodeFavorite(ep.id)}>
                            <Heart className={`w-4 h-4 mr-2 ${state?.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                            {state?.favorite ? 'Unfavorite' : 'Favorite'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleEpisodeDownload(ep.id)}>
                            {state?.isDownloaded ? (
                              <><Trash2 className="w-4 h-4 mr-2" /> Remove Download</>
                            ) : (
                              <><Download className="w-4 h-4 mr-2" /> Download</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* In-progress bar */}
                  {isInProgress && (
                    <div className="px-3 pb-2 pt-0">
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formatEpisodeDuration(state?.resumePosition || 0)} listened
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatEpisodeDuration(ep.duration)} total · {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description (expandable) */}
                  <div className="px-3 pb-3 pt-0">
                    <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>{ep.description}</p>
                    {ep.showNotes && (
                      <details open={isExpanded} className="mt-1">
                        <summary className="text-[11px] text-primary cursor-pointer hover:underline select-none">
                          {isExpanded ? 'Hide' : 'Show'} notes & links
                        </summary>
                        <div className="mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap bg-surface/30 rounded p-2 border border-border/50">
                          {ep.showNotes}
                        </div>
                      </details>
                    )}
                    {!ep.showNotes && !isExpanded && ep.description.length > 120 && (
                      <button
                        className="text-[11px] text-primary cursor-pointer hover:underline mt-0.5"
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(ep.id); }}
                      >
                        Show more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
