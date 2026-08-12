'use client';

import React from 'react';
import { getCoverGradient } from '@/lib/data';
import { cn } from '@/lib/utils';

interface CoverArtProps {
  id: string;
  className?: string;
  showVinyl?: boolean;
  isPlaying?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-40 h-40',
  xl: 'w-64 h-64',
};

export function CoverArt({ id, className, showVinyl, isPlaying, size = 'md', onClick }: CoverArtProps) {
  const gradient = getCoverGradient(id);

  return (
    <div className={cn('relative group', sizeMap[size], className)} onClick={onClick}>
      {/* Vinyl effect behind the cover */}
      {showVinyl && (
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-zinc-900 border-2 border-zinc-700 transition-transform duration-500',
            isPlaying ? 'vinyl-spinning' : '',
            'translate-x-1/2',
          )}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Vinyl grooves */}
          <div className="absolute inset-[15%] rounded-full border border-zinc-700/50" />
          <div className="absolute inset-[25%] rounded-full border border-zinc-700/50" />
          <div className="absolute inset-[35%] rounded-full border border-zinc-700/50" />
          <div className="absolute inset-[42%] rounded-full border border-zinc-600/50" />
          <div className="absolute inset-[45%] rounded-full bg-zinc-800 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-zinc-600" />
          </div>
        </div>
      )}

      {/* Cover art */}
      <div
        className={cn(
          'relative rounded-md bg-gradient-to-br overflow-hidden cover-art-hover cursor-pointer',
          gradient,
          size === 'xl' ? 'rounded-xl shadow-2xl' : size === 'lg' ? 'rounded-lg shadow-lg' : 'rounded-md',
          onClick && 'cursor-pointer',
        )}
        onClick={onClick}
      >
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)]" />
      </div>
    </div>
  );
}

export function CoverArtGrid({ id, className, onClick }: { id: string; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-br ${getCoverGradient(id)} overflow-hidden cover-art-hover ${className || 'w-full aspect-square'}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
    </div>
  );
}
