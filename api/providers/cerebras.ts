const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
import { getKey } from '../../shared/utils'

export async function callCerebras(userPrompt: string): Promise<string[]> {

  const apiKey = getKey('CEREBRAS_API_KEY')

  const metaPrompt = `You are a prompt engineering expert. A user has typed the following prompt into an AI tool:

"${userPrompt}"

Generate exactly 3 improved versions of this prompt. Each version should be on a new line, numbered 1, 2, 3.
- Version 1: Polished version of the original. Same intent, just cleaner and clearer.
- Version 2: Enhanced version with a persona and more context.
- Version 3: Most detailed version with role, context, format instructions, and constraints.

Only return the 3 prompts, nothing else. No explanations, no labels, just the prompts numbered 1, 2, 3.`

  const response = await fetch(CEREBRAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama3.1-70b',
      messages: [{ role: 'user', content: metaPrompt }],
      max_tokens: 1000,
    })
  })

  if (!response.ok) throw new Error(`${response.status}`)

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  return text
    .split('\n')
    .filter((line: string) => line.match(/^[123]\./))
    .map((line: string) => line.replace(/^[123]\.\s*/, '').trim())
}