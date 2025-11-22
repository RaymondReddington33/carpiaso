// Pexels API utility functions

export interface PexelsImage {
  url: string
  description: string
  photographer?: string
}

/**
 * Search for images on Pexels based on a query
 */
export async function searchPexelsImage(
  query: string,
  apiKey: string
): Promise<PexelsImage | null> {
  try {
    if (!apiKey || !query) {
      console.warn("[Pexels] Missing API key or query")
      return null
    }

    const searchQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    )

    if (!response.ok) {
      console.error("[Pexels] API error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0]
      return {
        url: photo.src.large || photo.src.medium || photo.src.small,
        description: photo.photographer
          ? `Photo by ${photo.photographer}: ${query}`
          : `Image: ${query}`,
        photographer: photo.photographer,
      }
    }

    return null
  } catch (error) {
    console.error("[Pexels] Error fetching image:", error)
    return null
  }
}

/**
 * Generate Pexels search query from local data
 */
export function generatePexelsQuery(fact: string, country: string, context?: string): string {
  // Stop words to filter out
  const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'o', 'a', 'un', 'una', 'es', 'son', 'con', 'por', 'para', 'que', 'se', 'le', 'les', 'lo', 'al', 'unos', 'unas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'the', 'is', 'are', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  
  // Extract key terms from fact (remove common words and punctuation)
  const factWords = fact
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 3) // Take first 3 meaningful words
  
  // Extract key terms from context if provided
  const contextWords = context
    ? context
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word))
        .slice(0, 2) // Take first 2 meaningful words
    : []
  
  // Combine: fact keywords + country + context keywords
  const queryParts = [
    ...factWords,
    country,
    ...contextWords
  ].filter(Boolean)
  
  // Limit to 5 words max for better search results
  return queryParts.slice(0, 5).join(" ").trim()
}

