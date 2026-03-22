import { clipboard } from 'electron'

export function captureTextFromClipboard(): string {
  const text = clipboard.readText()
  if (!text || text.trim().length < 5) return ''
  return text.trim()
}