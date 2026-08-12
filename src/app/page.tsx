'use client';

import React from 'react';
import { Sidebar } from '@/components/dsp/Sidebar';
import { PlayerBar } from '@/components/dsp/PlayerBar';
import { QueueDrawer } from '@/components/dsp/QueueDrawer';
import { HomeView } from '@/components/dsp/HomeView';
import { BrowseArtistsView } from '@/components/dsp/BrowseArtistsView';
import { BrowseAlbumsView } from '@/components/dsp/BrowseAlbumsView';
import { BrowseTracksView } from '@/components/dsp/BrowseTracksView';
import { BrowseGenresView } from '@/components/dsp/BrowseGenresView';
import { BrowsePlaylistsView } from '@/components/dsp/BrowsePlaylistsView';
import { NowPlayingView } from '@/components/dsp/NowPlayingView';
import { ArtistDetailView } from '@/components/dsp/ArtistDetailView';
import { AlbumDetailView } from '@/components/dsp/AlbumDetailView';
import { SearchView } from '@/components/dsp/SearchView';
import { ZonesView } from '@/components/dsp/ZonesView';
import { SettingsView } from '@/components/dsp/SettingsView';
import { PodcastsView } from '@/components/dsp/PodcastsView';
import { PodcastDetailView } from '@/components/dsp/PodcastDetailView';
import { useUIStore } from '@/store/ui';
import type { ViewName } from '@/store/player';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

function ViewRouter({ view }: { view: ViewName }) {
  switch (view) {
    case 'home': return <HomeView />;
    case 'browse-artists': return <BrowseArtistsView />;
    case 'browse-albums': return <BrowseAlbumsView />;
    case 'browse-tracks': return <BrowseTracksView />;
    case 'browse-genres': return <BrowseGenresView />;
    case 'browse-playlists': return <BrowsePlaylistsView />;
    case 'now-playing': return <NowPlayingView />;
    case 'artist-detail': return <ArtistDetailView />;
    case 'album-detail': return <AlbumDetailView />;
    case 'search': return <SearchView />;
    case 'zones': return <ZonesView />;
    case 'settings': return <SettingsView />;
    case 'podcasts': return <PodcastsView />;
    case 'podcast-detail': return <PodcastDetailView />;
    default: return <HomeView />;
  }
}

export default function Page() {
  const { currentView, sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-sm font-semibold">DSP</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ViewRouter view={currentView} />
          </div>
          <PlayerBar />
        </main>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer />
    </div>
  );
}
