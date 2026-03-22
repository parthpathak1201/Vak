import { buildMetaPrompt } from '../promptBuilder'
import { getKey } from '../../shared/utils'
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'

export async function callTogether(userPrompt: string, style: string, numSuggestions: number): Promise<string[]> {
  const apiKey = getKey('TOGETHER_API_KEY')
  const metaPrompt = buildMetaPrompt(userPrompt, style, numSuggestions)

  const response = await fetch(TOGETHER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', messages: [{ role: 'user', content: metaPrompt }], max_tokens: 1000 })
  })

  if (!response.ok) throw new Error(`${response.status}`)
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  return text.split('\n').filter((l: string) => l.match(/^[1-9]\./)).map((l: string) => l.replace(/^[1-9]\.\s*/, '').trim()).filter(Boolean)
}