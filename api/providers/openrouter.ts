import { buildMetaPrompt } from '../promptBuilder'
import { getKey } from '../../shared/utils'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function callOpenRouter(userPrompt: string, style: string, numSuggestions: number): Promise<string[]> {
  const apiKey = getKey('OPENROUTER_API_KEY')
  const metaPrompt = buildMetaPrompt(userPrompt, style, numSuggestions)

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages: [{ role: 'user', content: metaPrompt }] })
  })

  if (!response.ok) throw new Error(`${response.status}`)
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  return text.split('\n').filter((l: string) => l.match(/^[1-9]\./)).map((l: string) => l.replace(/^[1-9]\.\s*/, '').trim()).filter(Boolean)
}