export function buildMetaPrompt(userPrompt: string, style: string, numSuggestions: number): string {
  const styleGuide = {
    balanced: 'Clear, well-structured prompts suitable for any AI tool.',
    creative: 'Imaginative, expressive prompts that encourage creative and unexpected outputs.',
    technical: 'Precise, detailed prompts with specific constraints, formats, and technical requirements.',
  }[style] || 'Clear, well-structured prompts.'

  const wordCount = userPrompt.trim().split(/\s+/).length
  const lengthGuide = wordCount < 20
    ? 'Keep suggestions concise and focused.'
    : wordCount < 100
    ? 'Match the length and depth of the original prompt.'
    : `The original prompt is detailed (${wordCount} words). Your suggestions must be equally detailed and comprehensive — do NOT shorten or summarize. Preserve all context, expand where needed.`

  return `You are a prompt engineering expert. A user has typed the following prompt into an AI tool:

"${userPrompt}"

Generate exactly ${numSuggestions} improved versions of this prompt. Each version should be on a new line, numbered 1 to ${numSuggestions}.
- Version 1: Polished version of the original. Same intent, just cleaner and clearer.
- Version 2: Enhanced version with a persona (e.g. "Act as a...") and more context.
${numSuggestions >= 3 ? `- Version 3: Most detailed version with role, context, format instructions, and constraints.` : ''}
${numSuggestions >= 4 ? `- Version 4: Alternative angle — approaches the goal from a completely different direction.` : ''}

Style guide: ${styleGuide}
Length guide: ${lengthGuide}

Only return the prompts, nothing else. No explanations, no labels, just the prompts numbered 1 to ${numSuggestions}.`
}