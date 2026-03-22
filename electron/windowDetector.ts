import { exec } from 'child_process'
import { isAiTool, AiTool } from '../shared/aiTools'

let currentTool: AiTool | null = null
let onToolChange: ((tool: AiTool | null) => void) | null = null
let detectorInterval: NodeJS.Timeout | null = null
let cachedTitle = ''

function getActiveWindowTitle(): Promise<string> {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -Command "Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);' -Name WinApi -Namespace Win32; $h = [Win32.WinApi]::GetForegroundWindow(); $s = New-Object System.Text.StringBuilder 256; [Win32.WinApi]::GetWindowText($h, $s, 256); $s.ToString()"`,
      { timeout: 2000 },
      (err, stdout) => {
        if (err) resolve('')
        else resolve(stdout.trim())
      }
    )
  })
}

async function checkActiveWindow() {
  const title = await getActiveWindowTitle()
  if (!title || title === cachedTitle) return
  cachedTitle = title

  const tool = isAiTool(title)
  const toolName = tool?.name ?? null
  const currentName = currentTool?.name ?? null

  if (toolName !== currentName) {
    currentTool = tool
    onToolChange?.(tool)
    console.log('Window:', title, '->', toolName ?? 'not AI')
  }
}

export function startWindowDetector(onChange: (tool: AiTool | null) => void) {
  onToolChange = onChange
  checkActiveWindow()
  detectorInterval = setInterval(checkActiveWindow, 1500)
}

export function stopWindowDetector() {
  if (detectorInterval) {
    clearInterval(detectorInterval)
    detectorInterval = null
  }
}

export function getCurrentTool(): AiTool | null {
  return currentTool
}