'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { getFrequencyData, getWaveformData, getAnalyser } from '@/lib/dsp/audio-engine';

type VisualizerMode = 'bars' | 'waveform' | 'circular';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  width?: number;
  height?: number;
  barCount?: number;
  className?: string;
  colorScheme?: 'gold' | 'green' | 'rainbow' | 'blue';
  showControls?: boolean;
}

const COLOR_SCHEMES = {
  gold: { primary: '#eab308', secondary: '#f59e0b', glow: 'rgba(234,179,8,0.3)' },
  green: { primary: '#22c55e', secondary: '#10b981', glow: 'rgba(34,197,94,0.3)' },
  blue: { primary: '#3b82f6', secondary: '#6366f1', glow: 'rgba(59,130,246,0.3)' },
  rainbow: { primary: '#ef4444', secondary: '#8b5cf6', glow: 'rgba(239,68,68,0.3)' },
};

export function AudioVisualizer({
  mode = 'bars',
  width = 800,
  height = 200,
  barCount = 64,
  className = '',
  colorScheme = 'gold',
  showControls = true,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [currentMode, setCurrentMode] = useState<VisualizerMode>(mode);
  const colors = COLOR_SCHEMES[colorScheme];

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const data = getFrequencyData();
    if (!data || data.length === 0) return;

    ctx.clearRect(0, 0, w, h);

    const usableBins = Math.floor(data.length * 0.6); // skip high-frequency bins (mostly silence)
    const binsPerBar = Math.floor(usableBins / barCount);
    const barWidth = (w / barCount) * 0.75;
    const gap = (w / barCount) * 0.25;

    for (let i = 0; i < barCount; i++) {
      // Average the bins for this bar
      let sum = 0;
      for (let j = 0; j < binsPerBar; j++) {
        sum += data[i * binsPerBar + j];
      }
      const avg = sum / binsPerBar;
      const barHeight = (avg / 255) * h * 0.9;

      if (barHeight < 1) continue;

      const x = i * (barWidth + gap) + gap / 2;
      const y = h - barHeight;

      // Gradient for each bar
      const gradient = ctx.createLinearGradient(x, y, x, h);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(0.5, colors.secondary);
      gradient.addColorStop(1, `${colors.primary}33`);

      ctx.fillStyle = gradient;

      // Rounded top bars
      const radius = Math.min(barWidth / 2, 3);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, h);
      ctx.lineTo(x, h);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // Glow on top
      if (barHeight > h * 0.4) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, barWidth, 2);
        ctx.shadowBlur = 0;
      }
    }
  }, [barCount, colors]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const data = getWaveformData();
    if (!data || data.length === 0) return;

    ctx.clearRect(0, 0, w, h);

    const sliceWidth = w / data.length;

    // Main waveform line
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = colors.primary;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * sliceWidth, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Filled area below waveform
    ctx.lineTo(w, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, `${colors.primary}15`);
    fillGrad.addColorStop(0.5, `${colors.secondary}08`);
    fillGrad.addColorStop(1, `${colors.primary}15`);
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Center line
    ctx.strokeStyle = `${colors.primary}20`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }, [colors]);

  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const data = getFrequencyData();
    if (!data || data.length === 0) return;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.22;
    const maxBarLen = Math.min(w, h) * 0.25;
    const usableBins = Math.floor(data.length * 0.5);
    const totalBars = barCount * 2;

    // Inner glow circle
    const avgEnergy = data.reduce((a, b) => a + b, 0) / data.length / 255;
    const glowRadius = baseRadius * (0.8 + avgEnergy * 0.4);
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glowGrad.addColorStop(0, `${colors.primary}20`);
    glowGrad.addColorStop(0.7, `${colors.primary}08`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Radial bars
    for (let i = 0; i < totalBars; i++) {
      const binIndex = Math.floor((i / totalBars) * usableBins);
      const value = data[binIndex] / 255;
      const angle = (i / totalBars) * Math.PI * 2 - Math.PI / 2;
      const barLen = value * maxBarLen;

      if (barLen < 1) continue;

      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + barLen);
      const y2 = cy + Math.sin(angle) * (baseRadius + barLen);

      ctx.strokeStyle = value > 0.6 ? colors.primary : colors.secondary;
      ctx.lineWidth = Math.max(1.5, (w / totalBars) * 0.4);
      ctx.globalAlpha = 0.5 + value * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Dot at tip for high-energy bars
      if (value > 0.75) {
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(x2, y2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Inner circle outline
    ctx.strokeStyle = `${colors.primary}40`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }, [barCount, colors]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    switch (currentMode) {
      case 'bars': drawBars(ctx, w, h); break;
      case 'waveform': drawWaveform(ctx, w, h); break;
      case 'circular': drawCircular(ctx, w, h); break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [currentMode, drawBars, drawWaveform, drawCircular]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  const modes: { key: VisualizerMode; label: string }[] = [
    { key: 'bars', label: 'Bars' },
    { key: 'waveform', label: 'Wave' },
    { key: 'circular', label: 'Radial' },
  ];

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="w-full rounded-lg"
      />
      {showControls && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => setCurrentMode(m.key)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                currentMode === m.key
                  ? 'bg-primary/30 text-primary border border-primary/30'
                  : 'bg-black/40 text-muted-foreground border border-transparent hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Compact mini-visualizer for the PlayerBar ──
export function MiniVisualizer({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, w, h);

      const data = getFrequencyData();
      if (!data || data.length === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const barCount = Math.floor(w / 4);
      const usableBins = Math.floor(data.length * 0.4);
      const binsPerBar = Math.floor(usableBins / barCount);
      const barW = (w / barCount) * 0.6;
      const gap = (w / barCount) * 0.4;

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          sum += data[i * binsPerBar + j];
        }
        const avg = sum / binsPerBar;
        const barH = (avg / 255) * h;

        if (barH < 0.5) continue;

        const x = i * (barW + gap) + gap / 2;
        const y = h - barH;
        ctx.fillStyle = avg > 180 ? '#eab308' : avg > 100 ? '#a16207' : '#854d0e';
        ctx.fillRect(x, y, barW, barH);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
    />
  );
}
