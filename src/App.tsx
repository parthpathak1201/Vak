import { useState, useEffect, useRef } from 'react'
import { getSuggestions } from '../api/apiEngine'
import { loadSettings, saveSettings } from '../shared/utils'
import { DEFAULT_SETTINGS, Settings, THEMES } from '../shared/constants'
import SettingsPanel from './components/Settings'
import Setup from './components/Setup'
import PulseIndicator from './components/PulseIndicator'

function App() {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [usedProvider, setUsedProvider] = useState<string>('')
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadSettings()
  }))
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const vakAPI = (window as any).vakAPI
    if (!vakAPI) return

    vakAPI.onActiveToolChanged((toolName: string | null) => {
      setActiveTool(toolName)
    })

    vakAPI.onSetupRequired((required: boolean) => {
      setSetupRequired(required)
      if (required) setShowSettings(false)
    })

    vakAPI.onCapturedText((text: string) => {
      setTypedText(text)
    })

    vakAPI.onLoadKeys((loadedKeys: Record<string, string>) => {
      ; (window as any)._vakKeys = loadedKeys
      setTimeout(() => {
        ; (window as any)._vakKeys = null
      }, 5000)
    })

    vakAPI.onRealtimeText((text: string) => {
      if (settings.realtimeMode) {
        setTypedText(text)
      }
    })

    vakAPI.onNavKey((key: string) => {
      if (key === 'up') setSelectedIndex(i => Math.max(i - 1, 0))
      if (key === 'down') setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
      if (key === 'enter') copySuggestion(suggestions[selectedIndex], selectedIndex)
    })
  }, [])

  useEffect(() => {
    if (typedText.trim().length < settings.minPromptLength) {
      setSuggestions([])
      setSelectedIndex(0)
      return
    }

    const debounce = setTimeout(async () => {
      setLoading(true)
      const { suggestions: results, provider } = await getSuggestions(typedText, settings)
      setSuggestions(results)
      setUsedProvider(provider)
      setSelectedIndex(0)
      setLoading(false)
    }, settings.realtimeMode ? 600 : 1500)

    return () => clearTimeout(debounce)
  }, [typedText, settings])

  const copySuggestion = async (text: string, index: number) => {
    try {
      await (window as any).vakAPI?.preCopySave()
    } catch (e) { }

    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 3000)
  }

  const refineSuggestion = (text: string) => {
    setSuggestions([])
    setTypedText(text)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); copySuggestion(suggestions[selectedIndex], selectedIndex) }
      if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
    }
  }, [typedText])

  const accent = settings.accentColor
  const theme = THEMES[settings.theme] ?? THEMES['dark']

  if (setupRequired) {
    return <Setup onComplete={() => setSetupRequired(false)} />
  }

  return (
    <div style={{
      WebkitAppRegion: 'drag',
      width: '100%',
      height: '100vh',
      background: theme.bg,
      backdropFilter: `blur(${theme.blur})`,
      WebkitBackdropFilter: `blur(${theme.blur})`,
      borderRadius: '14px',
      border: `1px solid ${theme.border}`,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: theme.text,
      userSelect: 'none',
      overflow: 'hidden',
    } as React.CSSProperties}>
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '12px 16px' }}>

        {showSettings ? (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            settings={settings}
            onSettingsChange={(s) => {
              setSettings(s)
              saveSettings(s)
              if (s.overlayOpacity !== settings.overlayOpacity) {
                ; (window as any).vakAPI?.setOpacity(s.overlayOpacity)
              }
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.12em' }}>VAK</span>
                {activeTool && (
                  <span style={{ fontSize: '9px', color: `rgba(${accent},0.6)`, letterSpacing: '0.06em' }}>
                    {activeTool}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: theme.textFaint, letterSpacing: '0.06em' }}>
                  {loading ? 'thinking...' : suggestions.length === 0 ? (activeTool ? 'copy text > Ctrl+Space' : 'waiting...') : `${suggestions.length} suggestions`}
                </span>
                <div
                  onClick={() => setShowSettings(true)}
                  style={{ WebkitAppRegion: 'no-drag', cursor: 'pointer', fontSize: '12px', color: theme.textFaint, padding: '2px 4px', borderRadius: '4px', transition: 'color 0.15s' } as React.CSSProperties}
                  onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = theme.textFaint)}
                >⚙</div>
              </div>
            </div>

            {/* Input */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={inputRef as any}
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                placeholder="Paste or Type your prompt here..."
                autoFocus
                rows={1}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
                }}
                style={{
                  WebkitAppRegion: 'no-drag',
                  width: '100%',
                  background: theme.input,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '8px 32px 8px 12px',
                  color: theme.text,
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  marginBottom: suggestions.length > 0 ? '10px' : '0',
                  minHeight: '34px',
                  maxHeight: '150px',
                } as React.CSSProperties}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '9px',
                  top: '10px',
                  cursor: 'pointer',
                  WebkitAppRegion: 'no-drag',
                } as React.CSSProperties}
              >
                <PulseIndicator accent={accent} onClick={() => setTypedText('')} />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ fontSize: '12px', color: theme.textFaint, textAlign: 'center', padding: '8px 0' }}>
                Generating Suggestions...
              </div>
            )}

            {/* Suggestions */}
            {suggestions.map((s, i) => (
              <div
                key={i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => copySuggestion(s, i)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  WebkitAppRegion: 'no-drag',
                  background: selectedIndex === i
                    ? i === 1 ? `rgba(${accent},0.18)` : theme.bgCardHover
                    : i === 1 ? `rgba(${accent},0.08)` : theme.bgCard,
                  border: `1px solid ${selectedIndex === i
                    ? i === 1 ? `rgba(${accent},0.5)` : theme.border
                    : i === 1 ? `rgba(${accent},0.25)` : theme.borderCard}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: i < suggestions.length - 1 ? '6px' : '0',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border 0.15s',
                } as React.CSSProperties}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  {i === 1
                    ? <span style={{ fontSize: '9px', color: `rgba(${accent},0.9)`, letterSpacing: '0.08em' }}>✦ RECOMMENDED</span>
                    : <span style={{ fontSize: '9px', color: theme.textFaint, letterSpacing: '0.08em' }}>{i === 0 ? 'POLISHED' : 'CONTEXTUAL'}</span>
                  }
                  {selectedIndex === i && <span style={{ fontSize: '9px', color: theme.textFaint }}>↵ copy</span>}
                </div>

                <div style={{ fontSize: '12px', lineHeight: 1.5, color: theme.text }}>{s}</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '10px', color: copiedIndex === i ? `rgba(${accent},0.9)` : theme.textFaint, transition: 'color 0.2s' }}>
                      {copiedIndex === i ? '✓ copied!' : 'click to copy'}
                    </div>
                    {usedProvider && (
                      <div style={{ fontSize: '9px', color: theme.textFaintest, letterSpacing: '0.04em' }}>
                        via {usedProvider.toLowerCase()}
                      </div>
                    )}
                  </div>
                  <div
                    onClick={e => { e.stopPropagation(); refineSuggestion(s) }}
                    style={{ WebkitAppRegion: 'no-drag', fontSize: '9px', color: theme.textFaint, border: `1px solid ${theme.borderCard}`, borderRadius: '4px', padding: '2px 7px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.15s' } as React.CSSProperties}
                    onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.border }}
                    onMouseLeave={e => { e.currentTarget.style.color = theme.textFaint; e.currentTarget.style.borderColor = theme.borderCard }}
                  >↺ refine</div>
                </div>
              </div>
            ))}

            {/* Footer */}
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${theme.borderCard}`, fontSize: '10px', color: theme.textFaintest, fontFamily: 'system-ui, sans-serif' }}>
                <span>up/down navigate</span>
                <span>enter copy</span>
                <span>tab input</span>
                <span>esc hide</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App