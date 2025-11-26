import { NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

interface AppStoreData {
  title: string
  description: string
  category: string
  icon?: string
  rating?: number
  reviews?: number
  screenshots?: string[]
  developer?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { appData, apiKey } = body

    if (!appData) {
      return NextResponse.json(
        { error: "Missing app data" },
        { status: 400 }
      )
    }

    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const openai = createOpenAI({
      apiKey: openaiApiKey,
    })

    // Build prompt for intelligent suggestions
    const prompt = `You are an ASO (App Store Optimization) expert. Analyze the following app data and provide intelligent suggestions.

**APP DATA:**
- Name: ${appData.title || "Not provided"}
- Category: ${appData.category || "Not provided"}
- Description: ${appData.description || "Not provided"}
- Developer: ${appData.developer || "Not provided"}
- Rating: ${appData.rating || "Not provided"}
- Reviews: ${appData.reviews || "Not provided"}

**TASK:**
Generate intelligent suggestions for this app:

1. **KEYWORDS** (minimum 15-20):
   - Primary keywords (high volume, high intent)
   - Long-tail keywords (lower competition)
   - Category-specific keywords
   - Competitor brand + category combinations
   - For each keyword, provide:
     * keyword: the actual keyword
     * intent: user intent (informational, transactional, navigational)
     * searchVolume: estimated volume (High/Medium/Low)
     * competition: competition level (High/Medium/Low)

2. **COMPETITORS** (minimum 5-10):
   - Direct competitors (same category, similar features)
   - Indirect competitors (different approach, same problem)
   - For each competitor, provide:
     * name: competitor app name
     * reason: why this is a relevant competitor
     * url: if you can suggest a likely App Store URL (optional)

3. **MARKET OPPORTUNITIES** (minimum 3-5):
   - Countries/markets with growth potential
   - For each market, provide:
     * country: country name
     * language: primary language
     * opportunity: why this market is promising

4. **RECOMMENDATIONS**:
   - Overall ASO strategy recommendations
   - Category optimization suggestions
   - Keyword strategy insights
   - Market expansion opportunities

**OUTPUT FORMAT (JSON):**
{
  "keywords": [
    {
      "keyword": "example keyword",
      "intent": "transactional",
      "searchVolume": "High",
      "competition": "Medium"
    }
  ],
  "competitors": [
    {
      "name": "Competitor App Name",
      "reason": "Direct competitor with similar features",
      "url": "https://apps.apple.com/..." (optional)
    }
  ],
  "markets": [
    {
      "country": "Spain",
      "language": "Spanish",
      "opportunity": "Growing market with low competition"
    }
  ],
  "recommendations": "Overall strategy recommendations..."
}

**IMPORTANT:**
- All suggestions must be relevant to the app's category and features
- Keywords should be realistic and searchable
- Competitors should be actual apps in the same space
- Markets should have real growth potential
- Be specific and actionable`

    console.log("[AutoSuggest] Generating suggestions for:", appData.title)

    const response = await openai("gpt-4o").generateText({
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const text = response.text.trim()
    
    // Try to parse JSON from the response
    let suggestions
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      suggestions = JSON.parse(jsonText)
    } catch (error) {
      console.error("[AutoSuggest] Error parsing JSON:", error)
      // Fallback: try to extract structured data from text
      suggestions = {
        keywords: [],
        competitors: [],
        markets: [],
        recommendations: text,
      }
    }

    console.log("[AutoSuggest] Suggestions generated:", {
      keywords: suggestions.keywords?.length || 0,
      competitors: suggestions.competitors?.length || 0,
      markets: suggestions.markets?.length || 0,
    })

    return NextResponse.json({
      success: true,
      suggestions: {
        aiKeywords: suggestions.keywords || [],
        aiCompetitors: suggestions.competitors || [],
        aiMarkets: suggestions.markets || [],
        recommendations: suggestions.recommendations || "",
      },
    })
  } catch (error: any) {
    console.error("[AutoSuggest] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate suggestions" },
      { status: 500 }
    )
  }
}

