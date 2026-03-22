type PromptCategory = 'creative' | 'technical' | 'conversational' | 'analytical' | 'default'

const patterns: Record<PromptCategory, RegExp[]> = {
  creative: [
    /\b(write|story|poem|creative|imagine|fiction|novel|script|blog|essay|narrative|describe)\b/i,
    /\b(song|lyrics|character|plot|scene|dialogue|metaphor|art)\b/i,
  ],
  technical: [
    /\b(code|function|bug|debug|algorithm|api|database|implement|error|fix|programming)\b/i,
    /\b(python|javascript|typescript|sql|html|css|react|node|git|docker)\b/i,
    /\b(technical|architecture|system|design|pattern|framework|library)\b/i,
  ],
  analytical: [
    /\b(analyze|analyse|compare|evaluate|explain|summarize|review|assess|research)\b/i,
    /\b(pros|cons|advantages|disadvantages|difference|versus|vs|better|best)\b/i,
    /\b(data|statistics|numbers|metrics|performance|results|findings)\b/i,
  ],
  conversational: [
    /\b(email|message|reply|respond|text|letter|chat|talk|communicate|tell)\b/i,
    /\b(professional|formal|informal|friendly|polite|tone|style)\b/i,
  ],
  default: [],
}

export function classifyPrompt(prompt: string): PromptCategory {
  const scores: Record<PromptCategory, number> = {
    creative: 0,
    technical: 0,
    conversational: 0,
    analytical: 0,
    default: 0,
  }

  for (const [category, regexes] of Object.entries(patterns) as [PromptCategory, RegExp[]][]) {
    for (const regex of regexes) {
      if (regex.test(prompt)) scores[category]++
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? best[0] as PromptCategory : 'default'
}

export function getOptimalProviderOrder(prompt: string, fallbackChain: string[]): string[] {
  const category = classifyPrompt(prompt)

  const preferredOrder: Record<PromptCategory, string[]> = {
    creative:       ['Together', 'Mistral', 'Groq', 'Cerebras', 'SambaNova', 'OpenRouter', 'Cohere', 'Gemini'],
    technical:      ['Groq', 'Cerebras', 'Mistral', 'Together', 'SambaNova', 'OpenRouter', 'Cohere', 'Gemini'],
    conversational: ['Mistral', 'Cohere', 'Groq', 'Together', 'Cerebras', 'SambaNova', 'OpenRouter', 'Gemini'],
    analytical:     ['SambaNova', 'Groq', 'Mistral', 'Together', 'Cerebras', 'OpenRouter', 'Cohere', 'Gemini'],
    default:        ['Cerebras', 'Groq', 'SambaNova', 'Together', 'Mistral', 'OpenRouter', 'Cohere', 'Gemini'],
  }

  const preferred = preferredOrder[category]

  // Sort the user's fallback chain by the preferred order for this category
  return [...fallbackChain].sort((a, b) => {
    const ai = preferred.indexOf(a)
    const bi = preferred.indexOf(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}