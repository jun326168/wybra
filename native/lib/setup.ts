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
    label: '尋找引力',
    description: '探索未知的浪漫軌道'
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
  { id: 'coffee', label: '#咖啡', value: 'Coffee' },
  { id: 'alcohol', label: '#小酌', value: 'Alcohol' }, // 適合微醺的氛圍
  { id: 'cooking', label: '#烹飪', value: 'Cooking' },
  { id: 'fashion', label: '#穿搭', value: 'Fashion' },
  { id: 'sleep', label: '#睡覺', value: 'Sleep' }, // I 人最愛
  { id: 'sports', label: '#運動', value: 'Sports' },
  { id: 'fitness', label: '#健身', value: 'Fitness' },

  // 3. 毛孩與自然 (Nature & Pets)
  { id: 'cat', label: '#貓派', value: 'Cat' },
  { id: 'dog', label: '#狗派', value: 'Dog' },
  { id: 'plant', label: '#植栽', value: 'Plants' },
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

  // 5. 靈魂與氛圍 (Vibe & Soul) - 這是 Wybra 的核心
  { id: 'deeptalk', label: '#深聊', value: 'DeepTalk' },
  { id: 'psych', label: '#心理', value: 'Psychology' }, // MBTI 愛好者
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