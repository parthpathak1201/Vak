import { buildMetaPrompt } from '../promptBuilder'
import { getKey } from '../../shared/utils'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function callGemini(userPrompt: string, style: string, numSuggestions: number): Promise<string[]> {
  const apiKey = getKey('GEMINI_API_KEY')
  const metaPrompt = buildMetaPrompt(userPrompt, style, numSuggestions)

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: metaPrompt }] }] })
  })

  if (!response.ok) throw new Error(`${response.status}`)
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return text.split('\n').filter((l: string) => l.match(/^[1-9]\./)).map((l: string) => l.replace(/^[1-9]\.\s*/, '').trim()).filter(Boolean)
}