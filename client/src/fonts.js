// Font havuzu + bundled web font CSS imports.
// Sadece Regular (400) ve Bold (700) — UI için yeterli, bundle küçük.
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/700.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

// Sistem fontları — Windows'ta her zaman var (fallback ile)
const SYSTEM_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const FONTS = {
  system: [
    { id: 'system',         label: 'Sistem (varsayılan)', stack: SYSTEM_STACK },
    { id: 'segoe',          label: 'Segoe UI',            stack: '"Segoe UI", Tahoma, sans-serif' },
    { id: 'consolas',       label: 'Consolas',            stack: 'Consolas, "Courier New", monospace' },
    { id: 'cascadia',       label: 'Cascadia Code',       stack: '"Cascadia Code", Consolas, monospace' },
    { id: 'arial',          label: 'Arial',               stack: 'Arial, Helvetica, sans-serif' },
    { id: 'georgia',        label: 'Georgia',             stack: 'Georgia, "Times New Roman", serif' },
    { id: 'tahoma',         label: 'Tahoma',              stack: 'Tahoma, Verdana, sans-serif' },
  ],
  web: [
    { id: 'inter',          label: 'Inter',               stack: '"Inter", sans-serif' },
    { id: 'source-sans',    label: 'Source Sans 3',       stack: '"Source Sans 3", sans-serif' },
    { id: 'manrope',        label: 'Manrope',             stack: '"Manrope", sans-serif' },
    { id: 'merriweather',   label: 'Merriweather',        stack: '"Merriweather", Georgia, serif' },
    { id: 'jetbrains-mono', label: 'JetBrains Mono',      stack: '"JetBrains Mono", Consolas, monospace' },
  ],
};

export const ALL_FONTS = [...FONTS.system, ...FONTS.web];
export const DEFAULT_FONT_ID = 'system';

export function getFontStack(id) {
  return ALL_FONTS.find((f) => f.id === id)?.stack || SYSTEM_STACK;
}

export function applyFont(id) {
  const stack = getFontStack(id);
  document.documentElement.style.setProperty('--font-family', stack);
}
