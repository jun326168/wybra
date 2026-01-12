// lib/ghost-wall.ts

/**
 * Strips all spaces/symbols to catch hidden patterns (used for Phone & Name only)
 * "0 9 1 2" -> "0912"
 */
const stripSymbols = (text: string) => text.replace(/[\s\-\.]/g, '').toLowerCase();

// --- PATTERN MATCHERS ---

/**
 * Detects Taiwan Mobile Numbers
 * Uses 'stripSymbols' so it catches "09 12..." even with spaces
 */
export const hasPhoneNumber = (text: string): boolean => {
  const clean = stripSymbols(text);
  // Look for '09' followed by 8 digits
  return /09\d{8}/.test(clean);
};

/**
 * Detects Social Media Keywords (Smart Boundary Check)
 * Uses raw text (just lowercase) to respect word boundaries
 */
export const hasSocialMedia = (text: string): { detected: boolean; type?: string } => {
  const clean = text.toLowerCase(); // Keep spaces to distinguish "ignore" from "ig"

  const patterns = [
    // Instagram:
    // \b ensures we match "IG" but not "IGnore" or "sIGn"
    // Chinese "哀居" doesn't need boundaries
    { type: 'Instagram', regex: /(\b(ig|instagram)\b|哀居|唉居)/i },

    // Line:
    // \b ensures we match "Line" but not "onLINE", "deadLINE"
    // "ID" is risky (matches "idea"), so we look for "Line ID" combo or Chinese
    { type: 'Line', regex: /((line\s*id)|lineid|賴|加我)/i },

    // Facebook:
    // \b ensures we match "FB"
    { type: 'Facebook', regex: /(\b(fb|facebook)\b|臉書)/i },

    // Links:
    // Matches http://, .com, .net with boundaries or specific starts
    { type: 'Link', regex: /(http|https|www\.|(\b|\.)com\b|(\b|\.)net\b)/i },
  ];

  for (const p of patterns) {
    if (p.regex.test(clean)) {
      return { detected: true, type: p.type };
    }
  }
  return { detected: false };
};

/**
 * Detects Real Name Leaks (Exact & Split)
 * Uses 'stripSymbols' because names can be spaced out "陳 大 明"
 */
export const hasRealName = (
  currentText: string,
  realName: string | undefined,
  messageHistory: string[] = []
): { detected: boolean; reason: 'exact' | 'split' | null } => {
  if (!realName || realName.length < 2) return { detected: false, reason: null };

  const cleanName = stripSymbols(realName);
  const cleanText = stripSymbols(currentText);

  // CHECK 1: Detect Language
  // If the name contains English letters, enforce STRICT full-match only
  const isEnglishName = /[a-zA-Z]/.test(realName);

  if (isEnglishName) {
    // Only block if the ENTIRE name is present
    if (cleanText.includes(cleanName)) {
      return { detected: true, reason: 'exact' };
    }
    // Don't check 2-char segments for English names (too many false positives)
    return { detected: false, reason: null };
  }

  // CHECK 2: Chinese Name Logic (Keep your existing segment logic)
  if (cleanName.length >= 2) {
    for (let i = 0; i < cleanName.length - 1; i++) {
      const segment = cleanName.substring(i, i + 2);
      if (cleanText.includes(segment)) {
        return { detected: true, reason: 'exact' };
      }
    }
  }

  // 2. The "Split Message" Check
  const combinedHistory = [...messageHistory.slice(-2), cleanText].join('');

  if (combinedHistory.includes(cleanName)) {
    return { detected: true, reason: 'split' };
  }

  return { detected: false, reason: null };
};

/**
 * Sanitizes message content by replacing detected patterns with asterisks
 * @param text - The message text to sanitize
 * @param realNames - Array of real names to check against (optional)
 * @returns Sanitized text with patterns replaced by asterisks
 */
export const sanitizeMessage = (ignoreRules: boolean, text: string, ...realNames: (string | undefined)[]): string => {
  if (ignoreRules) return text;

  let sanitized = text;

  // 1. Replace phone numbers (09xxxxxxxx)
  // Match phone numbers with optional spaces/dashes/dots between digits
  // Pattern: 0 followed by 9, then 8 more digits (with optional separators)
  const phoneRegex = /0\s*9(?:\s*[-.]?\s*\d){8}/gi;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // Preserve the structure (spaces/dashes) but replace digits with asterisks
    return match.replace(/\d/g, '👻');
  });

  // 2. Replace social media keywords
  const socialMediaPatterns = [
    { regex: /\b(ig|instagram)\b/gi, replacement: (match: string) => '👻'.repeat(match.length) },
    { regex: /哀居|唉居|臉書|加賴/gi, replacement: (match: string) => '👻'.repeat(match.length) },
    { regex: /\b(line\s*id)\b/gi, replacement: (match: string) => '👻'.repeat(match.length) },
    { regex: /\b(fb|facebook)\b/gi, replacement: (match: string) => '👻'.repeat(match.length) },
  ];

  for (const pattern of socialMediaPatterns) {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }

  // 3. Replace real name segments
  for (const realName of realNames) {
    if (!realName || realName.length < 2) continue;

    const cleanName = stripSymbols(realName);
    const originalName = realName;

    // Strategy: Replace the entire name if found (even with spaces/dashes)
    // First, try to match the full name with optional separators
    const fullNamePattern = originalName.split('').map(char =>
      char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('[\\s\\-\\.]*');

    sanitized = sanitized.replace(new RegExp(fullNamePattern, 'gi'), (match) => {
      // Preserve separators but replace name characters with asterisks
      return match.replace(/[^\s\-\.]/g, '👻');
    });

    // Also replace 2+ character segments (to catch partial matches)
    if (cleanName.length >= 2) {
      for (let i = 0; i < cleanName.length - 1; i++) {
        const segment = cleanName.substring(i, i + 2);
        // Match the segment even with spaces/dashes/dots between characters
        const segmentPattern = segment.split('').join('[\\s\\-\\.]*');
        sanitized = sanitized.replace(new RegExp(segmentPattern, 'gi'), (match) => {
          // Replace non-separator characters with asterisks
          return match.replace(/[^\s\-\.]/g, '👻');
        });
      }
    }
  }

  return sanitized;
};