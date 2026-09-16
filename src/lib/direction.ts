// utils/direction.ts

/**
 * Detects whether string starts with or heavily uses RTL characters.
 * Covers Dhivehi (Thaana), Arabic, Hebrew, Persian, Urdu.
 */
export function getTextDirection(text: string): 'rtl' | 'ltr' {
  if (!text) return 'ltr';

  // Unicode regex for RTL character scripts
  // \u0780-\u07BF: Thaana (Dhivehi)
  // \u0600-\u06FF: Arabic
  // \u0590-\u05FF: Hebrew
  // \u0750-\u077F: Arabic Supplement
  const rtlRegex = /[\u0780-\u07BF\u0600-\u06FF\u0590-\u05FF\u0750-\u077F]/;

  // Option 1: Strip code snippets/markdown links and check first strongly directional character
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '') // ignore code blocks
    .replace(/`[^`]*`/g, '')        // ignore inline code
    .trim();

  for (const char of cleanText) {
    if (rtlRegex.test(char)) return 'rtl';
    // If we hit an explicit English/Latin character first, default to LTR
    if (/[a-zA-Z]/.test(char)) return 'ltr';
  }

  return 'ltr';
}