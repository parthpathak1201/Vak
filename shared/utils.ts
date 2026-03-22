const SETTINGS_KEY = 'vak_settings'
const USAGE_KEY = 'vak_usage'

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveSettings(settings: object) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getKey(name: string): string {
  const win = window as any
  if (win._vakKeys) return win._vakKeys[name] || ''
  return (import.meta.env as any)[`VITE_${name}`] || ''
}

export function loadUsage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function recordUsage(providerName: string) {
  const usage = loadUsage()
  usage[providerName] = (usage[providerName] || 0) + 1
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

export function resetUsage() {
  localStorage.setItem(USAGE_KEY, JSON.stringify({}))
}