import { colors } from "./colors";

export const COLOR_OPTIONS = [
  { id: 'cyber_blue', value: '#3B82F6', label: '邏輯藍' }, // Cyber Blue
  { id: 'mystic_purple', value: '#8B5CF6', label: '神秘紫' }, // Neon Purple
  { id: 'hot_pink', value: '#EC4899', label: '熱情粉' }, // Hot Pink
  { id: 'sunset_orange', value: '#F97316', label: '餘暉橘' }, // Sunset Orange
  { id: 'gold_dust', value: '#EAB308', label: '星塵黃' }, // Gold Dust
  { id: 'crimson_red', value: '#EF4444', label: '警戒紅' }, // Crimson Red
  { id: 'aqua_cyan', value: '#06B6D4', label: '流動青' }, // Aqua Cyan
  { id: 'ghost_white', value: '#F8FAFC', label: '純粹白' }, // Ghost White
  { id: 'leaf_green', value: '#22C55E', label: '森之綠' }, // Leaf Green
  { id: 'dark', value: colors.background, label: '深色' },
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
  { id: 'movie', label: '#電影', value: 'Movie' },
  { id: 'music', label: '#音樂', value: 'Music' },
  { id: 'gaming', label: '#遊戲', value: 'Gaming' },
  { id: 'anime', label: '#動漫', value: 'Anime' },
  { id: 'drama', label: '#追劇', value: 'Drama' },
  { id: 'reading', label: '#閱讀', value: 'Reading' },

  // 2. 生活與飲食 (Lifestyle)
  { id: 'foodie', label: '#美食', value: 'Foodie' },
  { id: 'cooking', label: '#烹飪', value: 'Cooking' },
  { id: 'sleep', label: '#睡覺', value: 'Sleep' }, // I 人最愛
  { id: 'sports', label: '#運動', value: 'Sports' },
  { id: 'fitness', label: '#健身', value: 'Fitness' },

  // 3. 毛孩與自然 (Nature & Pets)
  { id: 'outdoor', label: '#戶外', value: 'Outdoor' }, // 露營/爬山
  { id: 'walk', label: '#散步', value: 'Walk' }, // 取代 Night Walk
  { id: 'travel', label: '#旅行', value: 'Travel' },

  // 4. 技能與創造 (Creativity & Tech)
  { id: 'tech', label: '#科技', value: 'Tech' },
  { id: 'coding', label: '#寫作', value: 'Coding' }, // 或是 #程式
  { id: 'design', label: '#設計', value: 'Design' },
  { id: 'art', label: '#藝術', value: 'Art' },
  { id: 'photo', label: '#攝影', value: 'Photo' },
  { id: 'science', label: '#科學', value: 'Science' },
];

const PREFIXES = [
  // Vibe: Quiet, Introvert, Space
  "Silent", "Hazy", "Neon", "Deep", "Lunar", 
  "Solar", "Drift", "Pale", "Quiet", "Lost", 
  "Void", "Cyber", "Muted", "Glitch", "Analog",
  "Hollow", "Faint", "Distant", "Cold", "Slow",
  "Zen", "Retro", "Static", "Numb", "Dark"
];

const SUFFIXES = [
  // Vibe: Tech, Nature, Entity
  "Ghost", "Walker", "Echo", "Signal", "Wave", 
  "Panda", "Cat", "Pilot", "Static", "Pixel", 
  "Shadow", "Cloud", "Star", "Rover", "Orbit",
  "Glitch", "Vibe", "Noise", "Dust", "Moon",
  "Nomad", "Unit", "System", "Error", "Mode"
];

export function generateCallsign(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  
  // Optional: Add a 2-digit number for uniqueness (e.g., "NeonGhost77")
  // Gen Z likes numbers that look like codes: 07, 99, 404, 88
  const randomNumber = Math.floor(Math.random() * 100); 
  const numberStr = randomNumber < 10 ? `0${randomNumber}` : `${randomNumber}`;

  // Format: PascalCase is cleaner for reading (e.g., SilentWalker07)
  return `${prefix}${suffix}${numberStr}`;
}