import { app, safeStorage, clipboard, globalShortcut, BrowserWindow, screen, ipcMain, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createRequire } from "node:module";
import { exec } from "child_process";
const storePath = path.join(app.getPath("userData"), "vak-keys.json");
function saveKeys(keys) {
  const encrypted = {};
  for (const [k, v] of Object.entries(keys)) {
    if (v) encrypted[k] = safeStorage.encryptString(v).toString("base64");
  }
  writeFileSync(storePath, JSON.stringify(encrypted));
}
function loadKeys() {
  if (!existsSync(storePath)) return {};
  try {
    const raw = JSON.parse(readFileSync(storePath, "utf-8"));
    const decrypted = {};
    for (const [k, v] of Object.entries(raw)) {
      try {
        decrypted[k] = safeStorage.decryptString(Buffer.from(v, "base64"));
      } catch {
        decrypted[k] = "";
      }
    }
    return decrypted;
  } catch {
    return {};
  }
}
function hasKeys() {
  const keys = loadKeys();
  return Object.values(keys).some((v) => v.length > 0);
}
function captureTextFromClipboard() {
  const text = clipboard.readText();
  if (!text || text.trim().length < 5) return "";
  return text.trim();
}
const require$2 = createRequire(import.meta.url);
const { uIOhook: uIOhook$1, UiohookKey: UiohookKey$1 } = require$2("uiohook-napi");
let isCapturing = false;
let onTextUpdate = null;
let debounceTimer = null;
let updateTimer = null;
let lastText = "";
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
`.trim();
function readFocusedElementText() {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -NonInteractive -Command "${UIA_SCRIPT.replace(/\n/g, "; ")}"`,
      { timeout: 1500 },
      (err, stdout) => {
        if (err) resolve(lastText);
        else resolve(stdout.trim());
      }
    );
  });
}
function scheduleUpdate(text) {
  if (updateTimer) return;
  updateTimer = setTimeout(() => {
    updateTimer = null;
    if (text && text !== lastText) {
      lastText = text;
      onTextUpdate == null ? void 0 : onTextUpdate(text);
    }
  }, 50);
}
function startKeystrokeCapture(onUpdate) {
  if (isCapturing) return;
  isCapturing = true;
  onTextUpdate = onUpdate;
  uIOhook$1.on("keydown", (e) => {
    if (!isCapturing) return;
    if (e.ctrlKey && e.keycode === UiohookKey$1.Space) return;
    if (e.ctrlKey && e.keycode === UiohookKey$1.A) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const text = await readFocusedElementText();
      scheduleUpdate(text);
    }, 500);
  });
}
function stopKeystrokeCapture() {
  if (!isCapturing) return;
  isCapturing = false;
  onTextUpdate = null;
  lastText = "";
  if (debounceTimer) clearTimeout(debounceTimer);
  if (updateTimer) clearTimeout(updateTimer);
  uIOhook$1.removeAllListeners("keydown");
}
function getCapturedText() {
  return lastText;
}
const AI_TOOLS = [
  {
    name: "ChatGPT",
    windowTitles: ["ChatGPT", "chat.openai.com"],
    urls: ["chat.openai.com", "chatgpt.com"]
  },
  {
    name: "Claude",
    windowTitles: ["Claude", "claude.ai"],
    urls: ["claude.ai"]
  },
  {
    name: "Gemini",
    windowTitles: ["Gemini", "gemini.google.com", "Google Gemini"],
    urls: ["gemini.google.com", "aistudio.google.com"]
  },
  {
    name: "Perplexity",
    windowTitles: ["Perplexity", "perplexity.ai"],
    urls: ["perplexity.ai"]
  },
  {
    name: "Poe",
    windowTitles: ["Poe", "poe.com"],
    urls: ["poe.com"]
  },
  {
    name: "Mistral",
    windowTitles: ["Mistral", "chat.mistral.ai", "Le Chat"],
    urls: ["chat.mistral.ai"]
  },
  {
    name: "Copilot",
    windowTitles: ["Copilot", "copilot.microsoft.com", "Microsoft Copilot"],
    urls: ["copilot.microsoft.com", "bing.com/chat"]
  },
  {
    name: "Grok",
    windowTitles: ["Grok", "grok.x.ai", "x.com/grok"],
    urls: ["grok.x.ai", "x.com/i/grok"]
  },
  {
    name: "HuggingChat",
    windowTitles: ["HuggingChat", "huggingface.co"],
    urls: ["huggingface.co/chat"]
  },
  {
    name: "Cohere Coral",
    windowTitles: ["Coral", "coral.cohere.com"],
    urls: ["coral.cohere.com"]
  },
  {
    name: "You.com",
    windowTitles: ["You.com", "you.com"],
    urls: ["you.com"]
  },
  {
    name: "Phind",
    windowTitles: ["Phind", "phind.com"],
    urls: ["phind.com"]
  },
  {
    name: "Groq",
    windowTitles: ["Groq", "groq.com"],
    urls: ["groq.com"]
  },
  {
    name: "DeepSeek",
    windowTitles: ["DeepSeek", "chat.deepseek.com"],
    urls: ["chat.deepseek.com"]
  },
  {
    name: "Kagi",
    windowTitles: ["Kagi", "kagi.com"],
    urls: ["kagi.com/assistant"]
  },
  {
    name: "Notion AI",
    windowTitles: ["Notion"],
    urls: ["notion.so"]
  }
];
function isAiTool(windowTitle) {
  const lower = windowTitle.toLowerCase();
  for (const tool of AI_TOOLS) {
    for (const title of tool.windowTitles) {
      if (lower.includes(title.toLowerCase())) {
        return tool;
      }
    }
  }
  return null;
}
let currentTool = null;
let onToolChange = null;
let cachedTitle = "";
function getActiveWindowTitle() {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -Command "Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);' -Name WinApi -Namespace Win32; $h = [Win32.WinApi]::GetForegroundWindow(); $s = New-Object System.Text.StringBuilder 256; [Win32.WinApi]::GetWindowText($h, $s, 256); $s.ToString()"`,
      { timeout: 2e3 },
      (err, stdout) => {
        if (err) resolve("");
        else resolve(stdout.trim());
      }
    );
  });
}
async function checkActiveWindow() {
  const title = await getActiveWindowTitle();
  if (!title || title === cachedTitle) return;
  cachedTitle = title;
  const tool = isAiTool(title);
  const toolName = (tool == null ? void 0 : tool.name) ?? null;
  const currentName = (currentTool == null ? void 0 : currentTool.name) ?? null;
  if (toolName !== currentName) {
    currentTool = tool;
    onToolChange == null ? void 0 : onToolChange(tool);
    console.log("Window:", title, "->", toolName ?? "not AI");
  }
}
function startWindowDetector(onChange) {
  onToolChange = onChange;
  checkActiveWindow();
  setInterval(checkActiveWindow, 1500);
}
function getCurrentTool() {
  return currentTool;
}
const require$1 = createRequire(import.meta.url);
const { uIOhook, UiohookKey } = require$1("uiohook-napi");
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let overlayWindow = null;
let tray = null;
let isVisible = false;
let savedClipboard = "";
let hasShownOnce = false;
let detectorStarted = false;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
app.on("second-instance", () => {
  if (overlayWindow) showOverlay();
});
app.isQuitting = false;
function showOverlay() {
  if (!overlayWindow) return;
  overlayWindow.webContents.setBackgroundThrottling(false);
  if (!hasShownOnce) {
    overlayWindow.show();
    overlayWindow.focus();
    hasShownOnce = true;
  } else {
    overlayWindow.setOpacity(0);
    overlayWindow.show();
    overlayWindow.focus();
    setTimeout(() => overlayWindow == null ? void 0 : overlayWindow.setOpacity(1), 50);
  }
  isVisible = true;
}
function hideOverlay() {
  if (!overlayWindow) return;
  overlayWindow.hide();
  overlayWindow.webContents.setBackgroundThrottling(true);
  overlayWindow.webContents.executeJavaScript("window.gc && window.gc()").catch(() => {
  });
  isVisible = false;
}
function createTray() {
  const iconPath = path$1.join(process.env.VITE_PUBLIC, "tray.png");
  const icon = nativeImage.createFromPath(iconPath);
  const resized = icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 });
  tray = new Tray(resized);
  tray.setToolTip("Vak — prompt co-pilot");
  const menu = Menu.buildFromTemplate([
    {
      label: "Show / Hide",
      click: () => {
        if (isVisible) hideOverlay();
        else showOverlay();
      }
    },
    { type: "separator" },
    {
      label: "Quit Vak",
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => {
    if (isVisible) hideOverlay();
    else showOverlay();
  });
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
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true,
      spellcheck: false,
      enableWebSQL: false
    }
  });
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  overlayWindow.setPosition(width - 520, height - 520);
  const savedPos = loadKeys()["_window_pos"];
  if (savedPos) {
    try {
      const { x, y } = JSON.parse(savedPos);
      overlayWindow.setPosition(x, y);
    } catch {
    }
  }
  overlayWindow.on("moved", () => {
    const [x, y] = overlayWindow.getPosition();
    const keys = loadKeys();
    keys["_window_pos"] = JSON.stringify({ x, y });
    saveKeys(keys);
  });
  if (VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    overlayWindow.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
  overlayWindow.webContents.on("did-finish-load", () => {
    const keys = loadKeys();
    overlayWindow == null ? void 0 : overlayWindow.webContents.send("load-keys", keys);
    overlayWindow == null ? void 0 : overlayWindow.webContents.send("setup-required", !hasKeys());
    if (!detectorStarted) {
      detectorStarted = true;
      startWindowDetector((tool) => {
        console.log(`Active AI tool: ${tool == null ? void 0 : tool.name}`);
        overlayWindow == null ? void 0 : overlayWindow.webContents.send("active-tool-changed", (tool == null ? void 0 : tool.name) ?? null);
        if (tool) {
          startKeystrokeCapture((text) => {
            if (text.length > 5) {
              overlayWindow == null ? void 0 : overlayWindow.webContents.send("realtime-text", text);
            }
          });
        } else {
          stopKeystrokeCapture();
        }
      });
    }
  });
  overlayWindow.once("ready-to-show", () => {
  });
  overlayWindow.hide();
  uIOhook.on("keydown", (e) => {
    if (!isVisible) return;
    if (e.keycode === UiohookKey.ArrowUp) {
      overlayWindow == null ? void 0 : overlayWindow.webContents.send("nav-key", "up");
    }
    if (e.keycode === UiohookKey.Return) {
      overlayWindow == null ? void 0 : overlayWindow.webContents.send("nav-key", "enter");
    }
    if (e.keycode === UiohookKey.ArrowDown) {
      overlayWindow == null ? void 0 : overlayWindow.webContents.send("nav-key", "down");
    }
  });
  uIOhook.start();
  overlayWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      hideOverlay();
    }
  });
  overlayWindow.webContents.on("before-input-event", (_, input) => {
    if (input.key === "Escape") {
      if (savedClipboard) {
        clipboard.writeText(savedClipboard);
        savedClipboard = "";
      }
      hideOverlay();
    }
  });
  globalShortcut.register("CommandOrControl+Space", () => {
    if (!overlayWindow) return;
    if (isVisible) {
      hideOverlay();
    } else {
      const tool = getCurrentTool();
      const clipboardText = captureTextFromClipboard();
      const captured = getCapturedText() || clipboardText;
      console.log("Tool:", tool == null ? void 0 : tool.name, "| Captured:", captured == null ? void 0 : captured.substring(0, 50));
      showOverlay();
      if (captured) {
        overlayWindow == null ? void 0 : overlayWindow.webContents.send("captured-text", captured);
      }
    }
  });
  ipcMain.handle("save-keys", (_, keys) => {
    saveKeys(keys);
    return true;
  });
  ipcMain.handle("has-keys", () => hasKeys());
  ipcMain.handle("set-launch-on-startup", (_, enable) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath("exe")
    });
  });
  ipcMain.handle("set-opacity", (_, opacity) => {
    overlayWindow == null ? void 0 : overlayWindow.setOpacity(opacity);
  });
  ipcMain.handle("pre-copy-save", () => {
    savedClipboard = clipboard.readText();
  });
}
app.whenReady().then(() => {
  createOverlayWindow();
  createTray();
});
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => {
});
export {
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
