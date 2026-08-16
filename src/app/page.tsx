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
import { LibraryManagementView } from '@/components/dsp/LibraryManagementView';
import { PerformerDetailView } from '@/components/dsp/PerformerDetailView';
import { RadioView } from '@/components/dsp/RadioView';
import { ComposerDetailView } from '@/components/dsp/ComposerDetailView';
import { WorkDetailView } from '@/components/dsp/WorkDetailView';
import { GenreDetailView } from '@/components/dsp/GenreDetailView';
import { EditorialView } from '@/components/dsp/EditorialView';
import { StreamingView } from '@/components/dsp/StreamingView';
import { SystemArchitectureView } from '@/components/dsp/SystemArchitectureView';
import { DSPConfigView } from '@/components/dsp/DSPConfigView';
import { SignalPathView } from '@/components/dsp/SignalPathView';
import { OutputEndpointsView } from '@/components/dsp/OutputEndpointsView';
import { PlayHistoryView } from '@/components/dsp/PlayHistoryView';
import { UserProfilesView } from '@/components/dsp/UserProfilesView';
import { SystemHealthView } from '@/components/dsp/SystemHealthView';
import { SecurityView } from '@/components/dsp/SecurityView';
import { PluginManagerView } from '@/components/dsp/PluginManagerView';
import { LicensingView } from '@/components/dsp/LicensingView';
import { ListeningStatsView } from '@/components/dsp/ListeningStatsView';
import { ZonePicker } from '@/components/dsp/ZonePicker';
import { AudioEngineProvider } from '@/components/dsp/AudioEngineProvider';
import { StoreHydrationGate } from '@/components/StoreHydration';
import { KeyboardShortcuts } from '@/components/dsp/KeyboardShortcuts';
import { GlobalSearchDialog } from '@/components/dsp/GlobalSearchDialog';
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
    case 'library': return <LibraryManagementView />;
    case 'performer-detail': return <PerformerDetailView />;
    case 'radio': return <RadioView />;
    case 'composer-detail': return <ComposerDetailView />;
    case 'work-detail': return <WorkDetailView />;
    case 'genre-detail': return <GenreDetailView />;
    case 'editorial': return <EditorialView />;
    case 'streaming': return <StreamingView />;
    case 'system': return <SystemArchitectureView />;
    case 'dsp-config': return <DSPConfigView />;
    case 'signal-path': return <SignalPathView />;
    case 'endpoints': return <OutputEndpointsView />;
    case 'play-history': return <PlayHistoryView />;
    case 'profiles': return <UserProfilesView />;
    case 'system-health': return <SystemHealthView />;
    case 'security': return <SecurityView />;
    case 'plugins': return <PluginManagerView />;
    case 'licensing': return <LicensingView />;
    case 'listening-stats': return <ListeningStatsView />;
    default: return <HomeView />;
  }
}

export default function Page() {
  const { currentView, sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <StoreHydrationGate>
    <AudioEngineProvider>
    <KeyboardShortcuts />
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

      {/* Zone Picker */}
      <ZonePicker />

      {/* Global Search Dialog (Cmd+K) */}
      <GlobalSearchDialog />
    </div>
    </AudioEngineProvider>
    </StoreHydrationGate>
  );
}
