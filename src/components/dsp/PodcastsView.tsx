'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePodcastStore } from '@/store/podcast';
import {
  podcastShows, podcastEpisodes, iTunesSearchResults,
  getEpisodesByShow, getUnplayedEpisodes, getInProgressEpisodes,
  getDownloadedEpisodes, getAllNewEpisodes, getSubscribedShows,
  formatEpisodeDuration, formatDate,
} from '@/lib/podcast-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Podcast, Play, Pause, SkipForward, Search, Plus, Check, Download,
  Clock, Radio, Rss, RefreshCw, Headphones, ArrowRight,
  Circle, CircleCheck, Heart, MoreHorizontal, Wifi, WifiOff,
  FastForward, Moon, Scissors, Bell, BellOff, Settings,
} from 'lucide-react';
import { getCoverGradient } from '@/lib/data';

export function PodcastsView() {
  const { navigate } = useUIStore();
  const {
    episodeStates, subscribedShowIds, toggleSubscribe,
    playEpisode, markEpisodePlayed, markAllPlayed,
    playbackSpeed, cyclePlaybackSpeed, skipSilence, toggleSkipSilence,
    sleepTimerMinutes, setSleepTimer, toggleEpisodeDownload,
  } = usePodcastStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [iTunesSearch, setITunesSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('subscriptions');
  const [showSleepTimer, setShowSleepTimer] = React.useState(false);

  const subscribedShows = podcastShows.filter(s => subscribedShowIds.includes(s.id));
  const inProgress = getInProgressEpisodes();
  const newEpisodes = getAllNewEpisodes();
  const downloaded = getDownloadedEpisodes();

  const filteredITunes = iTunesSearch.length > 1
    ? iTunesSearchResults.filter(r =>
        r.title.toLowerCase().includes(iTunesSearch.toLowerCase()) ||
        r.author.toLowerCase().includes(iTunesSearch.toLowerCase())
      )
    : [];

  const playEpisodeInPlayer = (ep: typeof podcastEpisodes[0]) => {
    const resumePos = episodeStates[ep.id]?.resumePosition || 0;
    playEpisode(ep);
  };

  return (
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

        {/* Playback Controls Strip */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Speed:</span>
                <Button variant="outline" size="sm" className="h-7 text-xs font-mono min-w-[48px] justify-center" onClick={cyclePlaybackSpeed}>
                  {playbackSpeed}x
                </Button>
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
                    if (sleepTimerMinutes !== null) {
                      setSleepTimer(null);
                    } else {
                      setShowSleepTimer(!showSleepTimer);
                    }
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
              <Podcast className="w-3.5 h-3.5" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="new" className="text-xs gap-1.5">
              <Circle className="w-3.5 h-3.5 text-signal-red" /> New Episodes
              {newEpisodes.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{newEpisodes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs gap-1.5">
              <Clock className="w-3.5 h-3.5" /> In Progress
              {inProgress.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{inProgress.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" /> Discover
            </TabsTrigger>
          </TabsList>

          {/* SUBSCRIPTIONS TAB */}
          <TabsContent value="subscriptions" className="space-y-6">
            {subscribedShows.length === 0 ? (
              <div className="text-center py-12">
                <Podcast className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">No subscriptions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Search the iTunes directory to find podcasts</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('discover')}>
                  <Search className="w-4 h-4 mr-2" /> Discover Podcasts
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {subscribedShows.map(show => {
                  const episodes = getEpisodesByShow(show.id);
                  const unplayed = episodes.filter(ep => {
                    const state = episodeStates[ep.id];
                    return state && !state.isPlayed && !state.completed;
                  });
                  const latestEp = episodes[0];
                  const latestState = latestEp ? episodeStates[latestEp.id] : null;

                  return (
                    <Card
                      key={show.id}
                      className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all"
                      onClick={() => navigate('podcast-detail', { showId: show.id })}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Show Artwork */}
                          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getCoverGradient(show.id)} flex-shrink-0 cover-art-hover relative`}>
                            {unplayed.length > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-signal-red text-[10px] font-bold text-white flex items-center justify-center">
                                {unplayed.length > 9 ? '9+' : unplayed.length}
                              </span>
                            )}
                          </div>

                          {/* Show Info */}
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

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {latestEp && latestState && !latestState.completed && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playEpisode(latestEp);
                                }}
                              >
                                <Play className="w-3.5 h-3.5" />
                                {latestState.resumePosition > 0 ? 'Resume' : 'Play Latest'}
                              </Button>
                            )}
                            {latestEp && latestState && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAllPlayed(show.id);
                                  }}
                                >
                                  <CircleCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </div>
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
                })}
              </div>
            )}
          </TabsContent>

          {/* NEW EPISODES TAB */}
          <TabsContent value="new" className="space-y-2">
            {newEpisodes.length === 0 ? (
              <div className="text-center py-12">
                <CircleCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">No new episodes to listen to</p>
              </div>
            ) : (
              newEpisodes.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map(ep => {
                const show = podcastShows.find(s => s.id === ep.showId);
                const state = episodeStates[ep.id];
                return (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                    onClick={() => playEpisode(ep)}
                  >
                    <div className={`w-12 h-12 rounded bg-gradient-to-br ${getCoverGradient(ep.showId)} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {show?.title} · {formatDate(ep.publishDate)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatEpisodeDuration(ep.duration)}</span>
                    {state?.isDownloaded ? (
                      <Badge variant="outline" className="text-[10px]"><WifiOff className="w-2.5 h-2.5 mr-0.5" />Local</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]"><Wifi className="w-2.5 h-2.5 mr-0.5" />Stream</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); toggleEpisodeDownload(ep.id); }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* IN PROGRESS TAB */}
          <TabsContent value="in-progress" className="space-y-2">
            {inProgress.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">Nothing in progress</p>
                <p className="text-sm text-muted-foreground mt-1">Start listening to an episode to see it here</p>
              </div>
            ) : (
              inProgress.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map(ep => {
                const show = podcastShows.find(s => s.id === ep.showId);
                const state = episodeStates[ep.id];
                const progress = state ? (state.resumePosition / ep.duration) * 100 : 0;
                return (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                    onClick={() => playEpisode(ep)}
                  >
                    <div className={`w-12 h-12 rounded bg-gradient-to-br ${getCoverGradient(ep.showId)} flex-shrink-0 relative`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{show?.title}</p>
                      <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{formatEpisodeDuration(state?.resumePosition || 0)}</span>
                      <span className="text-[11px] text-muted-foreground block">/ {formatEpisodeDuration(ep.duration)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* DISCOVER TAB — iTunes Search */}
          <TabsContent value="discover" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search the iTunes Podcast directory..."
                value={iTunesSearch}
                onChange={(e) => setITunesSearch(e.target.value)}
                className="pl-12 h-12 text-lg bg-card border-border rounded-xl"
              />
            </div>

            {iTunesSearch.length > 1 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" /> iTunes Results ({filteredITunes.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredITunes.map(result => {
                    const isSubscribed = subscribedShowIds.includes(result.id);
                    return (
                      <Card key={result.id} className="bg-card border-border hover:border-muted-foreground/20 transition-all">
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(result.id)} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{result.author}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{result.genre}</Badge>
                                <span className="text-[10px] text-muted-foreground">{result.episodeCount} episodes</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                            </div>
                            <Button
                              variant={isSubscribed ? 'secondary' : 'default'}
                              size="sm"
                              className="h-8 gap-1.5 flex-shrink-0 self-start"
                              onClick={() => toggleSubscribe(result.id)}
                            >
                              {isSubscribed ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Subscribed
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" /> Subscribe
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {iTunesSearch.length <= 1 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Popular in Audio & Music</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {iTunesSearchResults.slice(0, 6).map(result => {
                    const isSubscribed = subscribedShowIds.includes(result.id);
                    return (
                      <Card key={result.id} className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all">
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(result.id)} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{result.author}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{result.genre}</Badge>
                                <span className="text-[10px] text-muted-foreground">{result.episodeCount} eps</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                            </div>
                            <Button
                              variant={isSubscribed ? 'secondary' : 'default'}
                              size="sm"
                              className="h-8 gap-1.5 flex-shrink-0 self-start"
                              onClick={() => toggleSubscribe(result.id)}
                            >
                              {isSubscribed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
