'use client';

import React from 'react';
import { useProfilesStore } from '@/store/profiles';
import { getCoverGradient, formatDuration } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User, Heart, Clock, Music, Play, Plus, Star, Calendar,
  ArrowLeft, Check, Volume2,
} from 'lucide-react';

export function UserProfilesView() {
  const { profiles, activeProfileId, switchProfile, getActiveProfile } = useProfilesStore();
  const activeProfile = getActiveProfile();

  const formatPlayTimeHours = (seconds: number) => {
    const hours = Math.round(seconds / 3600);
    return `${hours.toLocaleString()} hrs`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const recentTracks: import('@/lib/data').Track[] = [];

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Profiles</h1>
            <Badge variant="secondary" className="text-xs">Shared Library</Badge>
          </div>
          <span className="text-sm text-muted-foreground">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span>
        </div>

        <Separator />

        {/* Active Profile Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className={`${activeProfile.color} w-20 h-20 rounded-full flex items-center justify-center shrink-0`}>
                <span className="text-3xl font-bold text-white">{activeProfile.avatar}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold truncate">{activeProfile.name}</h2>
                  <Badge className="bg-signal-green text-white text-[10px]">Active</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {formatDate(activeProfile.joinDate)}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{formatPlayTimeHours(activeProfile.totalPlayTime)}</p>
                    <p className="text-xs text-muted-foreground">Total Play Time</p>
                  </div>
                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <Play className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{activeProfile.totalPlays.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Plays</p>
                  </div>
                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <Heart className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{activeProfile.lovedTrackIds.length}</p>
                    <p className="text-xs text-muted-foreground">Loved Tracks</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    Edit Profile
                  </Button>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Volume2 className="w-3.5 h-3.5" />
                    Listening since {formatDate(activeProfile.joinDate)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Switcher */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">All Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map(profile => {
              const isActive = profile.id === activeProfileId;
              return (
                <Card
                  key={profile.id}
                  className={`bg-card border-border ${isActive ? 'ring-1 ring-primary/50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`${profile.color} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
                        <span className="text-lg font-bold text-white">{profile.avatar}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold truncate">{profile.name}</h4>
                          {isActive && (
                            <Check className="w-4 h-4 text-signal-green shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{formatDate(profile.joinDate)}</p>
                        {/* Mini stats */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatPlayTimeHours(profile.totalPlayTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {profile.totalPlays.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {profile.lovedTrackIds.length}
                          </span>
                        </div>
                        {isActive ? (
                          <Badge className="bg-signal-green/20 text-signal-green text-[10px] border-0">Current Profile</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => switchProfile(profile.id)}
                          >
                            Switch to Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Add New Profile */}
        <Card className="bg-card border-border border-dashed cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-surface/50 flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Create New Profile</p>
          </CardContent>
        </Card>

        {/* Shared Library Notice */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Music className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold mb-1">Shared Library</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All profiles share the same music library. Each profile has its own favorites, listening history,
                  and personalized recommendations. Switch profiles to keep your listening experience separate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Profile's Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Recent Activity — {activeProfile.name}
          </h3>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {recentTracks.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No recent plays yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTracks.map(track => {
                    if (!track) return null;
                    return (
                      <div key={track.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/50 transition-colors">
                        {/* Cover art */}
                        <div
                          className={`w-10 h-10 rounded-md bg-gradient-to-br ${getCoverGradient(track.albumId)} shrink-0 overflow-hidden`}
                        >
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
                        </div>
                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                        </div>
                        {/* Duration */}
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
