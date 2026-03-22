import { useState } from 'react'

type Props = {
  onComplete: () => void
}

const API_FIELDS = [
  { key: 'GROQ_API_KEY', label: 'Groq', link: 'https://console.groq.com', required: true },
  { key: 'CEREBRAS_API_KEY', label: 'Cerebras', link: 'https://cloud.cerebras.ai', required: false },
  { key: 'SAMBANOVA_API_KEY', label: 'SambaNova', link: 'https://cloud.sambanova.ai', required: false },
  { key: 'MISTRAL_API_KEY', label: 'Mistral', link: 'https://console.mistral.ai', required: false },
  { key: 'TOGETHER_API_KEY', label: 'Together AI', link: 'https://api.together.xyz', required: false },
  { key: 'OPENROUTER_API_KEY', label: 'OpenRouter', link: 'https://openrouter.ai', required: false },
  { key: 'COHERE_API_KEY', label: 'Cohere', link: 'https://dashboard.cohere.com', required: false },
  { key: 'GEMINI_API_KEY', label: 'Gemini', link: 'https://aistudio.google.com/app/apikey', required: false },
]

function Setup({ onComplete }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!keys['GROQ_API_KEY']?.trim()) {
      setError('Groq API key is required to get started.')
      return
    }
    setSaving(true)
    await (window as any).vakAPI.saveKeys(keys)
    setSaving(false)
    onComplete()
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'rgba(12, 12, 16, 0.97)',
      backdropFilter: 'blur(20px)',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'white',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '20px 18px' }}>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.12em', marginBottom: '4px' }}>
            VAK
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            Add your API keys to get started. All keys are encrypted and stored locally.
          </div>
        </div>

        {API_FIELDS.map(field => (
          <div key={field.key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                {field.label}{field.required && <span style={{ color: 'rgba(210,100,100,0.8)' }}> *</span>}
              </span>
              <span
                onClick={() => window.open(field.link)}
                style={{ fontSize: '9px', color: 'rgba(99,153,34,0.7)', cursor: 'pointer', letterSpacing: '0.04em', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                get key
              </span>
            </div>
            <input
              type="password"
              placeholder={`${field.label} API key`}
              value={keys[field.key] || ''}
              onChange={e => setKeys(k => ({ ...k, [field.key]: e.target.value }))}
              style={{
                WebkitAppRegion: 'no-drag',
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '7px 10px',
                color: 'white',
                fontSize: '11px',
                outline: 'none',
                fontFamily: 'monospace',
              } as React.CSSProperties}
            />
          </div>
        ))}

        {error && (
          <div style={{ fontSize: '11px', color: 'rgba(210,100,100,0.9)', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div
          onClick={handleSave}
          style={{
            WebkitAppRegion: 'no-drag',
            marginTop: '14px',
            width: '100%',
            padding: '10px',
            background: saving ? 'rgba(99,153,34,0.2)' : 'rgba(99,153,34,0.3)',
            border: '1px solid rgba(99,153,34,0.4)',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: saving ? 'default' : 'pointer',
            fontSize: '12px',
            color: 'rgba(99,153,34,0.9)',
            fontWeight: '500',
            letterSpacing: '0.06em',
            transition: 'all 0.15s',
          } as React.CSSProperties}
        >
          {saving ? 'saving...' : 'save and continue'}
        </div>

        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
          keys are encrypted using your system secure storage
        </div>

      </div>
    </div>
  )
}

export default Setup