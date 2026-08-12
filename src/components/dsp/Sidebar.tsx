'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { zones } from '@/lib/data';
import {
  Home, Library, Search, Speaker, Play, Pause, SkipForward, SkipBack,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Volume1, ChevronLeft,
  ChevronRight, Music, Mic2, Radio, ListMusic, Settings, Disc3,
  Headphones, LayoutGrid, Grip, X, Heart, Podcast, FolderOpen,
  Newspaper, Globe, Clapperboard, Workflow, Server, MonitorSpeaker,
  Gauge, Sliders, Clock, User, Shield, Activity, Puzzle, Scale,
} from 'lucide-react';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { usePodcastStore } from '@/store/podcast';

const navItems: Array<{ icon: typeof Home; label: string; view: string; badge?: string }> = [
  { icon: Home, label: 'Home', view: 'home' as const },
  { icon: LayoutGrid, label: 'Artists', view: 'browse-artists' as const },
  { icon: Disc3, label: 'Albums', view: 'browse-albums' as const },
  { icon: Music, label: 'Tracks', view: 'browse-tracks' as const },
  { icon: Radio, label: 'Genres', view: 'browse-genres' as const },
  { icon: ListMusic, label: 'Playlists', view: 'browse-playlists' as const },
  { icon: Podcast, label: 'Podcasts', view: 'podcasts' as const, badge: 'podcast' as const },
];

const discoveryItems: Array<{ icon: typeof Home; label: string; view: string; params?: Record<string, string> }> = [
  { icon: Clapperboard, label: 'Editorial', view: 'editorial' as const },
  { icon: Radio, label: 'Radio', view: 'radio' as const },
  { icon: Workflow, label: 'Composers', view: 'composer-detail' as const, params: { composerId: 'comp-1' } },
];

const systemItems = [
  { icon: Server, label: 'Core / System', view: 'system' as const },
  { icon: MonitorSpeaker, label: 'Endpoints', view: 'endpoints' as const },
  { icon: Gauge, label: 'Signal Path', view: 'signal-path' as const },
  { icon: Sliders, label: 'DSP Engine', view: 'dsp-config' as const },
  { icon: Activity, label: 'Health / NFR', view: 'system-health' as const },
  { icon: Shield, label: 'Security', view: 'security' as const },
  { icon: Puzzle, label: 'Plugins', view: 'plugins' as const },
  { icon: Scale, label: 'Licensing', view: 'licensing' as const },
];

const libraryItems = [
  { icon: FolderOpen, label: 'Library', view: 'library' as const },
  { icon: Play, label: 'Now Playing', view: 'now-playing' as const },
  { icon: Clock, label: 'History', view: 'play-history' as const },
  { icon: User, label: 'Profiles', view: 'profiles' as const },
  { icon: Speaker, label: 'Zones', view: 'zones' as const },
  { icon: Globe, label: 'Streaming', view: 'streaming' as const },
  { icon: Search, label: 'Search', view: 'search' as const },
  { icon: Settings, label: 'Settings', view: 'settings' as const },
];

export function Sidebar() {
  const { currentView, navigate, sidebarOpen, setSidebarOpen } = useUIStore();
  const { isPlaying, currentTrack, activeZoneId, togglePlay } = usePlayerStore();
  const activeZone = zones.find(z => z.id === activeZoneId);
  const { getTotalNewEpisodes } = usePodcastStore();
  const newEpisodes = getTotalNewEpisodes();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 h-16">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Headphones className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-foreground whitespace-nowrap">DSP</h1>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">Dyabavadra Streaming</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-auto h-8 w-8 text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        <ScrollArea className="flex-1">
          {/* Navigation */}
          <div className="p-2">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Browse
              </p>
            )}
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-9 mb-0.5 ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'
                  } ${!sidebarOpen ? 'px-0 justify-center' : ''}`}
                  onClick={() => navigate(item.view)}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-4 h-4" />
                    {item.badge === 'podcast' && newEpisodes > 0 && sidebarOpen && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-signal-red text-[8px] font-bold text-white flex items-center justify-center">
                        {newEpisodes > 9 ? '9+' : newEpisodes}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && <span className="text-xs">{item.label}</span>}
                </Button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border mx-3" />

          {/* Discovery */}
          <div className="p-2 mt-2">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Discovery
              </p>
            )}
            {discoveryItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-9 mb-0.5 ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'
                  } ${!sidebarOpen ? 'px-0 justify-center' : ''}`}
                  onClick={() => navigate(item.view as any, item.params)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="text-xs">{item.label}</span>}
                </Button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border mx-3" />

          {/* System / Architecture */}
          <div className="p-2 mt-2">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                System
              </p>
            )}
            {systemItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-9 mb-0.5 ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'
                  } ${!sidebarOpen ? 'px-0 justify-center' : ''}`}
                  onClick={() => navigate(item.view)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="text-xs">{item.label}</span>}
                </Button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border mx-3" />

          {/* Library / Tools */}
          <div className="p-2 mt-2">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Library
              </p>
            )}
            {libraryItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-9 mb-0.5 ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'
                  } ${!sidebarOpen ? 'px-0 justify-center' : ''}`}
                  onClick={() => navigate(item.view)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="text-xs">{item.label}</span>}
                </Button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border mx-3" />

          {/* Now Playing Mini Widget */}
          {sidebarOpen && currentTrack && (
            <div className="p-3 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                Now Playing
              </p>
              <div
                className="rounded-lg bg-card border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate('now-playing')}
              >
                <div className="flex gap-3">
                  <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(currentTrack.id)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{currentTrack.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentTrack.artistName}</p>
                    {activeZone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Speaker className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground">{activeZone.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Active Zones Bar */}
        {sidebarOpen && (
          <>
            <Separator className="bg-sidebar-border" />
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Zones
                </p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => navigate('zones')}>
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {zones.filter(z => z.isPlaying).map(zone => (
                  <Badge
                    key={zone.id}
                    variant={zone.id === activeZoneId ? 'default' : 'secondary'}
                    className={`text-[10px] cursor-pointer ${
                      zone.id === activeZoneId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => usePlayerStore.getState().setActiveZone(zone.id)}
                  >
                    <Speaker className="w-2.5 h-2.5 mr-1" />
                    {zone.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* User Profile */}
        {sidebarOpen && (
          <>
            <Separator className="bg-sidebar-border" />
            <div className="p-3 flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">ZA</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">Music Lover</p>
                <p className="text-[10px] text-muted-foreground">Core Online</p>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
