import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { uIOhook, UiohookKey } = require('uiohook-napi')

import { exec } from 'child_process'

let isCapturing = false
let onTextUpdate: ((text: string) => void) | null = null
let debounceTimer: NodeJS.Timeout | null = null
let updateTimer: NodeJS.Timeout | null = null
let lastText = ''

const UIA_SCRIPT = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
try {
  $focused = [System.Windows.Automation.AutomationElement]::FocusedElement
  if ($focused -eq $null) { exit }
  $patterns = $focused.GetSupportedPatterns()
  $valuePattern = [System.Windows.Automation.ValuePattern]::Pattern
  $textPattern = [System.Windows.Automation.TextPattern]::Pattern
  if ($patterns -contains $valuePattern) {
    $p = $focused.GetCurrentPattern($valuePattern)
    Write-Output $p.Current.Value
  } elseif ($patterns -contains $textPattern) {
    $p = $focused.GetCurrentPattern($textPattern)
    Write-Output $p.DocumentRange.GetText(-1)
  }
} catch {}
`.trim()

function readFocusedElementText(): Promise<string> {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -NonInteractive -Command "${UIA_SCRIPT.replace(/\n/g, '; ')}"`,
      { timeout: 1500 },
      (err, stdout) => {
        if (err) resolve(lastText)
        else resolve(stdout.trim())
      }
    )
  })
}

function scheduleUpdate(text: string) {
  if (updateTimer) return
  updateTimer = setTimeout(() => {
    updateTimer = null
    if (text && text !== lastText) {
      lastText = text
      onTextUpdate?.(text)
    }
  }, 50)
}

export function startKeystrokeCapture(onUpdate: (text: string) => void) {
  if (isCapturing) return
  isCapturing = true
  onTextUpdate = onUpdate

  uIOhook.on('keydown', (e: any) => {
    if (!isCapturing) return
    if (e.ctrlKey && e.keycode === UiohookKey.Space) return
    if (e.ctrlKey && e.keycode === UiohookKey.A) return

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const text = await readFocusedElementText()
      scheduleUpdate(text)
    }, 500)
  })
}

export function stopKeystrokeCapture() {
  if (!isCapturing) return
  isCapturing = false
  onTextUpdate = null
  lastText = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  if (updateTimer) clearTimeout(updateTimer)
  uIOhook.removeAllListeners('keydown')
}

export function getCapturedText(): string {
  return lastText
}