import axios from 'axios';

export interface SearchOptions {
  mode: 'auto' | 'human' | 'pre_ai' | 'custom';
  customSites?: string[];
}

/**
 * Performs a web search using Gemini 2.0 Flash with Google Grounding.
 * This is a cost-effective way ("sophisticatedly cheap") to get search results
 * to feed into models that don't have native search (like Claude).
 */
export async function performWebSearch(query: string, options: SearchOptions = { mode: 'auto' }): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[WebSearch] Gemini API key missing, skipping search');
    return '';
  }

  // Construct search query based on mode
  let finalQuery = query;
  let systemContext = '';

  switch (options.mode) {
    case 'human':
      // Anti-AI Slop: Prefer discussions, forums, and established communities
      finalQuery += ' (site:reddit.com OR site:news.ycombinator.com OR site:stackexchange.com OR site:quora.com OR site:medium.com)';
      systemContext = 'Use only human-generated content from discussions and forums. Avoid SEO blogs and AI-generated summaries.';
      break;
    
    case 'pre_ai':
      // Date gate: Before ChatGPT release (approx) to ensure human authorship
      // Note: Google Search operator "before:2023-01-01" might not work perfectly in all API versions,
      // but we can prompt the model to prioritize older sources.
      finalQuery += ' before:2023-01-01';
      systemContext = 'Prioritize information published before 2023. Avoid modern AI-generated content.';
      break;

    case 'custom':
      // User-defined sites only
      if (options.customSites && options.customSites.length > 0) {
        const siteFilter = options.customSites.map(site => `site:${site.trim()}`).join(' OR ');
        finalQuery += ` (${siteFilter})`;
        systemContext = `Restrict answers to information found on these domains: ${options.customSites.join(', ')}.`;
      }
      break;
      
    case 'auto':
    default:
      // Standard search - no query modification
      break;
  }

  console.log(`[WebSearch] Mode: ${options.mode}, Query: "${finalQuery}"`);

  // List of models to try in order of preference (newest/cheapest first)
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  for (const model of candidateModels) {
    try {
      console.log(`[WebSearch] Attempting search with model: ${model}`);
      
      // Different tool definitions for different model versions if needed
      // gemini-2.x uses google_search, gemini-1.5 uses google_search (modern) or googleSearchRetrieval (legacy)
      // We'll try the modern google_search first for all.
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            role: 'user',
            parts: [{ text: `Search the web and provide a comprehensive, factual summary for this query. ${systemContext}\n\nQuery: ${finalQuery}` }]
          }],
          tools: [{
            google_search: {}
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[WebSearch] Success with ${model}`);
        return `[Web Search Results (via ${model})]\n${text}\n[End Search Results]\n\n`;
      } else {
        console.warn(`[WebSearch] No text returned from ${model}, trying next...`);
      }
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      console.warn(`[WebSearch] Failed with ${model} (${status}): ${message}`);
      
      // If it's a 429 (Resource Exhausted) or 5xx, we continue to the next model
      // If it's a 400 (Bad Request), it might be a tool definition issue, but we'll try next anyway just in case
      continue;
    }
  }

  console.error('[WebSearch] All models failed to perform search.');
  return ''; // Fail gracefully
}
