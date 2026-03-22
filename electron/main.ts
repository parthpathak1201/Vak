import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, ipcMain, clipboard } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { saveKeys, loadKeys, hasKeys } from './store'
import { screen } from 'electron'
import { captureTextFromClipboard } from './textCapture'
import { startKeystrokeCapture, stopKeystrokeCapture, getCapturedText } from './keystrokeCapture'
import { startWindowDetector, getCurrentTool } from './windowDetector'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { uIOhook, UiohookKey } = require('uiohook-napi')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isVisible = false
let savedClipboard = ''
let hasShownOnce = false
let detectorStarted = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

app.on('second-instance', () => {
  if (overlayWindow) showOverlay()
})

declare global {
  namespace Electron {
    interface App {
      isQuitting: boolean
    }
  }
}
app.isQuitting = false

function showOverlay() {
  if (!overlayWindow) return
  overlayWindow.webContents.setBackgroundThrottling(false)
  if (!hasShownOnce) {
    overlayWindow.show()
    overlayWindow.focus()
    hasShownOnce = true
  } else {
    overlayWindow.setOpacity(0)
    overlayWindow.show()
    overlayWindow.focus()
    setTimeout(() => overlayWindow?.setOpacity(1), 50)
  }
  isVisible = true
}

function hideOverlay() {
  if (!overlayWindow) return
  overlayWindow.hide()
  overlayWindow.webContents.setBackgroundThrottling(true)
  overlayWindow.webContents.executeJavaScript('window.gc && window.gc()').catch(() => { })
  isVisible = false
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC!, 'tray.png')
  const icon = nativeImage.createFromPath(iconPath)
  const resized = icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 })

  tray = new Tray(resized)
  tray.setToolTip('Vak — prompt co-pilot')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide', click: () => {
        if (isVisible) hideOverlay()
        else showOverlay()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Vak', click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (isVisible) hideOverlay()
    else showOverlay()
  })
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 380,
    height: 500,
    minHeight: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true,
      spellcheck: false,
      enableWebSQL: false,
    },
  })

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  overlayWindow.setPosition(width - 520, height - 520)

  const savedPos = loadKeys()['_window_pos']
  if (savedPos) {
    try {
      const { x, y } = JSON.parse(savedPos)
      overlayWindow.setPosition(x, y)
    } catch { }
  }

  overlayWindow.on('moved', () => {
    const [x, y] = overlayWindow!.getPosition()
    const keys = loadKeys()
    keys['_window_pos'] = JSON.stringify({ x, y })
    saveKeys(keys)
  })

  if (VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    overlayWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  overlayWindow.webContents.on('did-finish-load', () => {
    const keys = loadKeys()
    overlayWindow?.webContents.send('load-keys', keys)
    overlayWindow?.webContents.send('setup-required', !hasKeys())

    if (!detectorStarted) {
      detectorStarted = true
      startWindowDetector((tool) => {
        console.log(`Active AI tool: ${tool?.name}`)
        overlayWindow?.webContents.send('active-tool-changed', tool?.name ?? null)

        if (tool) {
          startKeystrokeCapture((text) => {
            if (text.length > 5) {
              overlayWindow?.webContents.send('realtime-text', text)
            }
          })
        } else {
          stopKeystrokeCapture()
        }
      })
    }
  })

  overlayWindow.once('ready-to-show', () => { })
  overlayWindow.hide()

  uIOhook.on('keydown', (e: any) => {
    if (!isVisible) return
    if (e.keycode === UiohookKey.ArrowUp) {
      overlayWindow?.webContents.send('nav-key', 'up')
    }
    if (e.keycode === UiohookKey.Return) {
      overlayWindow?.webContents.send('nav-key', 'enter')
    }
    if (e.keycode === UiohookKey.ArrowDown) {
      overlayWindow?.webContents.send('nav-key', 'down')
    }
  })

  uIOhook.start()

  overlayWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      hideOverlay()
    }
  })

  overlayWindow.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'Escape') {
      if (savedClipboard) {
        clipboard.writeText(savedClipboard)
        savedClipboard = ''
      }
      hideOverlay()
    }
  })

  globalShortcut.register('CommandOrControl+Space', () => {
    if (!overlayWindow) return
    if (isVisible) {
      hideOverlay()
    } else {
      const tool = getCurrentTool()
      const clipboardText = captureTextFromClipboard()
      const captured = getCapturedText() || clipboardText
      console.log('Tool:', tool?.name, '| Captured:', captured?.substring(0, 50))
      showOverlay()
      if (captured) {
        overlayWindow?.webContents.send('captured-text', captured)
      }
    }
  })

  ipcMain.handle('save-keys', (_, keys: Record<string, string>) => {
    saveKeys(keys)
    return true
  })

  ipcMain.handle('has-keys', () => hasKeys())

  ipcMain.handle('set-launch-on-startup', (_, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
    })
  })

  ipcMain.handle('set-opacity', (_, opacity: number) => {
    overlayWindow?.setOpacity(opacity)
  })

  ipcMain.handle('pre-copy-save', () => {
    savedClipboard = clipboard.readText()
  })
}

function RamLogger() {
  const formatMB = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`

  setInterval(() => {
    const mem = process.memoryUsage()
    const status = isVisible ? 'visible' : 'hidden'
    console.log(
      `[VAK RAM] ${status} | heap: ${formatMB(mem.heapUsed)}/${formatMB(mem.heapTotal)} | rss: ${formatMB(mem.rss)}`
    )
  }, 10000)
}

app.whenReady().then(() => {
  createOverlayWindow()
  createTray()

  // RAM logger — logs every 10 seconds - to check resource consumption
  //RamLogger()
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { })