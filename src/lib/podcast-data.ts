// ─── PODCAST DATA TYPES ───

export interface PodcastShow {
  id: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;     // API route
  feedUrl: string;        // underlying RSS feed
  genre: string;
  category: string;
  language: string;
  rating: string;         // iTunes content rating (e.g. "clean", "explicit")
  episodeCount: number;
  subscribed: boolean;
  autoDownload: boolean;
  newEpisodeCount: number;
  lastChecked: string;     // ISO date of last feed poll
  itunesId?: number;
  averageDuration: number; // seconds
}

export interface PodcastEpisode {
  id: string;
  showId: string;
  title: string;
  description: string;      // can be long — show notes
  showNotes?: string;       // extended notes / links
  artworkUrl: string;
  audioUrl: string;
  duration: number;          // seconds
  publishDate: string;       // ISO date
  fileSize: number;           // bytes
  format: string;            // typically MP3 or AAC
  bitrate: number;           // typically 64-128 kbps for podcasts
  isDownloaded: boolean;
  isPlayed: boolean;
  resumePosition: number;    // seconds — where the listener left off
  completed: boolean;
  favorite: boolean;
  season?: number;
  episodeNumber?: number;
}

export interface ITunesSearchResult {
  id: string;
  title: string;
  author: string;
  artworkUrl: string;
  genre: string;
  episodeCount: number;
  description: string;
}

// ─── MOCK PODCAST SHOWS ───

export const podcastShows: PodcastShow[] = [
  {
    id: 'podcast-1',
    title: 'The Sound Architect',
    author: 'Marcus Chen',
    description: 'A deep-dive into the art and science of audio engineering, music production, and the technology behind great sound. Each week, host Marcus Chen interviews legendary producers, mastering engineers, and acoustic designers to uncover the secrets behind the recordings we love. From Abbey Road to modern bedroom studios, no stone is left unturned.',
    artworkUrl: '/api/cover/podcast-1',
    feedUrl: 'https://feeds.soundarchitect.example.com/rss',
    genre: 'Music',
    category: 'Audio Engineering',
    language: 'English',
    rating: 'clean',
    episodeCount: 187,
    subscribed: true,
    autoDownload: true,
    newEpisodeCount: 2,
    lastChecked: '2026-08-12T00:30:00Z',
    itunesId: 1536000001,
    averageDuration: 2820,
  },
  {
    id: 'podcast-2',
    title: 'Jazz Stories',
    author: 'Diana Washington',
    description: 'Weekly conversations with jazz musicians, historians, and record collectors that bring the rich history of jazz to life. Diana Washington — a veteran NPR correspondent and lifelong jazz enthusiast — weaves together personal anecdotes, rare recordings, and expert commentary to create an immersive listening experience that spans from New Orleans brass bands to the avant-garde.',
    artworkUrl: '/api/cover/podcast-2',
    feedUrl: 'https://feeds.jazzstories.example.com/rss',
    genre: 'Music',
    category: 'Jazz',
    language: 'English',
    rating: 'clean',
    episodeCount: 324,
    subscribed: true,
    autoDownload: false,
    newEpisodeCount: 1,
    lastChecked: '2026-08-12T01:00:00Z',
    itunesId: 1536000002,
    averageDuration: 2400,
  },
  {
    id: 'podcast-3',
    title: 'Tech Unboxed',
    author: 'Anya Sharma & Liam O\'Brien',
    description: 'A weekly podcast covering consumer technology, gadgets, and the intersection of tech and daily life. Anya and Liam bring honest reviews, industry analysis, and a healthy dose of skepticism to the world of consumer electronics. Special focus on audio gear, smartphones, and emerging display technologies.',
    artworkUrl: '/api/cover/podcast-3',
    feedUrl: 'https://feeds.techunboxed.example.com/rss',
    genre: 'Technology',
    category: 'Consumer Tech',
    language: 'English',
    rating: 'clean',
    episodeCount: 412,
    subscribed: true,
    autoDownload: true,
    newEpisodeCount: 3,
    lastChecked: '2026-08-11T22:00:00Z',
    itunesId: 1536000003,
    averageDuration: 3360,
  },
  {
    id: 'podcast-4',
    title: 'Composition Workshop',
    author: 'Dr. Elias Richter',
    description: 'A masterclass in musical composition for aspiring and working composers. Dr. Richter — whose works have been performed by the Berlin Philharmonic and the London Sinfonietta — breaks down compositional techniques, orchestration secrets, and the creative process behind contemporary classical and film music.',
    artworkUrl: '/api/cover/podcast-4',
    feedUrl: 'https://feeds.compositionworkshop.example.com/rss',
    genre: 'Education',
    category: 'Music Theory',
    language: 'English',
    rating: 'clean',
    episodeCount: 96,
    subscribed: false,
    autoDownload: false,
    newEpisodeCount: 0,
    lastChecked: '2026-08-10T12:00:00Z',
    itunesId: 1536000004,
    averageDuration: 3600,
  },
  {
    id: 'podcast-5',
    title: 'Vinyl Revival',
    author: 'Sam & Pete',
    description: 'Two record store owners celebrate the vinyl renaissance. Each episode features a deep listening session, interviews with pressing plant engineers and indie label founders, album reviews, and discussions about the culture of physical media in the streaming age.',
    artworkUrl: '/api/cover/podcast-5',
    feedUrl: 'https://feeds.vinylrevival.example.com/rss',
    genre: 'Music',
    category: 'Vinyl / Physical Media',
    language: 'English',
    rating: 'explicit',
    episodeCount: 245,
    subscribed: true,
    autoDownload: false,
    newEpisodeCount: 0,
    lastChecked: '2026-08-11T18:00:00Z',
    itunesId: 1536000005,
    averageDuration: 2700,
  },
  {
    id: 'podcast-6',
    title: 'The Frequency',
    author: 'Zara Nakamura',
    description: 'An ambient audio documentary series exploring soundscapes from around the world. Each episode immerses listeners in the sounds of a specific place — from Tokyo subway stations to Icelandic hot springs to Brazilian rainforests — layered with field recordings, interviews, and original music.',
    artworkUrl: '/api/cover/podcast-6',
    feedUrl: 'https://feeds.thefrequency.example.com/rss',
    genre: 'Society & Culture',
    category: 'Audio Documentary',
    language: 'English',
    rating: 'clean',
    episodeCount: 78,
    subscribed: false,
    autoDownload: false,
    newEpisodeCount: 0,
    lastChecked: '2026-08-09T10:00:00Z',
    itunesId: 1536000006,
    averageDuration: 2400,
  },
];

// ─── MOCK EPISODES ───

export const podcastEpisodes: PodcastEpisode[] = [
  // The Sound Architect
  { id: 'ep-1-1', showId: 'podcast-1', title: 'The Art of Mastering: A Conversation with Bob Ludwig', description: 'Bob Ludwig has mastered albums for Led Zeppelin, Bruce Springsteen, and Radiohead. In this episode, he shares his philosophy on loudness, dynamic range, and why the "loudness wars" may finally be over.', showNotes: 'Show notes and links: https://soundarchitect.example.com/ep187\n\nTopics:\n- The evolution of mastering from vinyl to digital\n- Why dynamic range matters more than loudness\n- Stories behind classic mastering sessions\n- Current trends in Hi-Res audio mastering', artworkUrl: '/api/cover/podcast-1', audioUrl: 'https://audio.soundarchitect.example.com/ep187.mp3', duration: 2940, publishDate: '2026-08-11T10:00:00Z', fileSize: 73500000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: false, resumePosition: 845, completed: false, favorite: false, season: 3, episodeNumber: 12 },
  { id: 'ep-1-2', showId: 'podcast-1', title: 'Building a Home Studio: Acoustics on a Budget', description: 'Acoustic treatment doesn\'t have to cost a fortune. Marcus walks through practical, affordable approaches to taming room modes, reflections, and bass buildup in a typical home listening or mixing environment.', showNotes: 'Resources mentioned in this episode:\n- REW (Room EQ Wizard) - free room analysis software\n- DIY bass trap plans\n- Recommended budget treatment products', artworkUrl: '/api/cover/podcast-1', audioUrl: 'https://audio.soundarchitect.example.com/ep186.mp3', duration: 2700, publishDate: '2026-08-04T10:00:00Z', fileSize: 67500000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 3, episodeNumber: 11 },
  { id: 'ep-1-3', showId: 'podcast-1', title: 'The LP Cutting Room: Inside Abbey Road', description: 'A rare behind-the-scenes visit to the vinyl cutting rooms at Abbey Road Studios. Engineer Sean Magee demonstrates the art of cutting lacquer masters and explains why vinyl still matters in 2026.', showNotes: '', artworkUrl: '/api/cover/podcast-1', audioUrl: 'https://audio.soundarchitect.example.com/ep185.mp3', duration: 2880, publishDate: '2026-07-28T10:00:00Z', fileSize: 72000000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: true, resumePosition: 2880, completed: true, favorite: true, season: 3, episodeNumber: 10 },
  { id: 'ep-1-4', showId: 'podcast-1', title: 'DSD vs PCM: The Great Format Debate', description: 'Is DSD inherently superior to PCM, or is it marketing? Marcus breaks down the mathematics, the psychoacoustics, and the practical realities of both formats with guests from the engineering teams at Sony and dCS.', showNotes: '', artworkUrl: '/api/cover/podcast-1', audioUrl: 'https://audio.soundarchitect.example.com/ep184.mp3', duration: 3120, publishDate: '2026-07-21T10:00:00Z', fileSize: 78000000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 3120, completed: true, favorite: false, season: 3, episodeNumber: 9 },
  { id: 'ep-1-5', showId: 'podcast-1', title: 'Headphone Amps: Why Your DAC Isn\'t Enough', description: 'Not all headphone outputs are created equal. This episode explores the importance of dedicated headphone amplifiers, impedance matching, and how to choose the right amp for your headphones.', showNotes: '', artworkUrl: '/api/cover/podcast-1', audioUrl: 'https://audio.soundarchitect.example.com/ep183.mp3', duration: 2580, publishDate: '2026-07-14T10:00:00Z', fileSize: 64500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 2580, completed: true, favorite: false, season: 3, episodeNumber: 8 },

  // Jazz Stories
  { id: 'ep-2-1', showId: 'podcast-2', title: 'Kind of Blue at 65: Still the Perfect Album', description: 'It\'s been 65 years since Miles Davis and his band walked into Columbia\'s 30th Street Studios and changed music forever. Diana examines why Kind of Blue remains the best-selling jazz album of all time and what made those sessions so magical.', showNotes: '', artworkUrl: '/api/cover/podcast-2', audioUrl: 'https://audio.jazzstories.example.com/ep324.mp3', duration: 2520, publishDate: '2026-08-10T09:00:00Z', fileSize: 63000000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 5, episodeNumber: 24 },
  { id: 'ep-2-2', showId: 'podcast-2', title: 'The Women of Blue Note: Rediscovered Voices', description: 'The stories of pianist Linda September, trombonist Melba Liston, and other overlooked women who shaped the Blue Note label\'s sound in the 1950s and 60s.', showNotes: '', artworkUrl: '/api/cover/podcast-2', audioUrl: 'https://audio.jazzstories.example.com/ep323.mp3', duration: 2280, publishDate: '2026-08-03T09:00:00Z', fileSize: 57000000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: true, resumePosition: 2280, completed: true, favorite: true, season: 5, episodeNumber: 23 },
  { id: 'ep-2-3', showId: 'podcast-2', title: 'Live at the Vanguard: 90 Years of the Village Vanguard', description: 'The Village Vanguard has been the heartbeat of live jazz in New York since 1935. Diana traces the club\'s history through the recordings that captured its unique acoustic space.', showNotes: '', artworkUrl: '/api/cover/podcast-2', audioUrl: 'https://audio.jazzstories.example.com/ep322.mp3', duration: 2760, publishDate: '2026-07-27T09:00:00Z', fileSize: 69000000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 2760, completed: true, favorite: false, season: 5, episodeNumber: 22 },
  { id: 'ep-2-4', showId: 'podcast-2', title: 'ECM Records: The Sound of Silence', description: 'How ECM Records created a genre-defying sound that\'s equal parts jazz, classical, and ambient. With founder Manfred Eicher and engineer Jan Erik Kongshaug.', showNotes: '', artworkUrl: '/api/cover/podcast-2', audioUrl: 'https://audio.jazzstories.example.com/ep321.mp3', duration: 2640, publishDate: '2026-07-20T09:00:00Z', fileSize: 66000000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 5, episodeNumber: 21 },

  // Tech Unboxed
  { id: 'ep-3-1', showId: 'podcast-3', title: 'DSP Review: The State of Wireless Audio in 2026', description: 'A comprehensive review of the latest wireless audio codecs — LC3plus, aptX Lossless, and Sony\'s new LDMC — with blind listening test results and analysis of which ones actually matter for different use cases.', showNotes: 'Blind test methodology and results available at: https://techunboxed.example.com/wireless-audio-2026', artworkUrl: '/api/cover/podcast-3', audioUrl: 'https://audio.techunboxed.example.com/ep412.mp3', duration: 3480, publishDate: '2026-08-09T14:00:00Z', fileSize: 87000000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: false, resumePosition: 1220, completed: false, favorite: false, season: 8, episodeNumber: 8 },
  { id: 'ep-3-2', showId: 'podcast-3', title: 'Roon vs Audirvana vs DSP: Which Server is Right for You?', description: 'A head-to-head comparison of the three leading music server platforms for audiophiles. Liam tests metadata handling, DSP capabilities, multi-room performance, and streaming integrations.', showNotes: '', artworkUrl: '/api/cover/podcast-3', audioUrl: 'https://audio.techunboxed.example.com/ep411.mp3', duration: 3600, publishDate: '2026-08-02T14:00:00Z', fileSize: 90000000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: false, resumePosition: 0, completed: false, favorite: true, season: 8, episodeNumber: 7 },
  { id: 'ep-3-3', showId: 'podcast-3', title: 'Smart Speakers Are Getting Good: Sonos Era 300 Deep Dive', description: 'The latest generation of smart speakers finally delivers audiophile-acceptable sound quality. Anya spends two weeks with the Sonos Era 300 and reports back with measurements and subjective impressions.', showNotes: '', artworkUrl: '/api/cover/podcast-3', audioUrl: 'https://audio.techunboxed.example.com/ep410.mp3', duration: 2820, publishDate: '2026-07-26T14:00:00Z', fileSize: 70500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 2820, completed: true, favorite: false, season: 8, episodeNumber: 6 },

  // Composition Workshop
  { id: 'ep-4-1', showId: 'podcast-4', title: 'Orchestration Secrets: Writing for Strings', description: 'Dr. Richter explores the art of writing for string sections — from basic voicing techniques to advanced divisi writing and harmonics. Includes examples from Ravel, Barber, and contemporary film scores.', showNotes: 'Score excerpts referenced: https://compositionworkshop.example.com/strings', artworkUrl: '/api/cover/podcast-4', audioUrl: 'https://audio.compositionworkshop.example.com/ep96.mp3', duration: 3900, publishDate: '2026-08-07T08:00:00Z', fileSize: 97500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 2, episodeNumber: 24 },
  { id: 'ep-4-2', showId: 'podcast-4', title: 'Minimalism Explained: From Glass to Nils Frahm', description: 'A historical and technical overview of musical minimalism. Dr. Richter traces the genre from its roots in Cage and Riley through Glass, Reich, and into the modern ambient/minimal crossover.', showNotes: '', artworkUrl: '/api/cover/podcast-4', audioUrl: 'https://audio.compositionworkshop.example.com/ep95.mp3', duration: 3720, publishDate: '2026-07-31T08:00:00Z', fileSize: 93000000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 3720, completed: true, favorite: true, season: 2, episodeNumber: 23 },

  // Vinyl Revival
  { id: 'ep-5-1', showId: 'podcast-5', title: 'Pressing Plants Under Pressure: Can Supply Meet Demand?', description: 'The vinyl boom has created a backlog of 6-12 months at pressing plants worldwide. Sam visits United Record Pressing in Nashville to see how the industry is coping and whether quality is suffering.', showNotes: '', artworkUrl: '/api/cover/podcast-5', audioUrl: 'https://audio.vinylrevival.example.com/ep245.mp3', duration: 2580, publishDate: '2026-08-08T12:00:00Z', fileSize: 64500000, format: 'MP3', bitrate: 128, isDownloaded: true, isPlayed: true, resumePosition: 2580, completed: true, favorite: false, season: 5, episodeNumber: 1 },
  { id: 'ep-5-2', showId: 'podcast-5', title: 'The 10 Best Audiophile Pressings of 2026 (So Far)', description: 'Sam and Pete count down their picks for the year\'s best-sounding vinyl releases, including a surprise entry from a hip-hop debut album that was cut from all-analog tape.', showNotes: '', artworkUrl: '/api/cover/podcast-5', audioUrl: 'https://audio.vinylrevival.example.com/ep244.mp3', duration: 2820, publishDate: '2026-08-01T12:00:00Z', fileSize: 70500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 4, episodeNumber: 48 },
  { id: 'ep-5-3', showId: 'podcast-5', title: 'How to Store Your Records: Humidity, Temperature, and Shelving', description: 'Practical advice from a conservation expert on the proper storage conditions for vinyl records to prevent warping, mold, and premature wear.', showNotes: '', artworkUrl: '/api/cover/podcast-5', audioUrl: 'https://audio.vinylrevival.example.com/ep243.mp3', duration: 2340, publishDate: '2026-07-25T12:00:00Z', fileSize: 58500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 2340, completed: true, favorite: false, season: 4, episodeNumber: 47 },

  // The Frequency
  { id: 'ep-6-1', showId: 'podcast-6', title: 'The Sounds of a Tokyo Morning', description: 'An immersive audio documentary capturing the layered soundscape of a Tokyo neighborhood from 4 AM to 10 AM — the first trains, street vendors, temple bells, school bells, and the gradual crescendo of the world\'s largest metropolis.', showNotes: 'Recorded over 5 days in Nakano, Tokyo.\nEquipment: Sennheiser AMBEO VR mic, Sound Devices MixPre-6', artworkUrl: '/api/cover/podcast-6', audioUrl: 'https://audio.thefrequency.example.com/ep78.mp3', duration: 2700, publishDate: '2026-08-05T07:00:00Z', fileSize: 67500000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: false, resumePosition: 0, completed: false, favorite: false, season: 2, episodeNumber: 12 },
  { id: 'ep-6-2', showId: 'podcast-6', title: 'Iceland: Geothermal Echoes', description: 'The otherworldly sounds of Iceland\'s geothermal areas — hissing steam vents, bubbling mud pots, and the eerie resonance of lava tube caves — interwoven with interviews with local sound artists.', showNotes: '', artworkUrl: '/api/cover/podcast-6', audioUrl: 'https://audio.thefrequency.example.com/ep77.mp3', duration: 2280, publishDate: '2026-07-29T07:00:00Z', fileSize: 57000000, format: 'MP3', bitrate: 128, isDownloaded: false, isPlayed: true, resumePosition: 2280, completed: true, favorite: true, season: 2, episodeNumber: 11 },
];

// ─── MOCK ITUNES SEARCH RESULTS ───

export const iTunesSearchResults: ITunesSearchResult[] = [
  { id: 'itunes-1', title: 'Song Exploder', author: 'Hrishikesh Hirway', artworkUrl: '/api/cover/itunes-1', genre: 'Music', episodeCount: 380, description: 'Musicians take apart their songs, and piece by piece, tell the story of how they were made.' },
  { id: 'itunes-2', title: 'The Audiophile Voice', author: 'John Darko', artworkUrl: '/api/cover/itunes-2', genre: 'Music', episodeCount: 220, description: 'Exploring the intersection of high-end audio equipment and the music that makes it sing.' },
  { id: 'itunes-3', title: 'Switched On Pop', author: 'Nate Sloan & Charlie Harding', artworkUrl: '/api/cover/itunes-3', genre: 'Music', episodeCount: 450, description: 'The music podcast that joins pop music and pop culture. Each episode, musicians and songwriters break down their biggest hits.' },
  { id: 'itunes-4', title: '20KHz', author: 'Defective Records', artworkUrl: '/api/cover/itunes-4', genre: 'Music', episodeCount: 156, description: 'Stories about music and audio production told through conversations with artists, producers, and engineers.' },
  { id: 'itunes-5', title: 'The Third Story', author: 'Leo Sidran', artworkUrl: '/api/cover/itunes-5', genre: 'Music', episodeCount: 310, description: 'A podcast about the creative process. Conversations with musicians, artists, writers, and filmmakers.' },
  { id: 'itunes-6', title: 'Radio OS', author: 'BBC Radio 3', artworkUrl: '/api/cover/itunes-6', genre: 'Classical', episodeCount: 890, description: 'Weekly new music and experimental sound from the world\'s leading contemporary composers.' },
  { id: 'itunes-7', title: 'Discovering Music', author: 'BBC Radio 3', artworkUrl: '/api/cover/itunes-7', genre: 'Education', episodeCount: 520, description: 'Accessible introductions to classical music masterworks, composers, and performance practice.' },
  { id: 'itunes-8', title: 'Decoder Ring', author: 'Slate', artworkUrl: '/api/cover/itunes-8', genre: 'Society & Culture', episodeCount: 280, description: 'Decoder Ring explores the cultural histories and hidden meanings behind pop culture phenomena.' },
];

// ─── PODCAST HELPER FUNCTIONS ───

export function getEpisodesByShow(showId: string): PodcastEpisode[] {
  return podcastEpisodes
    .filter(ep => ep.showId === showId)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export function getUnplayedEpisodes(showId: string): PodcastEpisode[] {
  return getEpisodesByShow(showId).filter(ep => !ep.isPlayed && !ep.completed);
}

export function getInProgressEpisodes(): PodcastEpisode[] {
  return podcastEpisodes.filter(ep => !ep.completed && ep.resumePosition > 0);
}

export function getDownloadedEpisodes(): PodcastEpisode[] {
  return podcastEpisodes.filter(ep => ep.isDownloaded);
}

export function getAllNewEpisodes(): PodcastEpisode[] {
  return podcastEpisodes.filter(ep => !ep.isPlayed && !ep.completed);
}

export function getSubscribedShows(): PodcastShow[] {
  return podcastShows.filter(s => s.subscribed);
}

export function searchPodcasts(query: string): { shows: PodcastShow[]; episodes: PodcastEpisode[]; iTunes: ITunesSearchResult[] } {
  const q = query.toLowerCase();
  return {
    shows: podcastShows.filter(s => s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
    episodes: podcastEpisodes.filter(ep => ep.title.toLowerCase().includes(q) || ep.description.toLowerCase().includes(q)),
    iTunes: iTunesSearchResults.filter(r => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)),
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.numeric !== date.year ? 'numeric' : undefined });
}

export function formatRelativeTime(dateStr: string): string {
  return formatDate(dateStr);
}

export function formatEpisodeDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
