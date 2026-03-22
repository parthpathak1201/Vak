import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('vakAPI', {
  saveKeys: (keys: Record<string, string>) => ipcRenderer.invoke('save-keys', keys),
  hasKeys: () => ipcRenderer.invoke('has-keys'),
  onLoadKeys: (cb: (keys: Record<string, string>) => void) =>
    ipcRenderer.on('load-keys', (_, keys) => cb(keys)),
  onSetupRequired: (cb: (required: boolean) => void) =>
    ipcRenderer.on('setup-required', (_, required) => cb(required)),
  setOpacity: (opacity: number) => ipcRenderer.invoke('set-opacity', opacity),
  setLaunchOnStartup: (enable: boolean) => ipcRenderer.invoke('set-launch-on-startup', enable),
  onActiveToolChanged: (cb: (toolName: string | null) => void) =>
    ipcRenderer.on('active-tool-changed', (_, toolName) => cb(toolName)),
  onCapturedText: (cb: (text: string) => void) =>
    ipcRenderer.on('captured-text', (_, text) => cb(text)),
  onRealtimeText: (cb: (text: string) => void) =>
    ipcRenderer.on('realtime-text', (_, text) => cb(text)),
  onNavKey: (cb: (key: string) => void) =>
    ipcRenderer.on('nav-key', (_, key) => cb(key)),
  preCopySave: () => ipcRenderer.invoke('pre-copy-save'),
})