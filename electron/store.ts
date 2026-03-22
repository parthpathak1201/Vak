import { safeStorage, app } from 'electron'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import path from 'path'

const storePath = path.join(app.getPath('userData'), 'vak-keys.json')

export function saveKeys(keys: Record<string, string>) {
  const encrypted: Record<string, string> = {}
  for (const [k, v] of Object.entries(keys)) {
    if (v) encrypted[k] = safeStorage.encryptString(v).toString('base64')
  }
  writeFileSync(storePath, JSON.stringify(encrypted))
}

export function loadKeys(): Record<string, string> {
  if (!existsSync(storePath)) return {}
  try {
    const raw = JSON.parse(readFileSync(storePath, 'utf-8'))
    const decrypted: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      try {
        decrypted[k] = safeStorage.decryptString(Buffer.from(v as string, 'base64'))
      } catch { decrypted[k] = '' }
    }
    return decrypted
  } catch { return {} }
}

export function hasKeys(): boolean {
  const keys = loadKeys()
  return Object.values(keys).some(v => v.length > 0)
}