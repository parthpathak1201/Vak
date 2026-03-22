import { callGemini } from './providers/gemini'
import { callGroq } from './providers/groq'
import { callMistral } from './providers/mistral'
import { callCohere } from './providers/cohere'
import { callOpenRouter } from './providers/openrouter'
import { callCerebras } from './providers/cerebras'
import { callSambaNova } from './providers/sambanova'
import { callTogether } from './providers/together'
import { DEFAULT_SETTINGS, Settings } from '../shared/constants'
import { recordUsage } from '../shared/utils'
import { getOptimalProviderOrder, classifyPrompt } from './promptClassifier'

type Provider = {
  name: string
  call: (prompt: string, style: string, num: number) => Promise<string[]>
}

const allProviders: Provider[] = [
  { name: 'Groq', call: callGroq },
  { name: 'Cerebras', call: callCerebras },
  { name: 'SambaNova', call: callSambaNova },
  { name: 'Mistral', call: callMistral },
  { name: 'Together', call: callTogether },
  { name: 'OpenRouter', call: callOpenRouter },
  { name: 'Cohere', call: callCohere },
  { name: 'Gemini', call: callGemini },
]

export async function getSuggestions(
  userPrompt: string,
  settings: Settings = DEFAULT_SETTINGS
): Promise<{ suggestions: string[], provider: string }> {  
  if (!userPrompt || userPrompt.trim().length < settings.minPromptLength)
    return { suggestions: [], provider: '' }  

  const optimalOrder = getOptimalProviderOrder(userPrompt, settings.fallbackChain)
  const category = classifyPrompt(userPrompt)
  console.log(`Prompt category: ${category} → optimal order: ${optimalOrder.join(', ')}`)

  const orderedProviders = allProviders
    .filter(p => optimalOrder.includes(p.name))
    .sort((a, b) => optimalOrder.indexOf(a.name) - optimalOrder.indexOf(b.name))

  for (const provider of orderedProviders) {
    try {
      console.log(`Trying ${provider.name}...`)
      const suggestions = await provider.call(userPrompt, settings.suggestionStyle, settings.numSuggestions)
      if (suggestions.length > 0) {
        console.log(`Success with ${provider.name}`)
        recordUsage(provider.name)
        return { suggestions, provider: provider.name }  
      }
    } catch (err: any) {
      console.warn(`${provider.name} failed:`, err.message)
      continue
    }
  }
  userPrompt = ''
  return { suggestions: [], provider: '' }  
}