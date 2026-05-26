// Tema preset havuzu. Her preset 7 CSS değişkenini override eder.
// Çekirdek zemin (--bg) tüm presetlerde koyu kalır; kişilik accent +
// border/bg-3 tint'inden gelir.

export const THEMES = [
  {
    id: 'classic',
    name: 'Klasik',
    vars: {
      '--bg':          '#0a0a0a',
      '--bg-2':        '#141414',
      '--bg-3':        '#1c1c1c',
      '--border':      '#2a2a2a',
      '--text':        '#e8e8e8',
      '--text-dim':    '#888',
      '--accent':      '#ffb800',
    },
  },
  {
    id: 'broadcaster',
    name: 'Yayıncı',
    vars: {
      '--bg':          '#0a0808',
      '--bg-2':        '#161010',
      '--bg-3':        '#201818',
      '--border':      '#3a2424',
      '--text':        '#f0e8e8',
      '--text-dim':    '#9a8888',
      '--accent':      '#e53935',
    },
  },
  {
    id: 'finance',
    name: 'Finans',
    vars: {
      '--bg':          '#070a10',
      '--bg-2':        '#101620',
      '--bg-3':        '#161e2c',
      '--border':      '#243450',
      '--text':        '#e6ecf5',
      '--text-dim':    '#8898b0',
      '--accent':      '#2196f3',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    vars: {
      '--bg':          '#040a04',
      '--bg-2':        '#0a140a',
      '--bg-3':        '#0e1c0e',
      '--border':      '#1f3a1f',
      '--text':        '#cfe8cf',
      '--text-dim':    '#7a9a7a',
      '--accent':      '#00ff66',
    },
  },
  {
    id: 'minimal',
    name: 'Sade',
    vars: {
      '--bg':          '#0e0e0e',
      '--bg-2':        '#181818',
      '--bg-3':        '#222222',
      '--border':      '#333333',
      '--text':        '#eaeaea',
      '--text-dim':    '#8a8a8a',
      '--accent':      '#9e9e9e',
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    vars: {
      '--bg':          '#0c0810',
      '--bg-2':        '#16101e',
      '--bg-3':        '#1e1828',
      '--border':      '#382a48',
      '--text':        '#ece6f5',
      '--text-dim':    '#9888b0',
      '--accent':      '#9c27b0',
    },
  },
  {
    id: 'warm',
    name: 'Sıcak',
    vars: {
      '--bg':          '#0c0805',
      '--bg-2':        '#181208',
      '--bg-3':        '#22180c',
      '--border':      '#3c2a14',
      '--text':        '#f5ebdc',
      '--text-dim':    '#a08a70',
      '--accent':      '#ff6f00',
    },
  },
  {
    id: 'cyan',
    name: 'Camgöbeği',
    vars: {
      '--bg':          '#050b0d',
      '--bg-2':        '#0e1a1e',
      '--bg-3':        '#142428',
      '--border':      '#1f3a40',
      '--text':        '#dcecef',
      '--text-dim':    '#789aa0',
      '--accent':      '#00bcd4',
    },
  },
];

export const DEFAULT_THEME_ID = 'classic';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function applyTheme(id) {
  const theme = getTheme(id);
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', theme.id);
}
