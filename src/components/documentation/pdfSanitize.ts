/**
 * PDF Text Sanitizer
 * 
 * Ensures all text rendered in @react-pdf/renderer PDFs uses only
 * ASCII-safe characters that Helvetica can reliably render.
 * 
 * This prevents "garbled text" issues caused by:
 * - Unicode bullets, dashes, and special characters
 * - Emoji characters and their invisible variation selectors
 * - Smart quotes and typographic characters
 */

/**
 * Sanitizes a string for safe PDF rendering with Helvetica font.
 * Replaces problematic Unicode characters with ASCII equivalents.
 */
export function sanitizePdfText(input: string): string {
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  return input
    // Replace bullets and dots
    .replace(/[•●○◦◉◎]/g, '-')
    .replace(/·/g, '-')
    
    // Replace checkmarks and crosses
    .replace(/[✓✔☑]/g, 'Yes')
    .replace(/[✗✘☒]/g, 'No')
    
    // Replace arrows
    .replace(/[→➜➔➤►▶]/g, '->')
    .replace(/[←◀◄]/g, '<-')
    .replace(/[↔⇔]/g, '<->')
    .replace(/[↑▲]/g, '^')
    .replace(/[↓▼]/g, 'v')
    
    // Replace dashes (em dash, en dash, horizontal bar, minus)
    .replace(/[—–―−]/g, '-')
    
    // Replace smart quotes with straight quotes
    .replace(/[""„‟]/g, '"')
    .replace(/[''‚‛]/g, "'")
    
    // Replace ellipsis
    .replace(/…/g, '...')
    
    // Replace stars and ratings
    .replace(/[⭐★☆✩✪]/g, '*')
    
    // Replace common emojis with text labels
    .replace(/📞/g, '[PHONE]')
    .replace(/🔔/g, '[BELL]')
    .replace(/📍/g, '[LOCATION]')
    .replace(/📢/g, '[MEGAPHONE]')
    .replace(/⌨️?/g, '[KEYBOARD]')
    .replace(/🎙️?/g, '[MIC]')
    .replace(/💬/g, '[CHAT]')
    .replace(/✉️?/g, '[EMAIL]')
    .replace(/📧/g, '[EMAIL]')
    .replace(/🔥/g, '[HOT]')
    .replace(/💡/g, '[TIP]')
    .replace(/⚡/g, '[FAST]')
    .replace(/🚀/g, '[LAUNCH]')
    .replace(/✨/g, '')
    .replace(/🎯/g, '[TARGET]')
    .replace(/📊/g, '[CHART]')
    .replace(/📈/g, '[GROWTH]')
    .replace(/💰/g, '[MONEY]')
    .replace(/🏆/g, '[TROPHY]')
    .replace(/👍/g, '[THUMBS UP]')
    .replace(/❤️?/g, '[HEART]')
    .replace(/🔧/g, '[WRENCH]')
    .replace(/⚙️?/g, '[GEAR]')
    .replace(/📱/g, '[MOBILE]')
    .replace(/💻/g, '[COMPUTER]')
    .replace(/🌐/g, '[WEB]')
    .replace(/📅/g, '[CALENDAR]')
    .replace(/⏰/g, '[CLOCK]')
    .replace(/🔒/g, '[LOCK]')
    .replace(/🔑/g, '[KEY]')
    .replace(/📝/g, '[NOTE]')
    .replace(/📋/g, '[CLIPBOARD]')
    .replace(/✅/g, '[CHECK]')
    .replace(/❌/g, '[X]')
    .replace(/⚠️?/g, '[WARNING]')
    .replace(/ℹ️?/g, '[INFO]')
    .replace(/🔴/g, '[RED]')
    .replace(/🟢/g, '[GREEN]')
    .replace(/🟡/g, '[YELLOW]')
    .replace(/🔵/g, '[BLUE]')
    
    // Strip invisible Unicode characters
    .replace(/\uFE0F/g, '') // Variation Selector-16
    .replace(/\u200D/g, '') // Zero Width Joiner
    .replace(/\u200B/g, '') // Zero Width Space
    .replace(/\u200C/g, '') // Zero Width Non-Joiner
    .replace(/\u200E/g, '') // Left-to-Right Mark
    .replace(/\u200F/g, '') // Right-to-Left Mark
    .replace(/\uFEFF/g, '') // Byte Order Mark
    
    // Replace other special symbols
    .replace(/©/g, '(c)')
    .replace(/®/g, '(R)')
    .replace(/™/g, '(TM)')
    .replace(/°/g, ' deg')
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/≈/g, '~')
    .replace(/≠/g, '!=')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/∞/g, 'infinity')
    .replace(/√/g, 'sqrt')
    .replace(/∑/g, 'sum')
    .replace(/∏/g, 'product')
    .replace(/Δ/g, 'delta')
    .replace(/π/g, 'pi')
    
    // Strip any remaining emojis (comprehensive emoji range)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')
    
    // Clean up any double spaces created by removals
    .replace(/  +/g, ' ')
    .trim();
}

/**
 * Creates a safe bullet character for PDF lists
 */
export const SAFE_BULLET = '-';

/**
 * Creates a safe checkmark for PDF lists
 */
export const SAFE_CHECK = '-';

/**
 * Creates a safe arrow for PDF content
 */
export const SAFE_ARROW = '->';
