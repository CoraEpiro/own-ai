import axios from 'axios';

/**
 * Performs a web search using Gemini 2.0 Flash with Google Grounding.
 * This is a cost-effective way ("sophisticatedly cheap") to get search results
 * to feed into models that don't have native search (like Claude).
 */
export async function performWebSearch(query: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[WebSearch] Gemini API key missing, skipping search');
    return '';
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          role: 'user',
          parts: [{ text: `Search the web and provide a comprehensive, factual summary for this query: "${query}". Include relevant details, numbers, and dates. If the query asks for current events/stats, prioritize the latest data.\n\nQuery: ${query}` }]
        }],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.3
            }
          }
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
