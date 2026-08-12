// ─── Metadata & Discovery Data for Sections 6 & 7 ───
// Classical music, Radio stations, Editorial content, Streaming services

import { getCoverGradient } from './data';

// ═══════════════════════════════════════════
// CLASSICAL MUSIC
// ═══════════════════════════════════════════

export interface Composer {
  id: string;
  name: string;
  nameFull: string; // e.g., "Ludwig van Beethoven"
  born: string;
  died?: string;
  period: string; // "Classical", "Romantic", "Baroque", "Modern", etc.
  nationality: string;
  imageUrl: string;
  bio: string;
  works: string[]; // Work IDs
  portrait?: string;
  similarComposers: string[];
}

export interface Work {
  id: string;
  title: string;
  titleFull: string; // e.g., "Symphony No. 9 in D minor, Op. 125"
  composerId: string;
  composerName: string;
  catalogNumber?: string; // Op., BWV, K., etc.
  genre: string; // "Symphony", "Concerto", "Sonata", "String Quartet", etc.
  key: string; // "D minor", "C major", etc.
  yearComposed?: number;
  yearFirstPerformed?: number;
  movements: Movement[];
  duration: number; // total seconds
  recordings: WorkRecording[];
  description?: string;
}

export interface Movement {
  number: number;
  title: string;
  tempoMarking: string; // "Allegro", "Andante", etc.
  key?: string;
  duration: number;
}

export interface WorkRecording {
  id: string;
  workId: string;
  performers: string[]; // artist IDs
  performerNames: string[];
  conductor?: string;
  orchestra?: string;
  albumId: string;
  albumName: string;
  year: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  label: string;
  rating: number;
}

// ═══════════════════════════════════════════
// RADIO STATIONS
// ═══════════════════════════════════════════

export interface RadioStation {
  id: string;
  name: string;
  description: string;
  genre: string;
  country: string;
  streamUrl: string;
  codec: string;
  bitrate: number;
  sampleRate: number;
  logoUrl: string;
  isFavorite: boolean;
  tags: string[];
  website?: string;
}

// ═══════════════════════════════════════════
// EDITORIAL CONTENT
// ═══════════════════════════════════════════

export interface EditorialCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'new-releases' | 'genre-primer' | 'best-of' | 'curated' | 'staff-picks' | 'on-this-day';
  coverUrl: string;
  curator?: string;
  trackIds: string[];
  albumIds: string[];
  tags: string[];
  publishedAt: string;
  featured: boolean;
}

export interface GenreDetail {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  moods: string[];
  relatedGenres: string[];
  topArtists: string[];
  essentialAlbums: string[];
  editorialCollections: string[];
  origins?: string;
  characteristics?: string;
}

// ═══════════════════════════════════════════
// STREAMING SERVICES
// ═══════════════════════════════════════════

export interface StreamingService {
  id: string;
  name: string;
  logoUrl: string;
  maxQuality: string;
  maxSampleRate: number;
  maxBitDepth: number;
  supportsDSD: boolean;
  supportsMQA: boolean;
  catalogSize: string;
  oauthUrl: string;
  linked: boolean;
  linkedAccount?: string;
  linkedSince?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline';
  features: string[];
  color: string;
}

export interface StreamingTrack {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  albumName: string;
  artistName: string;
  albumArtistName: string;
  duration: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  isAvailable: boolean;
  isRegionRestricted: boolean;
  quality: string;
  artworkUrl: string;
  composerIds?: string[];
  genre: string;
  trackNumber: number;
  year: number;
  label: string;
}

// ═══════════════════════════════════════════
// FANCY SEARCH
// ═══════════════════════════════════════════

export interface FuzzySearchResult {
  artists: Array<{ id: string; name: string; type: string; score: number }>;
  albums: Array<{ id: string; title: string; artistName: string; score: number }>;
  tracks: Array<{ id: string; title: string; artistName: string; albumName: string; score: number }>;
  composers: Array<{ id: string; name: string; period: string; score: number }>;
  works: Array<{ id: string; title: string; composerName: string; score: number }>;
  credits: Array<{ name: string; role: string; trackId: string; trackTitle: string; score: number }>;
  radioStations: Array<{ id: string; name: string; genre: string; score: number }>;
  genres: Array<{ id: string; name: string; score: number }>;
}

// ─── MOCK DATA: COMPOSERS ───

export const composers: Composer[] = [
  {
    id: 'comp-1',
    name: 'Beethoven',
    nameFull: 'Ludwig van Beethoven',
    born: '1770, Bonn, Germany',
    died: '1827, Vienna, Austria',
    period: 'Classical / Romantic',
    nationality: 'German',
    imageUrl: `/api/cover/comp-1`,
    bio: 'Ludwig van Beethoven remains one of the most admired composers in the history of Western music. His works span the transition from the Classical to the Romantic period and form the cornerstone of the orchestral, chamber, and piano repertoire. Beethoven composed in all major genres of his time, including nine symphonies, five piano concertos, one violin concerto, thirty-two piano sonatas, and sixteen string quartets. His deafness, which began in his late twenties and progressed to near-total loss by 1814, profoundly shaped his later compositions, infusing them with a depth of emotion and structural innovation that continues to move audiences worldwide.',
    works: ['work-1', 'work-2', 'work-3'],
    similarComposers: ['comp-2', 'comp-3', 'comp-4'],
  },
  {
    id: 'comp-2',
    name: 'Mozart',
    nameFull: 'Wolfgang Amadeus Mozart',
    born: '1756, Salzburg, Austria',
    died: '1791, Vienna, Austria',
    period: 'Classical',
    nationality: 'Austrian',
    imageUrl: `/api/cover/comp-2`,
    bio: 'Wolfgang Amadeus Mozart was a prolific and influential composer of the Classical period. Despite his short life — he died at just 35 — Mozart composed over 600 works, including symphonies, concertos, operas, chamber music, and piano sonatas of extraordinary beauty and structural perfection. His music is celebrated for its melodic invention, formal elegance, and emotional range, from the exuberant joy of his operas to the profound depth of his Requiem.',
    works: ['work-4', 'work-5'],
    similarComposers: ['comp-1', 'comp-4', 'comp-5'],
  },
  {
    id: 'comp-3',
    name: 'Bach',
    nameFull: 'Johann Sebastian Bach',
    born: '1685, Eisenach, Germany',
    died: '1750, Leipzig, Germany',
    period: 'Baroque',
    nationality: 'German',
    imageUrl: `/api/cover/comp-3`,
    bio: 'Johann Sebastian Bach was a master of counterpoint, harmony, and fugal writing whose works are regarded as the pinnacle of the Baroque era. His compositions, ranging from the Brandenburg Concertos and Goldberg Variations to the Mass in B minor and The Well-Tempered Clavier, demonstrate unparalleled technical mastery and deep spiritual expression. Bach\'s influence on subsequent composers — from Mozart and Beethoven to Chopin and Shostakovich — cannot be overstated.',
    works: ['work-6', 'work-7'],
    similarComposers: ['comp-4', 'comp-5', 'comp-1'],
  },
  {
    id: 'comp-4',
    name: 'Chopin',
    nameFull: 'Frederic Chopin',
    born: '1810, Zelazowa Wola, Poland',
    died: '1849, Paris, France',
    period: 'Romantic',
    nationality: 'Polish-French',
    imageUrl: `/api/cover/comp-4`,
    bio: 'Frederic Chopin was a Polish-French composer and virtuoso pianist of the Romantic era who wrote primarily for solo piano. His works, which include mazurkas, waltzes, nocturnes, polonaises, etudes, impromptus, scherzos, preludes, sonatas, and two piano concertos, are renowned for their lyrical beauty, technical demands, and harmonic innovation. Chopin\'s music remains central to the piano repertoire and is performed more frequently than that of any other composer for the instrument.',
    works: ['work-8', 'work-9'],
    similarComposers: ['comp-1', 'comp-5', 'comp-2'],
  },
  {
    id: 'comp-5',
    name: 'Debussy',
    nameFull: 'Claude Debussy',
    born: '1862, Saint-Germain-en-Laye, France',
    died: '1918, Paris, France',
    period: 'Impressionist / Modern',
    nationality: 'French',
    imageUrl: `/api/cover/comp-5`,
    bio: 'Claude Debussy was a French composer whose innovative use of harmony, color, and form marked a turning point in the history of Western music. Often associated with Impressionism (though he rejected the term), Debussy\'s music is characterized by its evocative atmospheres, flowing modal melodies, and imaginative orchestration. Key works include Prélude à l\'après-midi d\'un faune, La Mer, and his piano collections such as Clair de lune and the two books of Préludes.',
    works: ['work-10'],
    similarComposers: ['comp-4', 'comp-2', 'comp-6'],
  },
  {
    id: 'comp-6',
    name: 'Mahler',
    nameFull: 'Gustav Mahler',
    born: '1860, Kalischt, Bohemia',
    died: '1911, Vienna, Austria',
    period: 'Late Romantic',
    nationality: 'Austro-Bohemian',
    imageUrl: `/api/cover/comp-6`,
    bio: 'Gustav Mahler was an Austro-Bohemian late-Romantic composer and one of the leading conductors of his generation. His symphonies — vast in scale, emotionally intense, and incorporating voices, folk melodies, and extra-musical narratives — are among the most ambitious and deeply personal works in the orchestral repertoire. Mahler\'s music, once considered excessive and difficult, is now celebrated for its raw emotional power and philosophical depth.',
    works: ['work-11'],
    similarComposers: ['comp-1', 'comp-2', 'comp-3'],
  },
];

// ─── MOCK DATA: WORKS ───

export const works: Work[] = [
  {
    id: 'work-1',
    title: 'Symphony No. 9',
    titleFull: 'Symphony No. 9 in D minor, Op. 125 "Choral"',
    composerId: 'comp-1',
    composerName: 'Ludwig van Beethoven',
    catalogNumber: 'Op. 125',
    genre: 'Symphony',
    key: 'D minor',
    yearComposed: 1824,
    yearFirstPerformed: 1824,
    duration: 3840,
    description: 'Beethoven\'s Ninth Symphony is one of the most celebrated works in all of classical music. Its final movement, setting Schiller\'s "Ode to Joy" for soloists and chorus, has become a universal symbol of human solidarity and has been performed at momentous occasions worldwide. The symphony represents the culmination of Beethoven\'s symphonic output and pushes the boundaries of form, duration, and emotional expression.',
    movements: [
      { number: 1, title: 'Allegro ma non troppo, un poco maestoso', tempoMarking: 'Allegro', key: 'D minor', duration: 920 },
      { number: 2, title: 'Scherzo: Molto vivace', tempoMarking: 'Molto vivace', key: 'D minor', duration: 720 },
      { number: 3, title: 'Adagio molto e cantabile', tempoMarking: 'Adagio', key: 'B-flat major', duration: 900 },
      { number: 4, title: 'Presto / "Ode to Joy"', tempoMarking: 'Presto', key: 'D major', duration: 1300 },
    ],
    recordings: [
      {
        id: 'wr-1a', workId: 'work-1',
        performers: ['artist-2'], performerNames: ['The Meridian Ensemble'],
        conductor: 'Elias Richter', orchestra: 'The Meridian Ensemble',
        albumId: 'album-2', albumName: 'Silent Architecture', year: 2022,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Deutsche Grammophon', rating: 9,
      },
      {
        id: 'wr-1b', workId: 'work-1',
        performers: [], performerNames: ['Berlin Philharmonic'],
        conductor: 'Herbert von Karajan', orchestra: 'Berlin Philharmonic',
        albumId: 'album-bee-9', albumName: 'Beethoven: The Nine Symphonies', year: 1963,
        format: 'FLAC', sampleRate: 96, bitDepth: 24,
        label: 'Deutsche Grammophon', rating: 10,
      },
    ],
  },
  {
    id: 'work-2',
    title: 'Moonlight Sonata',
    titleFull: 'Piano Sonata No. 14 in C-sharp minor, Op. 27 No. 2 "Moonlight"',
    composerId: 'comp-1',
    composerName: 'Ludwig van Beethoven',
    catalogNumber: 'Op. 27 No. 2',
    genre: 'Sonata',
    key: 'C-sharp minor',
    yearComposed: 1801,
    duration: 900,
    description: 'The Moonlight Sonata is among Beethoven\'s most beloved piano works. Its first movement, with its hypnotic triplet ostinato and haunting melody, is one of the most immediately recognizable pieces in all of classical music. The contrasting movements — a graceful Allegretto and a ferocious Presto agitato — demonstrate Beethoven\'s mastery of emotional contrast and formal innovation.',
    movements: [
      { number: 1, title: 'Adagio sostenuto', tempoMarking: 'Adagio sostenuto', key: 'C-sharp minor', duration: 360 },
      { number: 2, title: 'Allegretto', tempoMarking: 'Allegretto', key: 'D-flat major', duration: 120 },
      { number: 3, title: 'Presto agitato', tempoMarking: 'Presto agitato', key: 'C-sharp minor', duration: 420 },
    ],
    recordings: [
      {
        id: 'wr-2a', workId: 'work-2',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        albumId: 'album-6', albumName: 'Cartas al Silencio', year: 2021,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Harmonia Mundi', rating: 9,
      },
    ],
  },
  {
    id: 'work-3',
    title: 'Symphony No. 5',
    titleFull: 'Symphony No. 5 in C minor, Op. 67',
    composerId: 'comp-1',
    composerName: 'Ludwig van Beethoven',
    catalogNumber: 'Op. 67',
    genre: 'Symphony',
    key: 'C minor',
    yearComposed: 1808,
    duration: 2040,
    description: 'Perhaps the most famous symphony ever written, Beethoven\'s Fifth opens with the iconic four-note motif that has become synonymous with fate knocking at the door. The symphony\'s journey from C minor struggle to C major triumph established a narrative arc that would influence composers for generations.',
    movements: [
      { number: 1, title: 'Allegro con brio', tempoMarking: 'Allegro con brio', key: 'C minor', duration: 420 },
      { number: 2, title: 'Andante con moto', tempoMarking: 'Andante con moto', key: 'A-flat major', duration: 600 },
      { number: 3, title: 'Scherzo: Allegro', tempoMarking: 'Allegro', key: 'C minor', duration: 360 },
      { number: 4, title: 'Allegro', tempoMarking: 'Allegro', key: 'C major', duration: 660 },
    ],
    recordings: [
      {
        id: 'wr-3a', workId: 'work-3',
        performers: [], performerNames: ['Vienna Philharmonic'],
        conductor: 'Carlos Kleiber', orchestra: 'Vienna Philharmonic',
        albumId: 'album-bee-5', albumName: 'Beethoven: Symphonies 5 & 7', year: 1974,
        format: 'FLAC', sampleRate: 96, bitDepth: 24,
        label: 'Deutsche Grammophon', rating: 10,
      },
    ],
  },
  {
    id: 'work-4',
    title: 'Requiem in D minor',
    titleFull: 'Requiem in D minor, K. 626',
    composerId: 'comp-2',
    composerName: 'Wolfgang Amadeus Mozart',
    catalogNumber: 'K. 626',
    genre: 'Choral',
    key: 'D minor',
    yearComposed: 1791,
    duration: 3120,
    description: 'Mozart\'s Requiem is one of the most powerful and mysterious works in the choral repertoire. Left unfinished at the time of his death, the Requiem was completed by his student Franz Xaver Sussmayr. Its dramatic intensity, from the terrifying Dies Irae to the serene Lacrimosa, has made it one of the most performed and recorded choral works in existence.',
    movements: [
      { number: 1, title: 'Requiem aeternam', tempoMarking: 'Adagio', duration: 300 },
      { number: 2, title: 'Kyrie eleison', tempoMarking: 'Allegro', duration: 180 },
      { number: 3, title: 'Dies Irae', tempoMarking: 'Allegro', duration: 540 },
      { number: 4, title: 'Tuba mirum', tempoMarking: 'Andante', duration: 300 },
      { number: 5, title: 'Rex tremendae', tempoMarking: 'Andante', duration: 180 },
      { number: 6, title: 'Lacrimosa', tempoMarking: 'Adagio', duration: 240 },
      { number: 7, title: 'Domine Jesu', tempoMarking: 'Andante', duration: 300 },
      { number: 8, title: 'Hostias', tempoMarking: 'Andante', duration: 180 },
      { number: 9, title: 'Communio: Lux aeterna', tempoMarking: 'Andante', duration: 300 },
    ],
    recordings: [
      {
        id: 'wr-4a', workId: 'work-4',
        performers: [], performerNames: ['Academy of St Martin in the Fields'],
        conductor: 'Neville Marriner', orchestra: 'Academy of St Martin in the Fields',
        albumId: 'album-moz-requiem', albumName: 'Mozart: Requiem', year: 1986,
        format: 'FLAC', sampleRate: 96, bitDepth: 24,
        label: 'Decca', rating: 9,
      },
    ],
  },
  {
    id: 'work-5',
    title: 'Piano Concerto No. 21',
    titleFull: 'Piano Concerto No. 21 in C major, K. 467',
    composerId: 'comp-2',
    composerName: 'Wolfgang Amadeus Mozart',
    catalogNumber: 'K. 467',
    genre: 'Concerto',
    key: 'C major',
    yearComposed: 1785,
    duration: 1920,
    description: 'Mozart\'s Piano Concerto No. 21 is one of his most popular and frequently performed concertos. The famously lyrical second movement, known as the "Elvira Madigan" Andante, is one of the most beautiful melodies in all of Mozart\'s output.',
    movements: [
      { number: 1, title: 'Allegro maestoso', tempoMarking: 'Allegro maestoso', key: 'C major', duration: 720 },
      { number: 2, title: 'Andante', tempoMarking: 'Andante', key: 'F major', duration: 480 },
      { number: 3, title: 'Allegro vivace assai', tempoMarking: 'Allegro vivace', key: 'C major', duration: 720 },
    ],
    recordings: [
      {
        id: 'wr-5a', workId: 'work-5',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        conductor: 'Claudio Abbado', orchestra: 'Mahler Chamber Orchestra',
        albumId: 'album-moz-21', albumName: 'Mozart: Piano Concertos', year: 2018,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Deutsche Grammophon', rating: 9,
      },
    ],
  },
  {
    id: 'work-6',
    title: 'Goldberg Variations',
    titleFull: 'Goldberg Variations, BWV 988',
    composerId: 'comp-3',
    composerName: 'Johann Sebastian Bach',
    catalogNumber: 'BWV 988',
    genre: 'Variations',
    key: 'G major',
    yearComposed: 1741,
    duration: 2400,
    description: 'Bach\'s Goldberg Variations is an aria with thirty variations, widely regarded as one of the most important works in the keyboard repertoire. The piece demonstrates Bach\'s mastery of canonic writing, counterpoint, and emotional expression, ranging from intimate meditation to virtuosic display.',
    movements: [
      { number: 1, title: 'Aria', tempoMarking: 'Adagio', key: 'G major', duration: 120 },
      { number: 2, title: 'Variation 1', tempoMarking: 'Allegro', duration: 60 },
      { number: 3, title: 'Variation 2', tempoMarking: 'Andante', duration: 60 },
      { number: 4, title: 'Variation 3 (Canon at the unison)', tempoMarking: 'Andante', duration: 90 },
      { number: 5, title: 'Variation 4', tempoMarking: 'Allegro', duration: 60 },
      { number: 6, title: 'Variation 5 (a 1 ovvero 2 clav.)', tempoMarking: 'Allegro', duration: 120 },
      { number: 7, title: 'Variation 6 (Canon at the second)', tempoMarking: 'Andante', duration: 90 },
      { number: 8, title: 'Variation 7 (al tempo di giga)', tempoMarking: 'Allegro', duration: 60 },
      { number: 9, title: 'Variation 8', tempoMarking: 'Allegro', duration: 60 },
      { number: 10, title: 'Variation 9 (Canon at the third)', tempoMarking: 'Andante', duration: 90 },
      { number: 11, title: 'Variation 10 (Fughetta)', tempoMarking: 'Allegro', duration: 90 },
      { number: 12, title: 'Variation 11', tempoMarking: 'Andante', duration: 60 },
      { number: 13, title: 'Variation 12 (Canon at the fourth)', tempoMarking: 'Andante', duration: 90 },
      { number: 14, title: 'Variation 13', tempoMarking: 'Adagio', duration: 120 },
      { number: 15, title: 'Variation 14 (Canon at the fifth)', tempoMarking: 'Allegro', duration: 90 },
      { number: 16, title: 'Variation 15 (Andante)', tempoMarking: 'Andante', duration: 90 },
      { number: 17, title: 'Variation 16 (Ouverture)', tempoMarking: 'Allegro', duration: 180 },
      { number: 18, title: 'Variation 17', tempoMarking: 'Allegro', duration: 60 },
      { number: 19, title: 'Variation 18 (Canon at the sixth)', tempoMarking: 'Andante', duration: 90 },
      { number: 20, title: 'Variation 19', tempoMarking: 'Allegro', duration: 60 },
      { number: 21, title: 'Variation 20', tempoMarking: 'Allegro', duration: 90 },
      { number: 22, title: 'Variation 21 (Canon at the seventh)', tempoMarking: 'Andante', duration: 90 },
      { number: 23, title: 'Variation 22 (alla breve)', tempoMarking: 'Allegro', duration: 60 },
      { number: 24, title: 'Variation 23', tempoMarking: 'Allegro', duration: 60 },
      { number: 25, title: 'Variation 24 (Canon at the octave)', tempoMarking: 'Andante', duration: 90 },
      { number: 26, title: 'Variation 25', tempoMarking: 'Adagio', duration: 180 },
      { number: 27, title: 'Variation 26', tempoMarking: 'Allegro', duration: 60 },
      { number: 28, title: 'Variation 27 (Canon at the ninth)', tempoMarking: 'Andante', duration: 90 },
      { number: 29, title: 'Variation 28', tempoMarking: 'Allegro', duration: 60 },
      { number: 30, title: 'Variation 29', tempoMarking: 'Allegro', duration: 60 },
      { number: 31, title: 'Quodlibet', tempoMarking: 'Allegro', duration: 120 },
      { number: 32, title: 'Aria da capo', tempoMarking: 'Adagio', key: 'G major', duration: 120 },
    ],
    recordings: [
      {
        id: 'wr-6a', workId: 'work-6',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        albumId: 'album-bach-gold', albumName: 'Bach: Goldberg Variations', year: 2020,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Harmonia Mundi', rating: 10,
      },
    ],
  },
  {
    id: 'work-7',
    title: 'Brandenburg Concerto No. 3',
    titleFull: 'Brandenburg Concerto No. 3 in G major, BWV 1048',
    composerId: 'comp-3',
    composerName: 'Johann Sebastian Bach',
    catalogNumber: 'BWV 1048',
    genre: 'Concerto',
    key: 'G major',
    yearComposed: 1721,
    duration: 660,
    description: 'The third of Bach\'s six Brandenburg Concertos is notable for its absence of a slow middle movement and its brilliant use of string orchestra. The work showcases Bach\'s contrapuntal mastery within the concerto grosso format.',
    movements: [
      { number: 1, title: 'Allegro', tempoMarking: 'Allegro', key: 'G major', duration: 300 },
      { number: 2, title: 'Adagio', tempoMarking: 'Adagio', key: 'G major', duration: 60 },
      { number: 3, title: 'Allegro', tempoMarking: 'Allegro', key: 'G major', duration: 300 },
    ],
    recordings: [
      {
        id: 'wr-7a', workId: 'work-7',
        performers: [], performerNames: ['The English Concert'],
        conductor: 'Trevor Pinnock', orchestra: 'The English Concert',
        albumId: 'album-bach-brand', albumName: 'Bach: Brandenburg Concertos', year: 2008,
        format: 'FLAC', sampleRate: 96, bitDepth: 24,
        label: 'Archiv Produktion', rating: 9,
      },
    ],
  },
  {
    id: 'work-8',
    title: 'Nocturne Op. 9 No. 2',
    titleFull: 'Nocturne in E-flat major, Op. 9 No. 2',
    composerId: 'comp-4',
    composerName: 'Frederic Chopin',
    catalogNumber: 'Op. 9 No. 2',
    genre: 'Nocturne',
    key: 'E-flat major',
    yearComposed: 1832,
    duration: 270,
    description: 'Chopin\'s Nocturne Op. 9 No. 2 is perhaps his most universally recognized piece. Its elegant, singing melody over flowing arpeggiated accompaniment has made it a staple of piano repertoire and popular culture alike.',
    movements: [
      { number: 1, title: 'Nocturne', tempoMarking: 'Andante', key: 'E-flat major', duration: 270 },
    ],
    recordings: [
      {
        id: 'wr-8a', workId: 'work-8',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        albumId: 'album-chop-noct', albumName: 'Chopin: Nocturnes', year: 2019,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Harmonia Mundi', rating: 9,
      },
    ],
  },
  {
    id: 'work-9',
    title: 'Ballade No. 1',
    titleFull: 'Ballade No. 1 in G minor, Op. 23',
    composerId: 'comp-4',
    composerName: 'Frederic Chopin',
    catalogNumber: 'Op. 23',
    genre: 'Ballade',
    key: 'G minor',
    yearComposed: 1835,
    duration: 540,
    description: 'Chopin\'s first Ballade is a single-movement work of epic scope and emotional power. Its narrative character, combining lyrical themes with brilliant passagework, has made it one of his most admired large-scale piano compositions.',
    movements: [
      { number: 1, title: 'Ballade', tempoMarking: 'Largo / Allegro', key: 'G minor', duration: 540 },
    ],
    recordings: [
      {
        id: 'wr-9a', workId: 'work-9',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        albumId: 'album-chop-ballades', albumName: 'Chopin: The Four Ballades', year: 2022,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Harmonia Mundi', rating: 9,
      },
    ],
  },
  {
    id: 'work-10',
    title: 'Clair de Lune',
    titleFull: 'Clair de Lune (from Suite bergamasque, L. 75)',
    composerId: 'comp-5',
    composerName: 'Claude Debussy',
    catalogNumber: 'L. 75',
    genre: 'Piano Suite',
    key: 'D-flat major',
    yearComposed: 1890,
    duration: 300,
    description: 'Clair de Lune is the third movement of Debussy\'s Suite bergamasque and one of the most beloved piano pieces ever written. Its shimmering, impressionistic textures evoke moonlight with extraordinary sensitivity, capturing the essence of the Paul Verlaine poem that inspired it.',
    movements: [
      { number: 1, title: 'Clair de Lune', tempoMarking: 'Andante', key: 'D-flat major', duration: 300 },
    ],
    recordings: [
      {
        id: 'wr-10a', workId: 'work-10',
        performers: ['artist-6'], performerNames: ['Isabella Reyes'],
        albumId: 'album-deb-clair', albumName: 'Debussy: Piano Works', year: 2021,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Harmonia Mundi', rating: 9,
      },
    ],
  },
  {
    id: 'work-11',
    title: 'Symphony No. 5',
    titleFull: 'Symphony No. 5 in C-sharp minor',
    composerId: 'comp-6',
    composerName: 'Gustav Mahler',
    genre: 'Symphony',
    key: 'C-sharp minor',
    yearComposed: 1902,
    duration: 4200,
    description: 'Mahler\'s Fifth Symphony marks a turning point in his output, moving from the vocal symphonies of his earlier period to a purely instrumental idiom. The famous Adagietto, with its tender string writing, has become one of the most emotionally charged movements in the orchestral repertoire.',
    movements: [
      { number: 1, title: 'Trauermarsch', tempoMarking: 'Allegro', key: 'C-sharp minor', duration: 900 },
      { number: 2, title: 'Sturmisch bewegt', tempoMarking: 'Allegro', key: 'A minor', duration: 780 },
      { number: 3, title: 'Scherzo', tempoMarking: 'Allegro', key: 'D major', duration: 780 },
      { number: 4, title: 'Adagietto', tempoMarking: 'Adagietto', key: 'F major', duration: 540 },
      { number: 5, title: 'Rondo-Finale', tempoMarking: 'Allegro', key: 'D major', duration: 1200 },
    ],
    recordings: [
      {
        id: 'wr-11a', workId: 'work-11',
        performers: [], performerNames: ['Berlin Philharmonic'],
        conductor: 'Claudio Abbado', orchestra: 'Berlin Philharmonic',
        albumId: 'album-mah-5', albumName: 'Mahler: Symphony No. 5', year: 2004,
        format: 'FLAC', sampleRate: 192, bitDepth: 24,
        label: 'Deutsche Grammophon', rating: 10,
      },
    ],
  },
];

// ─── MOCK DATA: RADIO STATIONS ───

export const radioStations: RadioStation[] = [
  {
    id: 'radio-1', name: 'BBC Radio 3', description: 'Classical music and culture from the BBC', genre: 'Classical',
    country: 'United Kingdom', streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_three',
    codec: 'AAC', bitrate: 320, sampleRate: 44100, logoUrl: '/api/cover/radio-1',
    isFavorite: true, tags: ['classical', 'public-radio', 'live-concerts'], website: 'https://www.bbc.co.uk/radio3',
  },
  {
    id: 'radio-2', name: 'KCRW', description: 'Eclectic mix of independent music, NPR news, and cultural programming',
    genre: 'Eclectic', country: 'United States', streamUrl: 'https://kcrw.streamguys1.com/kcrw_192k_mp3_e24',
    codec: 'MP3', bitrate: 192, sampleRate: 44100, logoUrl: '/api/cover/radio-2',
    isFavorite: false, tags: ['indie', 'eclectic', 'npr'], website: 'https://www.kcrw.com',
  },
  {
    id: 'radio-3', name: 'FIP Radio', description: 'An eclectic and refined musical journey curated by French public radio',
    genre: 'Eclectic', country: 'France', streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-3',
    isFavorite: true, tags: ['eclectic', 'world', 'jazz', 'electronic'], website: 'https://www.radiofrance.fr/fip',
  },
  {
    id: 'radio-4', name: 'WKCR', description: 'Columbia University radio - jazz, classical, and hip-hop',
    genre: 'Jazz', country: 'United States', streamUrl: 'https://stream.zeno.fm/rqzf6y8tzzquv',
    codec: 'AAC', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-4',
    isFavorite: false, tags: ['jazz', 'classical', 'hip-hop', 'university'],
  },
  {
    id: 'radio-5', name: 'Radio Swiss Jazz', description: 'The best of jazz, 24 hours a day, from Switzerland',
    genre: 'Jazz', country: 'Switzerland', streamUrl: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-5',
    isFavorite: true, tags: ['jazz', 'smooth-jazz', '24-7'],
  },
  {
    id: 'radio-6', name: 'NTS Radio', description: 'London-based community radio with eclectic music programming',
    genre: 'Eclectic', country: 'United Kingdom', streamUrl: 'https://stream-sawa.edge-apps.net/extreme/nts_1',
    codec: 'AAC', bitrate: 192, sampleRate: 44100, logoUrl: '/api/cover/radio-6',
    isFavorite: false, tags: ['eclectic', 'underground', 'electronic', 'world', 'experimental'],
  },
  {
    id: 'radio-7', name: 'Classic FM', description: 'The UK\'s only national classical music station',
    genre: 'Classical', country: 'United Kingdom', streamUrl: 'https://media-ice.musicradio.com/ClassicFMMP3',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-7',
    isFavorite: false, tags: ['classical', 'popular-classical', 'relaxing'],
  },
  {
    id: 'radio-8', name: 'SomaFM Groove Salad', description: 'A nicely chilled plate of ambient/downtempo beats and grooves',
    genre: 'Ambient', country: 'United States', streamUrl: 'https://ice2.somafm.com/groovesalad-128-mp3',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-8',
    isFavorite: true, tags: ['ambient', 'downtempo', 'chill', 'electronic'],
  },
  {
    id: 'radio-9', name: 'Radio Paradise', description: 'Eclectic mix of rock, pop, electronic, and world music',
    genre: 'Eclectic', country: 'United States', streamUrl: 'https://stream.radioparadise.com/mp3-192',
    codec: 'MP3', bitrate: 192, sampleRate: 44100, logoUrl: '/api/cover/radio-9',
    isFavorite: false, tags: ['eclectic', 'rock', 'world', 'electronic'],
  },
  {
    id: 'radio-10', name: 'Concertzender', description: 'Dutch public radio for classical, contemporary, and world music',
    genre: 'Classical', country: 'Netherlands', streamUrl: 'https://streams.greenhost.nl:443/cz_live',
    codec: 'OGG', bitrate: 192, sampleRate: 48000, logoUrl: '/api/cover/radio-10',
    isFavorite: false, tags: ['classical', 'contemporary', 'world', 'experimental'],
  },
  {
    id: 'radio-11', name: 'KEXP', description: 'Seattle\'s premier independent radio station for alternative music',
    genre: 'Alternative', country: 'United States', streamUrl: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-11',
    isFavorite: true, tags: ['alternative', 'indie', 'rock', 'local'],
  },
  {
    id: 'radio-12', name: 'Deutschlandfunk Kultur', description: 'German public radio featuring culture, classical, and contemporary music',
    genre: 'Classical', country: 'Germany', streamUrl: 'https://st01.dlf.de/dlf/01/128/mp3/stream.mp3',
    codec: 'MP3', bitrate: 128, sampleRate: 44100, logoUrl: '/api/cover/radio-12',
    isFavorite: false, tags: ['classical', 'culture', 'public-radio', 'german'],
  },
];

// ─── MOCK DATA: EDITORIAL COLLECTIONS ───

export const editorialCollections: EditorialCollection[] = [
  {
    id: 'ed-1',
    title: 'New Releases This Week',
    subtitle: 'Fresh arrivals in your library',
    description: 'The latest albums and singles added to the DSP catalog this week, spanning jazz, electronic, classical, and world music. Each release has been carefully selected for its sonic quality and artistic merit.',
    type: 'new-releases',
    coverUrl: '/api/cover/ed-1',
    curator: 'DSP Editorial',
    trackIds: ['track-3-1', 'track-3-2', 'track-4-1', 'track-8-1', 'track-11-1'],
    albumIds: ['album-3', 'album-4', 'album-8', 'album-11'],
    tags: ['new', 'fresh', 'weekly'],
    publishedAt: '2026-08-11T10:00:00Z',
    featured: true,
  },
  {
    id: 'ed-2',
    title: 'A Jazz Primer',
    subtitle: 'Essential recordings for the jazz curious',
    description: 'From the smoky clubs of 1950s New York to the vibrant scenes of modern London and Stockholm, this collection traces the evolution of jazz through its most influential recordings. Whether you are a newcomer or a lifelong fan, these albums represent the art form at its finest.',
    type: 'genre-primer',
    coverUrl: '/api/cover/ed-2',
    curator: 'DSP Editorial',
    trackIds: ['track-1-1', 'track-1-4', 'track-8-2', 'track-8-5'],
    albumIds: ['album-1', 'album-8'],
    tags: ['jazz', 'primer', 'essential'],
    publishedAt: '2026-07-15T08:00:00Z',
    featured: true,
  },
  {
    id: 'ed-3',
    title: 'Best of 2026 (So Far)',
    subtitle: 'The standout recordings of the year',
    description: 'Halfway through 2026, these are the recordings that have defined the year in audio excellence. From breathtaking audiophile pressings to genre-defying masterworks, these albums represent the pinnacle of recorded music in the current era.',
    type: 'best-of',
    coverUrl: '/api/cover/ed-3',
    curator: 'DSP Editorial',
    trackIds: ['track-3-4', 'track-4-1', 'track-5-1', 'track-1-6'],
    albumIds: ['album-3', 'album-4', 'album-5', 'album-1'],
    tags: ['best-of', '2026', 'yearly'],
    publishedAt: '2026-07-01T09:00:00Z',
    featured: true,
  },
  {
    id: 'ed-4',
    title: 'Analog Warmth: The Best of Vinyl Rips',
    subtitle: 'Digitized from the finest pressings',
    description: 'These recordings have been carefully digitized from original vinyl pressings using the highest-quality ADC equipment. Each capture preserves the analog warmth and character that vinyl enthusiasts cherish, presented here in hi-res FLAC for the closest possible approximation of the original experience.',
    type: 'curated',
    coverUrl: '/api/cover/ed-4',
    curator: 'DSP Audiophile Team',
    trackIds: ['track-1-3', 'track-8-4', 'track-9-2'],
    albumIds: ['album-1', 'album-8', 'album-9'],
    tags: ['vinyl', 'analog', 'audiophile'],
    publishedAt: '2026-06-20T12:00:00Z',
    featured: false,
  },
  {
    id: 'ed-5',
    title: 'Electronic Soundscapes',
    subtitle: 'Ambient, IDM, and experimental electronic',
    description: 'Explore the outer reaches of electronic music with this curated journey through ambient textures, intricate IDM rhythms, and experimental sound design. These recordings showcase the genre at its most immersive and emotionally resonant, perfect for deep listening on a high-fidelity system.',
    type: 'curated',
    coverUrl: '/api/cover/ed-5',
    curator: 'DSP Editorial',
    trackIds: ['track-3-3', 'track-3-5', 'track-7-1', 'track-7-4', 'track-12-1'],
    albumIds: ['album-3', 'album-7', 'album-12'],
    tags: ['electronic', 'ambient', 'experimental'],
    publishedAt: '2026-08-01T14:00:00Z',
    featured: true,
  },
  {
    id: 'ed-6',
    title: 'Staff Picks: August 2026',
    subtitle: 'What the DSP team is listening to',
    description: 'Our team of music enthusiasts and audio engineers share their personal favorites this month. From rediscovered gems to brand-new releases, these are the recordings that have been soundtracking our lives this August.',
    type: 'staff-picks',
    coverUrl: '/api/cover/ed-6',
    curator: 'DSP Team',
    trackIds: ['track-2-1', 'track-6-2', 'track-10-3', 'track-11-4'],
    albumIds: ['album-2', 'album-6', 'album-10', 'album-11'],
    tags: ['staff-picks', 'monthly', 'personal'],
    publishedAt: '2026-08-05T10:00:00Z',
    featured: false,
  },
  {
    id: 'ed-7',
    title: 'On This Day: August 12',
    subtitle: 'Notable releases and historical moments',
    description: 'Today in music history: the day reminds us of landmark recordings, legendary performances, and pivotal moments in the evolution of recorded music. Revisit the albums that made history on this date.',
    type: 'on-this-day',
    coverUrl: '/api/cover/ed-7',
    curator: 'DSP Archive',
    trackIds: ['track-5-3', 'track-9-1'],
    albumIds: ['album-5', 'album-9'],
    tags: ['on-this-day', 'history', 'anniversary'],
    publishedAt: '2026-08-12T00:00:00Z',
    featured: false,
  },
  {
    id: 'ed-8',
    title: 'Classical Essentials',
    subtitle: 'A beginner\'s guide to the classical canon',
    description: 'An accessible entry point into the vast world of classical music. This collection features the most beloved and historically significant compositions, performed by legendary musicians and captured in the highest possible audio quality.',
    type: 'genre-primer',
    coverUrl: '/api/cover/ed-8',
    curator: 'DSP Classical Editor',
    trackIds: [],
    albumIds: ['album-2', 'album-6'],
    tags: ['classical', 'primer', 'essential', 'beginner'],
    publishedAt: '2026-05-01T08:00:00Z',
    featured: true,
  },
  {
    id: 'ed-9',
    title: 'Nordic Noir: Scandinavian Jazz & Beyond',
    subtitle: 'The sound of the North',
    description: 'From the fjords of Norway to the islands of Sweden, Scandinavian artists have created a distinctive sound world that blends jazz, folk, electronic, and ambient music into something entirely their own. This collection captures the essence of Nordic musical identity.',
    type: 'curated',
    coverUrl: '/api/cover/ed-9',
    curator: 'DSP Editorial',
    trackIds: ['track-1-1', 'track-1-5', 'track-12-2', 'track-9-3'],
    albumIds: ['album-1', 'album-12', 'album-9'],
    tags: ['nordic', 'scandinavian', 'jazz', 'folk'],
    publishedAt: '2026-07-10T11:00:00Z',
    featured: false,
  },
  {
    id: 'ed-10',
    title: 'World Music Crossroads',
    subtitle: 'Where traditions meet innovation',
    description: 'Music that transcends borders and blends traditions from across the globe. From West African rhythms fused with jazz harmony to Catalan art-pop and Afrobeat grooves, these recordings celebrate the creative power of cultural exchange.',
    type: 'curated',
    coverUrl: '/api/cover/ed-10',
    curator: 'DSP World Music Editor',
    trackIds: ['track-4-3', 'track-4-7', 'track-10-1', 'track-11-2'],
    albumIds: ['album-4', 'album-10', 'album-11'],
    tags: ['world', 'fusion', 'cross-cultural'],
    publishedAt: '2026-06-15T09:00:00Z',
    featured: false,
  },
];

// ─── MOCK DATA: GENRE DETAILS ───

export const genreDetails: GenreDetail[] = [
  {
    id: 'gd-1',
    name: 'Jazz',
    description: 'Jazz is a music genre that originated in the African-American communities of New Orleans in the late 19th and early 20th centuries. Rooted in blues and ragtime, jazz is characterized by swing and blue notes, complex chords, call and response vocals, polyrhythms, and improvisation. Over its century-long history, jazz has spawned dozens of subgenres, from bebop and cool jazz to fusion and nu-jazz, and continues to evolve as a living art form.',
    imageUrl: '/api/cover/gd-1',
    moods: ['relaxed', 'sophisticated', 'improvisational', 'soulful', 'energetic'],
    relatedGenres: ['Neo-Soul', 'Fusion', 'Contemporary Classical'],
    topArtists: ['artist-1', 'artist-8', 'artist-4'],
    essentialAlbums: ['album-1', 'album-8'],
    editorialCollections: ['ed-2', 'ed-9'],
    origins: 'New Orleans, United States, early 20th century',
    characteristics: 'Improvisation, swing rhythm, complex harmony, blue notes, call and response',
  },
  {
    id: 'gd-2',
    name: 'Electronic',
    description: 'Electronic music encompasses a vast range of styles produced primarily using electronic instruments and technology. From the pioneering tape experiments of the 1950s to the digital sound design of today, electronic music has become one of the most diverse and innovative genres in modern music. Subgenres range from ambient and IDM to techno, house, and experimental electroacoustic music.',
    imageUrl: '/api/cover/gd-2',
    moods: ['futuristic', 'atmospheric', 'hypnotic', 'energetic', 'introspective'],
    relatedGenres: ['Ambient', 'IDM', 'Experimental'],
    topArtists: ['artist-3', 'artist-7', 'artist-10'],
    essentialAlbums: ['album-3', 'album-7'],
    editorialCollections: ['ed-5'],
    origins: 'Multiple origins: Germany (Kraftwerk), Jamaica (dub), USA (Moog synthesizer)',
    characteristics: 'Synthesized sounds, repetitive patterns, sound design, rhythm-based, technology-driven',
  },
  {
    id: 'gd-3',
    name: 'Contemporary Classical',
    description: 'Contemporary classical music refers to art music composed in the present day, drawing on the Western classical tradition while incorporating modern techniques, technologies, and cultural influences. From minimalism and spectralism to post-minimalism and electroacoustic music, contemporary composers continue to push the boundaries of what orchestral and chamber music can be.',
    imageUrl: '/api/cover/gd-3',
    moods: ['contemplative', 'ethereal', 'dramatic', 'meditative', 'complex'],
    relatedGenres: ['Ambient', 'Experimental', 'Classical'],
    topArtists: ['artist-2', 'artist-6', 'artist-12'],
    essentialAlbums: ['album-2', 'album-6'],
    editorialCollections: ['ed-8'],
    origins: 'Western art music tradition, evolving continuously from the 20th century',
    characteristics: 'Extended techniques, spectral harmony, minimalism, mixed media, unconventional forms',
  },
  {
    id: 'gd-4',
    name: 'Ambient',
    description: 'Ambient music is a genre of music that emphasizes tone and atmosphere over traditional musical structure or rhythm. Pioneered by Brian Eno in the 1970s, ambient music creates immersive sonic environments that can be both actively listened to and passively enjoyed. Modern ambient encompasses everything from gentle drone and field recording-based works to dark ambient and space music.',
    imageUrl: '/api/cover/gd-4',
    moods: ['peaceful', 'floating', 'immersive', 'meditative', 'cinematic'],
    relatedGenres: ['Electronic', 'Experimental', 'Contemporary Classical'],
    topArtists: ['artist-7', 'artist-9', 'artist-3'],
    essentialAlbums: ['album-7'],
    editorialCollections: ['ed-5'],
    origins: 'England, 1970s, pioneered by Brian Eno',
    characteristics: 'Tone and texture over melody, slow evolution, atmospheric, non-beat-driven, immersive',
  },
  {
    id: 'gd-5',
    name: 'Progressive Metal',
    description: 'Progressive metal combines the heavy, guitar-driven sound of metal with the complex compositional structures, odd time signatures, and conceptual ambition of progressive rock. Bands in this genre often feature extended song lengths, concept albums, virtuosic musicianship, and a willingness to incorporate elements from classical, jazz, and electronic music.',
    imageUrl: '/api/cover/gd-5',
    moods: ['powerful', 'epic', 'complex', 'intense', 'atmospheric'],
    relatedGenres: ['Post-Rock', 'Experimental'],
    topArtists: ['artist-5'],
    essentialAlbums: ['album-5'],
    editorialCollections: [],
    origins: 'Late 1980s, evolved from progressive rock and heavy metal',
    characteristics: 'Odd time signatures, extended compositions, concept albums, virtuosic musicianship',
  },
  {
    id: 'gd-6',
    name: 'Neo-Soul',
    description: 'Neo-soul is a genre of popular music that emerged in the 1990s as a revival of soul and R&B music with influences from jazz, funk, hip-hop, and electronic music. Characterized by smooth vocals, organic instrumentation, and socially conscious lyrics, neo-soul artists have brought sophistication and artistry back to mainstream R&B.',
    imageUrl: '/api/cover/gd-6',
    moods: ['warm', 'soulful', 'groovy', 'intimate', 'uplifting'],
    relatedGenres: ['Jazz', 'World', 'Electronic'],
    topArtists: ['artist-4'],
    essentialAlbums: ['album-4'],
    editorialCollections: ['ed-10'],
    origins: 'United States and United Kingdom, 1990s',
    characteristics: 'Live instrumentation, smooth vocals, jazz harmony, hip-hop rhythms, socially conscious lyrics',
  },
];

// ─── MOCK DATA: STREAMING SERVICES ───

export const streamingServices: StreamingService[] = [
  {
    id: 'svc-1',
    name: 'Tidal',
    logoUrl: '/api/cover/svc-1',
    maxQuality: 'Master (up to 24-bit/192kHz)',
    maxSampleRate: 192,
    maxBitDepth: 24,
    supportsDSD: false,
    supportsMQA: true,
    catalogSize: '100M+ tracks',
    oauthUrl: '/api/streaming/tidal/auth',
    linked: true,
    linkedAccount: 'musiclover@email.com',
    linkedSince: '2026-01-15',
    status: 'connected',
    features: ['HiRes FLAC', 'MQA', 'Dolby Atmos', 'Music Videos', 'Offline', 'Master Quality'],
    color: '#00FFFF',
  },
  {
    id: 'svc-2',
    name: 'Qobuz',
    logoUrl: '/api/cover/svc-2',
    maxQuality: 'Hi-Res (up to 24-bit/192kHz)',
    maxSampleRate: 192,
    maxBitDepth: 24,
    supportsDSD: false,
    supportsMQA: false,
    catalogSize: '80M+ tracks',
    oauthUrl: '/api/streaming/qobuz/auth',
    linked: true,
    linkedAccount: 'musiclover@email.com',
    linkedSince: '2026-03-22',
    status: 'connected',
    features: ['HiRes FLAC', 'Booklets', 'Liner Notes', 'Offline', 'CD-Quality'],
    color: '#5C6BC0',
  },
  {
    id: 'svc-3',
    name: 'Apple Music',
    logoUrl: '/api/cover/svc-3',
    maxQuality: 'Hi-Res Lossless (up to 24-bit/192kHz)',
    maxSampleRate: 192,
    maxBitDepth: 24,
    supportsDSD: false,
    supportsMQA: false,
    catalogSize: '100M+ tracks',
    oauthUrl: '/api/streaming/apple/auth',
    linked: false,
    status: 'disconnected',
    features: ['HiRes Lossless', 'Spatial Audio', 'Dolby Atmos', 'Music Videos', 'Offline', 'Radio'],
    color: '#FA233B',
  },
  {
    id: 'svc-4',
    name: 'Amazon Music HD',
    logoUrl: '/api/cover/svc-4',
    maxQuality: 'Ultra HD (up to 24-bit/192kHz)',
    maxSampleRate: 192,
    maxBitDepth: 24,
    supportsDSD: false,
    supportsMQA: false,
    catalogSize: '80M+ tracks',
    oauthUrl: '/api/streaming/amazon/auth',
    linked: false,
    status: 'disconnected',
    features: ['Ultra HD', '3D Audio', 'Offline', 'Spatial Audio'],
    color: '#25D1DA',
  },
];

// ─── MOCK DATA: STREAMING TRACKS (sample) ───

export const streamingTracks: StreamingTrack[] = [
  {
    id: 'st-1', serviceId: 'svc-1', serviceName: 'Tidal',
    title: 'Gymnopedie No. 1', albumName: 'Satie: Piano Works',
    artistName: 'Alexandre Tharaud', albumArtistName: 'Alexandre Tharaud',
    duration: 195, format: 'FLAC', sampleRate: 192, bitDepth: 24,
    isAvailable: true, isRegionRestricted: false, quality: 'Master',
    artworkUrl: '/api/cover/st-1', composerIds: ['comp-extra-1'], genre: 'Classical',
    trackNumber: 1, year: 2019, label: 'Erato',
  },
  {
    id: 'st-2', serviceId: 'svc-1', serviceName: 'Tidal',
    title: 'Nuvole Bianche', albumName: 'Una Mattina',
    artistName: 'Ludovico Einaudi', albumArtistName: 'Ludovico Einaudi',
    duration: 330, format: 'FLAC', sampleRate: 96, bitDepth: 24,
    isAvailable: true, isRegionRestricted: false, quality: 'HiFi',
    artworkUrl: '/api/cover/st-2', genre: 'Contemporary Classical',
    trackNumber: 5, year: 2004, label: 'Decca',
  },
  {
    id: 'st-3', serviceId: 'svc-2', serviceName: 'Qobuz',
    title: 'Rhapsody in Blue', albumName: 'Gershwin: Rhapsody in Blue, An American in Paris',
    artistName: 'Leonard Bernstein', albumArtistName: 'Leonard Bernstein / New York Philharmonic',
    duration: 1020, format: 'FLAC', sampleRate: 192, bitDepth: 24,
    isAvailable: true, isRegionRestricted: false, quality: 'Hi-Res',
    artworkUrl: '/api/cover/st-3', genre: 'Classical',
    trackNumber: 1, year: 1959, label: 'Sony Classical',
  },
  {
    id: 'st-4', serviceId: 'svc-1', serviceName: 'Tidal',
    title: 'Blue in Green', albumName: 'Kind of Blue',
    artistName: 'Miles Davis', albumArtistName: 'Miles Davis',
    duration: 327, format: 'FLAC', sampleRate: 96, bitDepth: 24,
    isAvailable: true, isRegionRestricted: false, quality: 'HiFi',
    artworkUrl: '/api/cover/st-4', genre: 'Jazz',
    trackNumber: 3, year: 1959, label: 'Columbia',
  },
  {
    id: 'st-5', serviceId: 'svc-2', serviceName: 'Qobuz',
    title: 'Weightless', albumName: 'Drone',
    artistName: 'Marconi Union', albumArtistName: 'Marconi Union',
    duration: 480, format: 'FLAC', sampleRate: 96, bitDepth: 24,
    isAvailable: true, isRegionRestricted: true, quality: 'Hi-Res',
    artworkUrl: '/api/cover/st-5', genre: 'Ambient',
    trackNumber: 1, year: 2011, label: 'Just Music',
  },
];

// ─── HELPER FUNCTIONS ───

export function formatRadioDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getComposerById(id: string): Composer | undefined {
  return composers.find(c => c.id === id);
}

export function getWorkById(id: string): Work | undefined {
  return works.find(w => w.id === id);
}

export function getWorksByComposer(composerId: string): Work[] {
  return works.filter(w => w.composerId === composerId);
}

export function getRadioStationById(id: string): RadioStation | undefined {
  return radioStations.find(r => r.id === id);
}

export function getGenreDetailByName(name: string): GenreDetail | undefined {
  return genreDetails.find(g => g.name === name);
}

export function getStreamingServiceById(id: string): StreamingService | undefined {
  return streamingServices.find(s => s.id === id);
}

export function getLinkedServices(): StreamingService[] {
  return streamingServices.filter(s => s.linked);
}

export function getStreamingTracksByService(serviceId: string): StreamingTrack[] {
  return streamingTracks.filter(t => t.serviceId === serviceId);
}

// ─── FUZZY SEARCH ───

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 100;
  if (q.includes(t)) return 80;
  // Check for all characters appearing in order
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  if (qi === q.length) return 60;
  const dist = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  return Math.max(0, Math.round((1 - dist / maxLen) * 50));
}

import { artists, albums, tracks } from './data';

export function fuzzySearch(query: string): FuzzySearchResult {
  if (query.length < 2) return {
    artists: [], albums: [], tracks: [], composers: [], works: [],
    credits: [], radioStations: [], genres: [],
  };

  const results: FuzzySearchResult = {
    artists: [],
    albums: [],
    tracks: [],
    composers: [],
    works: [],
    credits: [],
    radioStations: [],
    genres: [],
  };

  // Search artists
  for (const a of artists) {
    const score = Math.max(
      fuzzyMatch(query, a.name),
      fuzzyMatch(query, a.bio.substring(0, 100))
    );
    if (score > 20) results.artists.push({ id: a.id, name: a.name, type: a.type, score });
  }

  // Search albums
  for (const a of albums) {
    const score = Math.max(
      fuzzyMatch(query, a.title),
      fuzzyMatch(query, a.artistName),
      fuzzyMatch(query, a.label || '')
    );
    if (score > 20) results.albums.push({ id: a.id, title: a.title, artistName: a.artistName, score });
  }

  // Search tracks (including composers, performers, genres)
  for (const t of tracks) {
    const scores = [
      fuzzyMatch(query, t.title),
      fuzzyMatch(query, t.artistName),
      fuzzyMatch(query, t.albumName),
      fuzzyMatch(query, t.genre),
      ...t.composers.map(c => fuzzyMatch(query, c)),
      ...t.performers.map(p => fuzzyMatch(query, p.name)),
    ];
    const score = Math.max(...scores);
    if (score > 20) results.tracks.push({ id: t.id, title: t.title, artistName: t.artistName, albumName: t.albumName, score });
  }

  // Search composers
  for (const c of composers) {
    const score = Math.max(
      fuzzyMatch(query, c.name),
      fuzzyMatch(query, c.nameFull),
      fuzzyMatch(query, c.period)
    );
    if (score > 20) results.composers.push({ id: c.id, name: c.nameFull, period: c.period, score });
  }

  // Search works
  for (const w of works) {
    const score = Math.max(
      fuzzyMatch(query, w.title),
      fuzzyMatch(query, w.titleFull),
      fuzzyMatch(query, w.composerName),
      fuzzyMatch(query, w.genre),
      fuzzyMatch(query, w.catalogNumber || '')
    );
    if (score > 20) results.works.push({ id: w.id, title: w.title, composerName: w.composerName, score });
  }

  // Search credits (performers)
  for (const t of tracks) {
    for (const p of t.performers) {
      const score = Math.max(
        fuzzyMatch(query, p.name),
        fuzzyMatch(query, p.role),
        fuzzyMatch(query, p.instrument || '')
      );
      if (score > 20) results.credits.push({ name: p.name, role: p.role, trackId: t.id, trackTitle: t.title, score });
    }
  }

  // Search radio stations
  for (const r of radioStations) {
    const score = Math.max(
      fuzzyMatch(query, r.name),
      fuzzyMatch(query, r.genre),
      fuzzyMatch(query, r.description),
      ...r.tags.map(tag => fuzzyMatch(query, tag))
    );
    if (score > 20) results.radioStations.push({ id: r.id, name: r.name, genre: r.genre, score });
  }

  // Search genres
  for (const g of genreDetails) {
    const score = Math.max(
      fuzzyMatch(query, g.name),
      ...g.moods.map(m => fuzzyMatch(query, m))
    );
    if (score > 20) results.genres.push({ id: g.id, name: g.name, score });
  }

  // Sort all by score descending
  results.artists.sort((a, b) => b.score - a.score);
  results.albums.sort((a, b) => b.score - a.score);
  results.tracks.sort((a, b) => b.score - a.score);
  results.composers.sort((a, b) => b.score - a.score);
  results.works.sort((a, b) => b.score - a.score);
  results.credits.sort((a, b) => b.score - a.score);
  results.radioStations.sort((a, b) => b.score - a.score);
  results.genres.sort((a, b) => b.score - a.score);

  return results;
}

// ─── AUTO-CONTINUATION / RADIO ALGORITHM ───

export interface RadioSeed {
  type: 'track' | 'artist' | 'genre' | 'playlist';
  id: string;
  name: string;
}

export interface RadioStationGenerated {
  id: string;
  name: string;
  seed: RadioSeed;
  trackIds: string[];
  description: string;
}

export function generateRadio(seed: RadioSeed, count: number = 20): RadioStationGenerated {
  const allTracks = [...tracks];
  let pool: typeof tracks;

  if (seed.type === 'track') {
    const track = allTracks.find(t => t.id === seed.id);
    if (track) {
      pool = allTracks.filter(t =>
        t.id !== track.id &&
        (t.genre === track.genre || t.artistId === track.artistId || t.composers.some(c => track.composers.includes(c)))
      );
    } else {
      pool = allTracks;
    }
  } else if (seed.type === 'artist') {
    pool = allTracks.filter(t => t.artistId !== seed.id);
    // Mix in similar artists
    const artist = artists.find(a => a.id === seed.id);
    if (artist) {
      const similarTracks = allTracks.filter(t => artist.similarArtists.includes(t.artistId));
      pool = [...pool, ...similarTracks];
    }
  } else if (seed.type === 'genre') {
    pool = allTracks.filter(t => t.genre === seed.name);
  } else {
    pool = allTracks;
  }

  // Shuffle and take
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
  const trackIds = shuffled.map(t => t.id);

  return {
    id: `radio-gen-${Date.now()}`,
    name: seed.type === 'genre' ? `${seed.name} Radio` :
          seed.type === 'artist' ? `${seed.name} Radio` :
          seed.type === 'playlist' ? `${seed.name} Mix` : `${seed.name} Mix`,
    seed,
    trackIds,
    description: `Algorithmic radio seeded from ${seed.name}. Blending local library tracks based on genre, artist similarity, and listening patterns.`,
  };
}
