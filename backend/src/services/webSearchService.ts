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

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    const groundingMetadata = response.data?.candidates?.[0]?.groundingMetadata;
    
    // You could also extract source links from groundingMetadata.groundingChunks if needed
    // For now, we just return the summarized text which incorporates the search results

    if (!text) return '';
    
    return `[Web Search Results]\n${text}\n[End Search Results]\n\n`;
  } catch (error) {
    console.error('[WebSearch] Failed to perform search:', error);
    return ''; // Fail gracefully (continue without search context)
  }
}
