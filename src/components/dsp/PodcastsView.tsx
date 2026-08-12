'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePodcastStore } from '@/store/podcast';
import { usePlayerStore } from '@/store/player';
import {
  podcastShows, podcastEpisodes,
  getEpisodesByShow, getAllNewEpisodes,
  formatEpisodeDuration, formatDate,
} from '@/lib/podcast-data';
import type { PodcastEpisode, PodcastShow } from '@/lib/podcast-data';
import { getCoverGradient } from '@/lib/data';
import { audioSeekTo, audioSetPlaybackSpeed } from './AudioEngineProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Podcast, Play, Pause, Search, Plus, Check, Download,
  Clock, Radio, Rss, Heart, Trash2, TrendingUp, Star,
  Circle, Moon, Scissors, X,
} from 'lucide-react';

function handlePlayEpisode(episode: PodcastEpisode) {
  const podcastStore = usePodcastStore.getState();
  const epState = podcastStore.episodeStates[episode.id];
  const startPos = epState && !epState.completed ? (epState.resumePosition || 0) : 0;

  const url = episode.audioUrl.startsWith('http')
    ? `/api/proxy/podcast?url=${encodeURIComponent(episode.audioUrl)}`
    : episode.audioUrl;

  audioSetPlaybackSpeed(podcastStore.playbackSpeed);

  usePlayerStore.setState({
    audioUrl: url,
    isPlaying: true,
    playbackMode: 'podcast' as const,
    isBuffering: true,
  });

  podcastStore.playEpisode(episode);

  if (startPos > 0 && episode.duration > 0) {
    const seekPercent = (startPos / episode.duration) * 100;
    setTimeout(() => {
      audioSeekTo(seekPercent);
    }, 300);
  }
}

function SpeedBadge() {
  const { playbackSpeed, cyclePlaybackSpeed } = usePodcastStore();

  const handleClick = () => {
    cyclePlaybackSpeed();
    setTimeout(() => {
      const newSpeed = usePodcastStore.getState().playbackSpeed;
      audioSetPlaybackSpeed(newSpeed);
    }, 0);
  };

  return (
    <Button
      variant={playbackSpeed === 1.0 ? 'secondary' : 'default'}
      size="sm"
      className="h-7 text-xs font-mono min-w-[48px] justify-center"
      onClick={handleClick}
    >
      {playbackSpeed}x
    </Button>
  );
}

function UnsubscribeConfirm({
  show,
  onConfirm,
  onCancel,
}: {
  show: PodcastShow;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="bg-card border-border w-80">
        <CardContent className="p-5 space-y-4">
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getCoverGradient(show.id)} mx-auto`} />
          <div className="text-center">
            <p className="text-sm font-semibold">{'Unsubscribe from '}{show.title}{'?'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This will remove the podcast from your subscriptions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={onConfirm}>Unsubscribe</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PodcastsView() {
  const { navigate } = useUIStore();
  const {
    episodeStates, subscribedShowIds, toggleSubscribe,
    markAllPlayed,
    playbackSpeed, cyclePlaybackSpeed, skipSilence, toggleSkipSilence,
    sleepTimerMinutes, setSleepTimer, toggleEpisodeDownload,
    toggleEpisodeFavorite, currentEpisode, isPodcastMode,
  } = usePodcastStore();
  const { isPlaying, playbackMode } = usePlayerStore();

  const [activeTab, setActiveTab] = React.useState('subscriptions');
  const [discoverSearch, setDiscoverSearch] = React.useState('');
  const [discoverGenre, setDiscoverGenre] = React.useState('all');
  const [allEpisodesFilter, setAllEpisodesFilter] = React.useState('all');
  const [showSleepTimer, setShowSleepTimer] = React.useState(false);
  const [unsubscribeTarget, setUnsubscribeTarget] = React.useState<PodcastShow | null>(null);
  const [expandedShowId, setExpandedShowId] = React.useState<string | null>(null);

  const subscribedShows = podcastShows.filter(s => subscribedShowIds.includes(s.id));
  const newEpisodes = getAllNewEpisodes();

  const allSubscribedEpisodes = React.useMemo(() => {
    return podcastEpisodes
      .filter(ep => subscribedShowIds.includes(ep.showId))
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }, [subscribedShowIds]);

  const filteredAllEpisodes = React.useMemo(() => {
    return allSubscribedEpisodes.filter(ep => {
      const st = episodeStates[ep.id];
      if (!st) return allEpisodesFilter === 'all';
      switch (allEpisodesFilter) {
        case 'unplayed': return !st.isPlayed && !st.completed;
        case 'in-progress': return !st.completed && st.resumePosition > 0;
        case 'favorites': return st.favorite;
        case 'downloaded': return st.isDownloaded;
        default: return true;
      }
    });
  }, [allSubscribedEpisodes, episodeStates, allEpisodesFilter]);

  const downloadedEpisodes = React.useMemo(() => {
    return podcastEpisodes.filter(ep => episodeStates[ep.id]?.isDownloaded);
  }, [episodeStates]);

  const allGenres = React.useMemo(() => {
    const genres = new Set(podcastShows.map(s => s.genre));
    return ['all', ...Array.from(genres)];
  }, []);

  const discoverShows = React.useMemo(() => {
    return podcastShows.filter(s => {
      const matchesSearch = discoverSearch.length === 0 ||
        s.title.toLowerCase().includes(discoverSearch.toLowerCase()) ||
        s.author.toLowerCase().includes(discoverSearch.toLowerCase());
      const matchesGenre = discoverGenre === 'all' || s.genre === discoverGenre;
      return matchesSearch && matchesGenre;
    });
  }, [discoverSearch, discoverGenre]);

  const newAndNoteworthy = React.useMemo(() => {
    return podcastShows.filter(s => getEpisodesByShow(s.id).length > 0).slice(0, 3);
  }, []);

  const trending = React.useMemo(() => {
    return [...podcastShows].sort((a, b) => b.episodeCount - a.episodeCount).slice(0, 4);
  }, []);

  const isCurrentlyPlaying = (episodeId: string) => {
    return isPodcastMode && currentEpisode?.id === episodeId && isPlaying;
  };

  const isCurrentEpisode = (episodeId: string) => {
    return isPodcastMode && currentEpisode?.id === episodeId;
  };

  const handleShowContextMenu = (e: React.MouseEvent | React.TouchEvent, show: PodcastShow) => {
    if (subscribedShowIds.includes(show.id)) {
      e.preventDefault();
      e.stopPropagation();
      setUnsubscribeTarget(show);
    }
  };

  const confirmUnsubscribe = () => {
    if (unsubscribeTarget) {
      toggleSubscribe(unsubscribeTarget.id);
      setUnsubscribeTarget(null);
    }
  };

  const renderEpisodeRow = (ep: PodcastEpisode, size: string, showActions: boolean) => {
    const show = podcastShows.find(s => s.id === ep.showId);
    const state = episodeStates[ep.id];
    const active = isCurrentEpisode(ep.id);
    const playing = isCurrentlyPlaying(ep.id);
    const unplayed = state && !state.isPlayed && !state.completed;
    const played = state?.completed;
    const progress = state && !state.completed && state.resumePosition > 0
      ? (state.resumePosition / ep.duration) * 100
      : 0;
    const artSize = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';

    return (
      <div
        key={ep.id}
        className={[
          'flex items-center gap-3 p-3 rounded-lg transition-colors group cursor-pointer',
          active ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent/30',
          played ? 'opacity-60' : '',
        ].join(' ')}
        onClick={() => handlePlayEpisode(ep)}
      >
        <div className={`relative flex-shrink-0 ${artSize} rounded bg-gradient-to-br ${getCoverGradient(ep.showId)}`}>
          {unplayed && (
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-background" />
          )}
          {(playing || (active && !isPlaying)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
              {playing ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </div>
          )}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 rounded-b">
              <div className="h-full bg-primary rounded-b" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{ep.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {show?.title}{' \u00b7 '}{formatDate(ep.publishDate)}
          </p>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline flex-shrink-0">
          {formatEpisodeDuration(ep.duration)}
        </span>

        {progress > 0 && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {Math.round(progress)}%
          </span>
        )}

        {active && playbackMode === 'podcast' && <SpeedBadge />}

        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${state?.favorite ? 'text-red-400' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleEpisodeFavorite(ep.id); }}
            >
              <Heart className={`w-3.5 h-3.5 ${state?.favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${state?.isDownloaded ? 'text-primary' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleEpisodeDownload(ep.id); }}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderShowCard = (show: PodcastShow) => {
    const isSub = subscribedShowIds.includes(show.id);
    const episodes = getEpisodesByShow(show.id);
    const unplayed = episodes.filter(ep => {
      const st = episodeStates[ep.id];
      return st && !st.isPlayed && !st.completed;
    });
    const latestEp = episodes[0];
    const latestState = latestEp ? episodeStates[latestEp.id] : null;

    return (
      <Card
        key={show.id}
        className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all group"
        onClick={() => navigate('podcast-detail', { showId: show.id })}
        onContextMenu={(e) => handleShowContextMenu(e, show)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getCoverGradient(show.id)} flex-shrink-0 relative`}>
              {unplayed.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-signal-red text-[10px] font-bold text-white flex items-center justify-center">
                  {unplayed.length > 9 ? '9+' : unplayed.length}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{show.title}</h3>
              <p className="text-xs text-muted-foreground">{show.author}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{show.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-[10px]">{show.genre}</Badge>
                <span className="text-[11px] text-muted-foreground">{show.episodeCount} episodes</span>
                {latestEp && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Rss className="w-3 h-3" />
                    {formatDate(latestEp.publishDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Button
                variant={isSub ? 'secondary' : 'default'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSub) { setUnsubscribeTarget(show); } else { toggleSubscribe(show.id); }
                }}
              >
                {isSub ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isSub ? 'Subscribed' : 'Subscribe'}
              </Button>

              {latestEp && latestState && !latestState.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={(e) => { e.stopPropagation(); handlePlayEpisode(latestEp); }}
                >
                  <Play className="w-3.5 h-3.5" />
                  {latestState.resumePosition > 0 ? 'Resume' : 'Play Latest'}
                </Button>
              )}

              {latestEp && latestState && latestState.resumePosition > 0 && !latestState.completed && (
                <div className="text-[10px] text-muted-foreground">
                  {Math.round((latestState.resumePosition / latestEp.duration) * 100)}% listened
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDiscoverShowCard = (show: PodcastShow) => {
    const isSub = subscribedShowIds.includes(show.id);
    const isExpanded = expandedShowId === show.id;
    const episodes = getEpisodesByShow(show.id);
    return (
      <Card
        key={show.id}
        className="bg-card border-border hover:border-muted-foreground/20 transition-all"
      >
        <CardContent className="p-3">
          <div className="flex gap-3 cursor-pointer" onClick={() => setExpandedShowId(isExpanded ? null : show.id)}>
            <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(show.id)} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{show.title}</p>
              <p className="text-xs text-muted-foreground truncate">{show.author}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{show.genre}</Badge>
                <span className="text-[10px] text-muted-foreground">{show.episodeCount} eps</span>
                <span className="text-[10px] text-muted-foreground">{episodes.length} available</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{show.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Button
                variant={isSub ? 'secondary' : 'default'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={(e) => { e.stopPropagation(); toggleSubscribe(show.id); }}
              >
                {isSub ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isSub ? 'Subscribed' : 'Subscribe'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => { e.stopPropagation(); if (episodes.length > 0) handlePlayEpisode(episodes[0]); }}
              >
                <Play className="w-3 h-3" />
                Play Latest
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); setExpandedShowId(isExpanded ? null : show.id); }}
              >
                {isExpanded ? 'Hide' : `${episodes.length} episodes`}
              </Button>
            </div>
          </div>

          {isExpanded && episodes.length > 0 && (
            <div className="mt-3 ml-[76px] space-y-1 border-l-2 border-primary/20 pl-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Episodes</p>
              {episodes.map(ep => renderEpisodeRow(ep, 'sm', false))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {unsubscribeTarget && (
        <UnsubscribeConfirm
          show={unsubscribeTarget}
          onConfirm={confirmUnsubscribe}
          onCancel={() => setUnsubscribeTarget(null)}
        />
      )}

      <ScrollArea className="h-full">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Podcast className="w-6 h-6 text-primary" /> Podcasts
            </h1>
            <div className="flex items-center gap-2">
              {newEpisodes.length > 0 && (
                <Badge variant="outline" className="text-xs text-signal-red border-signal-red/30">
                  <Circle className="w-2 h-2 mr-1 fill-signal-red text-signal-red" />
                  {newEpisodes.length} new
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">{subscribedShows.length} subscribed</Badge>
            </div>
          </div>

          <Card className="bg-card border-border mb-6">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Speed:</span>
                  <SpeedBadge />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={skipSilence ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={toggleSkipSilence}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    Skip Silence
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={sleepTimerMinutes !== null ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      if (sleepTimerMinutes !== null) { setSleepTimer(null); } else { setShowSleepTimer(!showSleepTimer); }
                    }}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    {sleepTimerMinutes !== null ? `Sleep: ${sleepTimerMinutes}m` : 'Sleep Timer'}
                  </Button>
                </div>
                {showSleepTimer && (
                  <div className="flex items-center gap-2">
                    {[15, 30, 45, 60, 90].map(min => (
                      <Button
                        key={min}
                        variant={sleepTimerMinutes === min ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => { setSleepTimer(min); setShowSleepTimer(false); }}
                      >
                        {min}m
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-surface">
              <TabsTrigger value="subscriptions" className="text-xs gap-1.5">
                <Podcast className="w-3.5 h-3.5" /> My Subscriptions
              </TabsTrigger>
              <TabsTrigger value="discover" className="text-xs gap-1.5">
                <Search className="w-3.5 h-3.5" /> Discover
              </TabsTrigger>
              <TabsTrigger value="all-episodes" className="text-xs gap-1.5">
                <Radio className="w-3.5 h-3.5" /> All Episodes
                {newEpisodes.length > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{newEpisodes.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="downloads" className="text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" /> Downloads
                {downloadedEpisodes.length > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{downloadedEpisodes.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="space-y-6">
              {subscribedShows.length === 0 ? (
                <div className="text-center py-12">
                  <Podcast className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg text-muted-foreground">No subscriptions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search and subscribe to podcasts to get started.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('discover')}>
                    <Search className="w-4 h-4 mr-2" /> Discover Podcasts
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subscribedShows.map(show => renderShowCard(show))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search podcasts by title or author..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="pl-12 h-11 text-sm bg-card border-border rounded-xl"
                />
                {discoverSearch && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setDiscoverSearch('')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {allGenres.map(genre => (
                  <Button
                    key={genre}
                    variant={discoverGenre === genre ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDiscoverGenre(genre)}
                  >
                    {genre === 'all' ? 'All Genres' : genre}
                  </Button>
                ))}
              </div>

              {discoverSearch.length === 0 && discoverGenre === 'all' && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" /> New {'&'} Noteworthy
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {newAndNoteworthy.map(show => {
                      const isSub = subscribedShowIds.includes(show.id);
                      const episodes = getEpisodesByShow(show.id);
                      const unplayed = episodes.filter(ep => {
                        const st = episodeStates[ep.id];
                        return st && !st.isPlayed && !st.completed;
                      });
                      return (
                        <Card
                          key={show.id}
                          className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all"
                          onClick={() => navigate('podcast-detail', { showId: show.id })}
                        >
                          <CardContent className="p-3">
                            <div className={"w-full aspect-square rounded-lg bg-gradient-to-br " + getCoverGradient(show.id) + " mb-3 relative"}>
                              {unplayed.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-signal-red text-[10px] font-bold text-white flex items-center justify-center">
                                  {unplayed.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium truncate">{show.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{show.author}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-[10px]">{show.genre}</Badge>
                              <Button
                                variant={isSub ? 'secondary' : 'default'}
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={(e) => { e.stopPropagation(); toggleSubscribe(show.id); }}
                              >
                                {isSub ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {discoverSearch.length === 0 && discoverGenre === 'all' && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Trending
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trending.map(show => renderDiscoverShowCard(show))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" /> All Podcasts
                  <Badge variant="outline" className="text-[10px]">{discoverShows.length}</Badge>
                </h2>
                {discoverShows.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No podcasts match your search</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {discoverShows.map(show => renderDiscoverShowCard(show))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all-episodes" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All', icon: Radio },
                  { key: 'unplayed', label: 'Unplayed', icon: Circle },
                  { key: 'in-progress', label: 'In Progress', icon: Clock },
                  { key: 'favorites', label: 'Favorites', icon: Heart },
                  { key: 'downloaded', label: 'Downloaded', icon: Download },
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={allEpisodesFilter === key ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setAllEpisodesFilter(key)}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </Button>
                ))}
              </div>

              {filteredAllEpisodes.length === 0 ? (
                <div className="text-center py-12">
                  <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg text-muted-foreground">
                    {allEpisodesFilter === 'all' ? 'No episodes yet' : 'No ' + allEpisodesFilter + ' episodes'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {allEpisodesFilter === 'all'
                      ? 'Subscribe to podcasts to see their episodes here.'
                      : 'Try a different filter or subscribe to more podcasts.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
                  {filteredAllEpisodes.map(ep => renderEpisodeRow(ep, 'sm', true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="downloads" className="space-y-4">
              {downloadedEpisodes.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg text-muted-foreground">No downloads</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download episodes to listen offline.
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
                  {downloadedEpisodes
                    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
                    .map(ep => {
                      const show = podcastShows.find(s => s.id === ep.showId);
                      const state = episodeStates[ep.id];
                      const active = isCurrentEpisode(ep.id);
                      const playing = isCurrentlyPlaying(ep.id);
                      const fileSize = ep.fileSize ? `${(ep.fileSize / (1024 * 1024)).toFixed(1)} MB` : '';

                      return (
                        <div
                          key={ep.id}
                          className={[
                            'flex items-center gap-3 p-3 rounded-lg transition-colors group cursor-pointer',
                            active ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent/30',
                          ].join(' ')}
                          onClick={() => handlePlayEpisode(ep)}
                        >
                          <div className={"w-12 h-12 rounded bg-gradient-to-br " + getCoverGradient(ep.showId) + " flex-shrink-0 relative"}>
                            {playing && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                <Pause className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{ep.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{show?.title}</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-muted-foreground">{formatEpisodeDuration(ep.duration)}</span>
                            {fileSize && (
                              <span className="text-[10px] text-muted-foreground block">{fileSize}</span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); toggleEpisodeDownload(ep.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </>
  );
}
