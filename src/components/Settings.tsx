import { Settings, THEMES, Theme } from '../../shared/constants'
import { loadUsage, resetUsage, getKey } from '../../shared/utils'
import { useState } from 'react'

type Props = {
  onClose: () => void
  settings: Settings
  onSettingsChange: (s: Settings) => void
}

function SettingsPanel({ onClose, settings, onSettingsChange }: Props) {
  const update = (key: keyof Settings, value: any) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const accent = settings.accentColor
  const theme = THEMES[settings.theme] ?? THEMES['dark']
  const [usage, setUsage] = useState<Record<string, number>>(() => loadUsage())
  const [editingKeys, setEditingKeys] = useState(false)
  const [keyValues, setKeyValues] = useState<Record<string, string>>({})

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div
          onClick={onClose}
          style={{ cursor: 'pointer', color: theme.textFaint, fontSize: '14px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${theme.borderCard}`, transition: 'color 0.15s', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
          onMouseLeave={e => (e.currentTarget.style.color = theme.textFaint)}
        >←</div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.12em' }}>SETTINGS</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>

        <Section title="BEHAVIOR" theme={theme}>
          <SwitchRow label="Realtime mode" value={settings.realtimeMode} onChange={v => update('realtimeMode', v)} accent={accent} theme={theme} />
          <SliderRow label="Trigger delay" value={settings.triggerDelay} min={300} max={2000} step={100} display={`${settings.triggerDelay}ms`} onChange={v => update('triggerDelay', v)} accent={accent} theme={theme} />
          <SliderRow label="Min prompt length" value={settings.minPromptLength} min={3} max={30} step={1} display={`${settings.minPromptLength} chars`} onChange={v => update('minPromptLength', v)} accent={accent} theme={theme} />
          <ToggleRow label="Suggestions count" options={['2', '3', '4']} value={String(settings.numSuggestions)} onChange={v => update('numSuggestions', Number(v))} accent={accent} theme={theme} />
          <ToggleRow label="Suggestion style" options={['balanced', 'creative', 'technical']} value={settings.suggestionStyle} onChange={v => update('suggestionStyle', v)} accent={accent} theme={theme} />
        </Section>

        <Section title="APPEARANCE" theme={theme}>
          <SliderRow label="Overlay opacity" value={settings.overlayOpacity} min={0.4} max={1} step={0.05} display={`${Math.round(settings.overlayOpacity * 100)}%`} onChange={v => update('overlayOpacity', v)} accent={accent} theme={theme} />
          <ToggleRow label="Theme" options={['dark', 'light']} labels={['Dark', 'Light']} value={settings.theme} onChange={v => update('theme', v as any)} accent={accent} theme={theme} />
          <ToggleRow label="Accent color" options={['99,153,34', '56,139,253', '210,100,100', '180,100,210']} labels={['green', 'blue', 'red', 'purple']} value={settings.accentColor} onChange={v => update('accentColor', v)} accent={accent} theme={theme} />
        </Section>

        <Section title="SYSTEM" theme={theme}>
          <SwitchRow label="Launch on startup" value={settings.launchOnStartup} onChange={v => { update('launchOnStartup', v); (window as any).vakAPI?.setLaunchOnStartup(v) }} accent={accent} theme={theme} />
          <SwitchRow label="Close to tray" value={settings.closeToTray} onChange={v => update('closeToTray', v)} accent={accent} theme={theme} />
        </Section>

        <Section title="API PROVIDERS (Order of Usage)" theme={theme}>
          {settings.fallbackChain.map((name, i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
              <span style={{ color: theme.textMuted }}>{name}</span>
              <div style={{ display: 'flex', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <Btn disabled={i === 0} onClick={() => { const arr = [...settings.fallbackChain];[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; update('fallbackChain', arr) }} theme={theme}>↑</Btn>
                <Btn disabled={i === settings.fallbackChain.length - 1} onClick={() => { const arr = [...settings.fallbackChain];[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; update('fallbackChain', arr) }} theme={theme}>↓</Btn>
              </div>
            </div>
          ))}
        </Section>

        <Section title="API USAGE" theme={theme}>
          {settings.fallbackChain.map(name => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
              <span style={{ color: theme.textMuted }}>{name}</span>
              <span style={{ color: usage[name] ? `rgba(${accent},0.8)` : theme.textFaint }}>
                {usage[name] ? `${usage[name]} calls` : 'unused'}
              </span>
            </div>
          ))}
          <div onClick={() => { resetUsage(); setUsage({}) }} style={{ padding: '8px 12px', fontSize: '11px', cursor: 'pointer', color: 'rgba(210,100,100,0.7)', textAlign: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            reset usage stats
          </div>
        </Section>

        <Section title="API KEYS" theme={theme}>
          {!editingKeys ? (
            <div onClick={() => { setEditingKeys(true); const keyNames = ['GROQ_API_KEY', 'CEREBRAS_API_KEY', 'SAMBANOVA_API_KEY', 'MISTRAL_API_KEY', 'TOGETHER_API_KEY', 'OPENROUTER_API_KEY', 'COHERE_API_KEY', 'GEMINI_API_KEY']; const current: Record<string, string> = {}; keyNames.forEach(k => { current[k] = getKey(k) }); setKeyValues(current) }}
              style={{ padding: '10px 12px', fontSize: '11px', cursor: 'pointer', color: `rgba(${accent},0.8)`, textAlign: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              edit API keys
            </div>
          ) : (
            <div style={{ padding: '10px 12px' }}>
              {[
                { key: 'GROQ_API_KEY', label: 'Groq' },
                { key: 'CEREBRAS_API_KEY', label: 'Cerebras' },
                { key: 'SAMBANOVA_API_KEY', label: 'SambaNova' },
                { key: 'MISTRAL_API_KEY', label: 'Mistral' },
                { key: 'TOGETHER_API_KEY', label: 'Together' },
                { key: 'OPENROUTER_API_KEY', label: 'OpenRouter' },
                { key: 'COHERE_API_KEY', label: 'Cohere' },
                { key: 'GEMINI_API_KEY', label: 'Gemini' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '3px', letterSpacing: '0.06em' }}>{field.label}</div>
                  <input
                    type="password"
                    value={keyValues[field.key] || ''}
                    onChange={e => setKeyValues(k => ({ ...k, [field.key]: e.target.value }))}
                    placeholder={`${field.label} API key`}
                    style={{ WebkitAppRegion: 'no-drag', width: '100%', background: theme.input, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px 8px', color: theme.text, fontSize: '10px', outline: 'none', fontFamily: 'monospace' } as React.CSSProperties}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <div onClick={async () => { await (window as any).vakAPI?.saveKeys(keyValues); (window as any)._vakKeys = keyValues; setEditingKeys(false) }}
                  style={{ flex: 1, padding: '7px', borderRadius: '6px', cursor: 'pointer', background: `rgba(${accent},0.2)`, border: `1px solid rgba(${accent},0.3)`, color: `rgba(${accent},0.9)`, fontSize: '11px', textAlign: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                  save
                </div>
                <div onClick={() => setEditingKeys(false)}
                  style={{ flex: 1, padding: '7px', borderRadius: '6px', cursor: 'pointer', background: theme.bgCard, border: `1px solid ${theme.borderCard}`, color: theme.textFaint, fontSize: '11px', textAlign: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                  cancel
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="HOTKEYS" theme={theme}>
          <Row label="Toggle overlay" value="Ctrl + Space" theme={theme} />
          <Row label="Copy selected" value="Enter" theme={theme} />
          <Row label="Navigate" value="up / down" theme={theme} />
          <Row label="Hide" value="Esc" theme={theme} />
        </Section>

        <Section title="ABOUT" theme={theme}>
          <Row label="Version" value="0.1.0" theme={theme} />
          <Row label="Named after" value="Vak - The Speech Potency" theme={theme} />
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children, theme }: { title: string, children: React.ReactNode, theme: Theme }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '9px', color: theme.textFaint, letterSpacing: '0.1em', marginBottom: '6px' }}>{title}</div>
      <div style={{ background: theme.sectionBg, border: `1px solid ${theme.borderCard}`, borderRadius: '8px', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, theme }: { label: string, value: string, theme: Theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: theme.textFaint }}>{value}</span>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, display, onChange, accent, theme }: {
  label: string, value: number, min: number, max: number, step: number, display: string, onChange: (v: number) => void, accent: string, theme: Theme
}) {
  return (
    <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: theme.textMuted }}>{label}</span>
        <span style={{ color: theme.textFaint }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: `rgb(${accent})`, WebkitAppRegion: 'no-drag' } as React.CSSProperties} />
    </div>
  )
}

function ToggleRow({ label, options, labels, value, onChange, accent, theme }: {
  label: string, options: string[], labels?: string[], value: string, onChange: (v: string) => void, accent: string, theme: Theme
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {options.map((opt, i) => (
          <div key={opt} onClick={() => onChange(opt)} style={{
            padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
            background: value === opt ? `rgba(${accent},0.2)` : theme.bgCard,
            border: `1px solid ${value === opt ? `rgba(${accent},0.4)` : theme.borderCard}`,
            color: value === opt ? `rgba(${accent},0.9)` : theme.textFaint,
            transition: 'all 0.15s',
          } as React.CSSProperties}>
            {labels ? labels[i] : opt}
          </div>
        ))}
      </div>
    </div>
  )
}

function SwitchRow({ label, value, onChange, accent, theme }: {
  label: string, value: boolean, onChange: (v: boolean) => void, accent: string, theme: Theme
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${theme.borderCard}`, fontSize: '11px' }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width: '32px', height: '18px',
        background: value ? `rgba(${accent},0.6)` : theme.bgCard,
        borderRadius: '9px', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', WebkitAppRegion: 'no-drag',
        border: `1px solid ${theme.borderCard}`,
      } as React.CSSProperties}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '17px' : '3px', width: '12px', height: '12px', background: value ? 'white' : theme.textFaint, borderRadius: '50%', transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled, theme }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, theme: Theme }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      padding: '1px 6px', borderRadius: '3px', cursor: disabled ? 'default' : 'pointer', fontSize: '10px',
      color: disabled ? theme.textFaintest : theme.textMuted,
      border: `1px solid ${disabled ? theme.borderCard : theme.border}`,
      transition: 'all 0.15s',
    } as React.CSSProperties}>
      {children}
    </div>
  )
}

export default SettingsPanel