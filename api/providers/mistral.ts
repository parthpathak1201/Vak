import { buildMetaPrompt } from '../promptBuilder'
import { getKey } from '../../shared/utils'
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

export async function callMistral(userPrompt: string, style: string, numSuggestions: number): Promise<string[]> {
  const apiKey = getKey('MISTRAL_API_KEY')
  const metaPrompt = buildMetaPrompt(userPrompt, style, numSuggestions)

  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'user', content: metaPrompt }], max_tokens: 1000 })
  })

  if (!response.ok) throw new Error(`${response.status}`)
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  return text.split('\n').filter((l: string) => l.match(/^[1-9]\./)).map((l: string) => l.replace(/^[1-9]\.\s*/, '').trim()).filter(Boolean)
}