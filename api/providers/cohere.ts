import { buildMetaPrompt } from '../promptBuilder'
import { getKey } from '../../shared/utils'
const COHERE_URL = 'https://api.cohere.com/v2/chat'

export async function callCohere(userPrompt: string, style: string, numSuggestions: number): Promise<string[]> {
  const apiKey = getKey('COHERE_API_KEY')
  const metaPrompt = buildMetaPrompt(userPrompt, style, numSuggestions)

  const response = await fetch(COHERE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'command-r', messages: [{ role: 'user', content: metaPrompt }] })
  })

  if (!response.ok) throw new Error(`${response.status}`)
  const data = await response.json()
  const text = data.message?.content?.[0]?.text ?? ''

  return text.split('\n').filter((l: string) => l.match(/^[1-9]\./)).map((l: string) => l.replace(/^[1-9]\.\s*/, '').trim()).filter(Boolean)
}