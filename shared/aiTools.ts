export interface AiTool {
  name: string
  windowTitles: string[]
  urls: string[]
}

export const AI_TOOLS: AiTool[] = [
  {
    name: 'ChatGPT',
    windowTitles: ['ChatGPT', 'chat.openai.com'],
    urls: ['chat.openai.com', 'chatgpt.com'],
  },
  {
    name: 'Claude',
    windowTitles: ['Claude', 'claude.ai'],
    urls: ['claude.ai'],
  },
  {
    name: 'Gemini',
    windowTitles: ['Gemini', 'gemini.google.com', 'Google Gemini'],
    urls: ['gemini.google.com', 'aistudio.google.com'],
  },
  {
    name: 'Perplexity',
    windowTitles: ['Perplexity', 'perplexity.ai'],
    urls: ['perplexity.ai'],
  },
  {
    name: 'Poe',
    windowTitles: ['Poe', 'poe.com'],
    urls: ['poe.com'],
  },
  {
    name: 'Mistral',
    windowTitles: ['Mistral', 'chat.mistral.ai', 'Le Chat'],
    urls: ['chat.mistral.ai'],
  },
  {
    name: 'Copilot',
    windowTitles: ['Copilot', 'copilot.microsoft.com', 'Microsoft Copilot'],
    urls: ['copilot.microsoft.com', 'bing.com/chat'],
  },
  {
    name: 'Grok',
    windowTitles: ['Grok', 'grok.x.ai', 'x.com/grok'],
    urls: ['grok.x.ai', 'x.com/i/grok'],
  },
  {
    name: 'HuggingChat',
    windowTitles: ['HuggingChat', 'huggingface.co'],
    urls: ['huggingface.co/chat'],
  },
  {
    name: 'Cohere Coral',
    windowTitles: ['Coral', 'coral.cohere.com'],
    urls: ['coral.cohere.com'],
  },
  {
    name: 'You.com',
    windowTitles: ['You.com', 'you.com'],
    urls: ['you.com'],
  },
  {
    name: 'Phind',
    windowTitles: ['Phind', 'phind.com'],
    urls: ['phind.com'],
  },
  {
    name: 'Groq',
    windowTitles: ['Groq', 'groq.com'],
    urls: ['groq.com'],
  },
  {
    name: 'DeepSeek',
    windowTitles: ['DeepSeek', 'chat.deepseek.com'],
    urls: ['chat.deepseek.com'],
  },
  {
    name: 'Kagi',
    windowTitles: ['Kagi', 'kagi.com'],
    urls: ['kagi.com/assistant'],
  },
  
  {
    name: 'Notion AI',
    windowTitles: ['Notion'],
    urls: ['notion.so'],
  },
  
]

export function isAiTool(windowTitle: string): AiTool | null {
  const lower = windowTitle.toLowerCase()
  for (const tool of AI_TOOLS) {
    for (const title of tool.windowTitles) {
      if (lower.includes(title.toLowerCase())) {
        return tool
      }
    }
  }
  return null
}