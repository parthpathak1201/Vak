"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("vakAPI", {
  saveKeys: (keys) => electron.ipcRenderer.invoke("save-keys", keys),
  hasKeys: () => electron.ipcRenderer.invoke("has-keys"),
  onLoadKeys: (cb) => electron.ipcRenderer.on("load-keys", (_, keys) => cb(keys)),
  onSetupRequired: (cb) => electron.ipcRenderer.on("setup-required", (_, required) => cb(required)),
  setOpacity: (opacity) => electron.ipcRenderer.invoke("set-opacity", opacity),
  setLaunchOnStartup: (enable) => electron.ipcRenderer.invoke("set-launch-on-startup", enable),
  onActiveToolChanged: (cb) => electron.ipcRenderer.on("active-tool-changed", (_, toolName) => cb(toolName)),
  onCapturedText: (cb) => electron.ipcRenderer.on("captured-text", (_, text) => cb(text)),
  onRealtimeText: (cb) => electron.ipcRenderer.on("realtime-text", (_, text) => cb(text)),
  onNavKey: (cb) => electron.ipcRenderer.on("nav-key", (_, key) => cb(key)),
  preCopySave: () => electron.ipcRenderer.invoke("pre-copy-save")
});
