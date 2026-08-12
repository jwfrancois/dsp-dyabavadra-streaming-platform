import { NextResponse } from 'next/server';

// Simple test page that creates an audio element and tries to play a proxied podcast URL
export async function GET() {
  // Get a real episode URL
  const feedRes = await fetch('https://rss.libsyn.com/shows/128607/destinations/2422538.xml', {
    headers: { 'User-Agent': 'DSP-Platform/1.0' },
  });
  const xml = await feedRes.text();
  const encMatch = xml.match(/<enclosure[^>]*url="([^"]+)"[^>]*\/?>/i);
  const audioUrl = encMatch ? encMatch[1] : '';

  const proxyUrl = audioUrl ? `/api/proxy/podcast?url=${encodeURIComponent(audioUrl)}` : '';

  const html = `<!DOCTYPE html>
<html><head><title>Audio Test</title></head><body>
<h1>DSP Audio Engine Test</h1>
<div id="status">Initializing...</div>
<div id="events"></div>
<audio id="audio" preload="auto" controls></audio>
<br><br>
<button onclick="testPlay()">Play Proxied Podcast</button>
<button onclick="testDirect()">Play Direct URL</button>
<button onclick="stopAudio()">Stop</button>
<br><br>
<div id="log" style="font-family:monospace;font-size:12px;white-space:pre-wrap;max-height:400px;overflow:auto;"></div>
<script>
const audio = document.getElementById('audio');
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const eventsEl = document.getElementById('events');

function log(msg) {
  const line = new Date().toISOString().slice(11,23) + ' ' + msg;
  logEl.textContent += line + '\\n';
  console.log(line);
}

['loadstart','loadedmetadata','loadeddata','canplay','canplaythrough','playing','play','pause','ended','waiting','stalled','error','timeupdate','progress','durationchange'].forEach(evt => {
  audio.addEventListener(evt, (e) => {
    const info = evt === 'timeupdate' ? ' ct=' + audio.currentTime.toFixed(1) + '/' + audio.duration.toFixed(1) : '';
    const info2 = evt === 'error' ? ' err=' + (audio.error?.message || audio.error?.code) : '';
    eventsEl.textContent = evt + info + info2;
    log('[event] ' + evt + info + info2);
    if (evt === 'playing') statusEl.textContent = 'PLAYING';
    if (evt === 'paused') statusEl.textContent = 'Paused';
    if (evt === 'error') statusEl.textContent = 'ERROR';
    if (evt === 'waiting') statusEl.textContent = 'Buffering...';
  });
});

const PROXY_URL = '${proxyUrl}';
const DIRECT_URL = '${audioUrl}';

function testPlay() {
  log('Setting src to PROXY: ' + PROXY_URL.substring(0, 100));
  audio.src = PROXY_URL;
  audio.play().then(() => log('play() resolved')).catch(e => log('play() rejected: ' + e.message));
}

function testDirect() {
  log('Setting src to DIRECT: ' + DIRECT_URL.substring(0, 100));
  audio.src = DIRECT_URL;
  audio.play().then(() => log('play() resolved')).catch(e => log('play() rejected: ' + e.message));
}

function stopAudio() {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  log('Stopped');
}
</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
