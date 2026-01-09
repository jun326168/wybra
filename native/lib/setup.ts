import { colors } from "./colors";

export const PHOTO_BLUR_AMOUNT = 15;

export const COLOR_OPTIONS = [
  { id: 'cyber_blue', value: '#64D2FF' },
  { id: 'sakura_pink', value: '#D499B9' },
  { id: 'concrete_gray', value: '#9E9E9E' },
  { id: 'taro_orange', value: '#C4A796' },
  { id: 'mustard_yellow', value: '#E3C567' },
  { id: 'midnight_blue', value: '#6B8EAD' },
  { id: 'rust_red', value: '#D98E73' },
  { id: 'matcha_green', value: '#9CBFA7' },
  { id: 'wybra_fog', value: '#A5A6F6' },
  { id: 'dark', value: colors.background },
];

export const GENERATION_OPTIONS = [
  { label: 'Gen α', value: 'gen_alpha' },
  { label: 'Gen Z', value: 'gen_z' },
  { label: 'Gen Y', value: 'gen_y' },
  { label: 'Gen X', value: 'gen_x' },
  { label: 'Time Traveler', value: 'time_traveler' },
];

export const getGeneration = (year: number) => {
  if (year >= 2010) return 'gen_alpha';
  if (year >= 1997) return 'gen_z';
  if (year >= 1981) return 'gen_y';
  if (year >= 1965) return 'gen_x';
  return 'time_traveler';
};

export const MBTI_OPTIONS = [
  { label: '尚未解析', value: 'UNKNOWN', description: '保持神秘，讓對方來探索' },
  // 2. The Introverts (I人 - 核心用戶)
  { label: 'INTJ (建築師)', value: 'INTJ', description: '富想像力的策略家' },
  { label: 'INTP (思想家)', value: 'INTP', description: '渴望知識的發明家' },
  { label: 'INFJ (提倡者)', value: 'INFJ', description: '安靜神秘的理想主義者' },
  { label: 'INFP (調停者)', value: 'INFP', description: '溫柔且富有詩意' },
  { label: 'ISTJ (調查員)', value: 'ISTJ', description: '注重事實，可靠務實' },
  { label: 'ISFJ (守護者)', value: 'ISFJ', description: '專注溫暖的守護者' },
  { label: 'ISTP (鑑賞家)', value: 'ISTP', description: '大膽實際的實驗家' },
  { label: 'ISFP (探險家)', value: 'ISFP', description: '靈活迷人的藝術家' },
  // 3. The Extroverts (E人 - 潛在用戶)
  { label: 'ENTJ (指揮官)', value: 'ENTJ', description: '大膽果斷的領導者' },
  { label: 'ENTP (辯論家)', value: 'ENTP', description: '機智好奇的挑戰者' },
  { label: 'ENFJ (主人公)', value: 'ENFJ', description: '激勵人心的領導者' },
  { label: 'ENFP (競選者)', value: 'ENFP', description: '熱情且充滿創意' },
  { label: 'ESTJ (監督者)', value: 'ESTJ', description: '出色的管理者' },
  { label: 'ESFJ (執政官)', value: 'ESFJ', description: '極度熱心的照顧者' },
  { label: 'ESTP (企業家)', value: 'ESTP', description: '聰明且充滿活力' },
  { label: 'ESFP (表演者)', value: 'ESFP', description: '精力充沛的開心果' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: '男生' },
  { value: 'female', label: '女生' },
];

export const ORIENTATION_OPTIONS = [
  { value: 'heterosexual', label: '異性' },
  { value: 'homosexual', label: '同性' },
  { value: 'bisexual', label: '雙性' },
  { value: 'questioning', label: '探索中' },
];

export const LOOKING_FOR_OPTIONS = [
  { 
    value: 'romantic', 
    label: '尋找浪漫',
    description: '探索未知的引力軌道'
  },
  { 
    value: 'random', 
    label: '尋找共鳴',
    description: '只想遇見懂我的頻率'
  },
  { 
    value: 'team', 
    label: '尋找隊友',
    description: '擁有共同興趣與喜好'
  },
];

export const INTEREST_TAGS = [
  // 1. 娛樂與內容 (Entertainment)
  { id: 'movie', label: '#電影' },
  { id: 'music', label: '#音樂' },
  { id: 'gaming', label: '#遊戲' },
  { id: 'anime', label: '#動漫' },
  { id: 'drama', label: '#追劇' },
  { id: 'reading', label: '#閱讀' },

  // 2. 生活與飲食 (Lifestyle)
  { id: 'foodie', label: '#美食' },
  { id: 'cooking', label: '#烹飪' },
  { id: 'sleep', label: '#睡覺' }, // I 人最愛
  { id: 'sports', label: '#運動' },
  { id: 'fitness', label: '#健身' },

  // 3. 毛孩與自然 (Nature & Pets)
  { id: 'outdoor', label: '#戶外' }, // 露營/爬山
  { id: 'walk', label: '#散步' }, // 取代 Night Walk
  { id: 'travel', label: '#旅行' },

  // 4. 技能與創造 (Creativity & Tech)
  { id: 'tech', label: '#科技' },
  { id: 'coding', label: '#寫作' }, // 或是 #程式
  { id: 'design', label: '#設計' },
  { id: 'art', label: '#藝術' },
  { id: 'photo', label: '#攝影' },
  { id: 'science', label: '#科學' },
];

// CATEGORY 1: ATMOSPHERE & TEXTURE (80+ words)
const PREFIXES = [
  // Colors & Light
  "Indigo", "Azure", "Cobalt", "Slate", "Obsidian", "Ivory", "Amber", "Crimson", "Violet", "Cyan",
  "Noir", "Silver", "Chrome", "Rusty", "Golden", "Neon", "Pale", "Dark", "Dim", "Bright",
  // Weather & Nature
  "Misty", "Hazy", "Foggy", "Rainy", "Stormy", "Windy", "Snowy", "Frosty", "Solar", "Lunar",
  "Stellar", "Cosmic", "Void", "Ethereal", "Tidal", "Arctic", "Tropical", "Alpine", "Desert", "Oceanic",
  // Tech & Urban
  "Analog", "Digital", "Cyber", "Glitch", "Static", "Pixel", "Retro", "Modern", "Metro", "Urban",
  "Concrete", "Asphalt", "Laser", "Radio", "Magnetic", "Electric", "Virtual", "Binary", "Quantum", "Nano",
  // Emotion & State
  "Quiet", "Silent", "Loud", "Muted", "Numb", "Dizzy", "Lucid", "Vivid", "Hollow", "Empty",
  "Lonely", "Solo", "Idle", "Busy", "Lazy", "Deep", "Shallow", "Heavy", "Light", "Slow",
  // Texture & Abstract
  "Velvet", "Silk", "Paper", "Glass", "Soft", "Hard", "Rough", "Smooth", "Sharp", "Blurry",
  "Lost", "Found", "Hidden", "Secret", "Unknown", "Public", "Private", "Open", "Closed", "Blank",
  "Zen", "Chaos", "Wild", "Tame", "Free", "Safe", "Raw", "Pure", "Toxic", "Clean"
];

// CATEGORY 2: ENTITIES & OBJECTS (80+ words)
const SUFFIXES = [
  // Roles & People
  "Drifter", "Walker", "Runner", "Diver", "Flyer", "Pilot", "Driver", "Rider", "Surfer", "Gamer",
  "Coder", "Artist", "Writer", "Poet", "Monk", "Ninja", "Samurai", "Knight", "Wizard", "Ghost",
  // Spirits & Beings
  "Phantom", "Specter", "Spirit", "Soul", "Shadow", "Demon", "Angel", "Robot", "Android", "Cyborg",
  "Alien", "Human", "Person", "Stranger", "Guest", "Host", "User", "Admin", "System", "Bot",
  // Animals (The "Cool" Ones)
  "Moth", "Owl", "Fox", "Wolf", "Bear", "Cat", "Koi", "Crow", "Raven", "Swan",
  "Deer", "Snake", "Dragon", "Tiger", "Lion", "Eagle", "Hawk", "Bat", "Rat", "Mouse",
  // Objects & Tech
  "Radio", "TV", "Screen", "Phone", "Disc", "Tape", "Vinyl", "Book", "Pen", "Key",
  "Lock", "Box", "Bag", "Map", "Compass", "Radar", "Sonar", "Sensor", "Signal", "Noise",
  // Nature & Elements
  "Cloud", "Rain", "Snow", "Wind", "Fire", "Water", "Ice", "Leaf", "Tree", "Flower",
  "Rose", "Lily", "Cactus", "Fern", "Moss", "Stone", "Rock", "Sand", "Dust", "Ash",
  // Abstract Concepts
  "Dream", "Memory", "Thought", "Idea", "Logic", "Data", "Code", "Sound", "Music", "Song",
  "Loop", "Echo", "Vibe", "Mood", "Zone", "Room", "Space", "Time", "Era", "Mode"
];

export function generateCallsign(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  
  // OPTIONAL: Add a "Version Number" only 30% of the time to add variety
  // This looks like sci-fi versions, not "User123"
  const useVariant = Math.random() > 0.7;
  let variant = "";
  
  if (useVariant) {
    const variants = ["_v1", "_v2", ".X", ".01", "_99", "_404", "Box", "Lab", "HQ"];
    variant = variants[Math.floor(Math.random() * variants.length)];
  }

  return `${prefix}${suffix}${variant}`;
}