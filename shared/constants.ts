export const THEMES = {
  'dark': {
    bg: 'linear-gradient(135deg, rgba(30,32,48,0.96) 0%, rgba(18,20,35,0.98) 100%)',
    bgCard: 'rgba(255,255,255,0.06)',
    bgCardHover: 'rgba(255,255,255,0.11)',
    border: 'rgba(255,255,255,0.13)',
    borderCard: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.55)',
    textFaint: 'rgba(255,255,255,0.30)',
    textFaintest: 'rgba(255,255,255,0.15)',
    input: 'rgba(255,255,255,0.07)',
    sectionBg: 'rgba(255,255,255,0.04)',
    blur: '0px',
  },
  'light': {
    bg: 'linear-gradient(135deg, rgba(235,240,255,0.97) 0%, rgba(215,225,245,0.98) 100%)',
    bgCard: 'rgba(255,255,255,0.55)',
    bgCardHover: 'rgba(255,255,255,0.75)',
    border: 'rgba(180,190,220,0.50)',
    borderCard: 'rgba(180,190,220,0.35)',
    text: 'rgba(15,20,40,0.92)',
    textMuted: 'rgba(15,20,40,0.62)',
    textFaint: 'rgba(15,20,40,0.42)',
    textFaintest: 'rgba(15,20,40,0.25)',
    input: 'rgba(255,255,255,0.65)',
    sectionBg: 'rgba(255,255,255,0.35)',
    blur: '0px',
  },
}

export type ThemeKey = keyof typeof THEMES
export type Theme = typeof THEMES[ThemeKey]

export const DEFAULT_SETTINGS = {
  triggerDelay: 1000,
  numSuggestions: 3,
  suggestionStyle: 'balanced',
  minPromptLength: 10,
  overlayOpacity: 0.85,
  accentColor: '99,153,34',
  launchOnStartup: false,
  closeToTray: true,
  realtimeMode: true,
  fallbackChain: ['Groq', 'Cerebras', 'SambaNova', 'Mistral', 'Together', 'OpenRouter', 'Cohere', 'Gemini'],
  theme: 'dark' as ThemeKey,
}

export type Settings = typeof DEFAULT_SETTINGS