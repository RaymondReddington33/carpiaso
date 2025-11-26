import { streamObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { asoReportSchema } from "@/lib/schemas"

export const maxDuration = 60

// Pexels API function to search for images
async function searchPexelsImage(query: string, apiKey: string): Promise<{ url: string; description: string } | null> {
  try {
    if (!apiKey || !query) return null

    const searchQuery = encodeURIComponent(query)
    const response = await fetch(`https://api.pexels.com/v1/search?query=${searchQuery}&per_page=1&orientation=landscape`, {
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      console.error("[ASO] Pexels API error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0]
      return {
        url: photo.src.large || photo.src.medium || photo.src.small,
        description: `${photo.photographer}'s photo: ${query}`,
      }
    }

    return null
  } catch (error) {
    console.error("[ASO] Error fetching Pexels image:", error)
    return null
  }
}

interface AppStoreData {
  title: string
  description: string
  screenshots: string[]
  iconUrl?: string // App icon URL
  rating?: number
  reviewsCount?: number
  price?: string
  category?: string
  developer?: string
  version?: string
  lastUpdated?: string
  keywords?: string[]
  subtitle?: string
  releaseNotes?: string
}

async function fetchAppStorePage(url: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return await res.text()
  } catch (error) {
    console.error("[ASO] Error fetching page:", error)
    return ""
  }
}

export async function extractAppStoreData(url: string, platform: "ios" | "android"): Promise<AppStoreData> {
  const data: AppStoreData = {
    title: "",
    description: "",
    screenshots: [],
  }

  try {
    if (!url) return data

    console.log(`[ASO] Extracting data from ${platform} URL:`, url)
    const html = await fetchAppStorePage(url)

    if (!html) return data

    if (platform === "ios") {
      // Extract iOS App Store data
      const titleMatch = html.match(/<h1[^>]*class="[^"]*product-header__title[^"]*"[^>]*>(.*?)<\/h1>/s) ||
                         html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/) ||
                         html.match(/<title>([^<]+)<\/title>/)
      data.title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : ""

      const subtitleMatch = html.match(/<h2[^>]*class="[^"]*product-header__subtitle[^"]*"[^>]*>(.*?)<\/h2>/s) ||
                             html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/)
      data.subtitle = subtitleMatch ? subtitleMatch[1].replace(/<[^>]+>/g, "").trim() : ""

      // Description
      const descMatch = html.match(/<div[^>]*class="[^"]*product-review[^"]*"[^>]*>.*?<p[^>]*>(.*?)<\/p>/s) ||
                        html.match(/<div[^>]*class="[^"]*section__description[^"]*"[^>]*>(.*?)<\/div>/s) ||
                        html.match(/<meta\s+name="description"\s+content="([^"]+)"/)
      data.description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().substring(0, 1000) : ""

      // Rating
      const ratingMatch = html.match(/"ratingValue":\s*([\d.]+)/) ||
                          html.match(/<span[^>]*class="[^"]*we-rating[^"]*"[^>]*>([\d.]+)/)
      data.rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined

      // Reviews count
      const reviewsMatch = html.match(/"reviewCount":\s*(\d+)/) ||
                           html.match(/(\d+)\s*ratings/i)
      data.reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1]) : undefined

      // Icon
      const iconMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*mzstatic\.com[^"]*icon[^"]*)"[^"]*"/) ||
                        html.match(/<img[^>]*class="[^"]*product-header__icon[^"]*"[^>]*src="([^"]+)"/) ||
                        html.match(/<meta\s+name="apple-itunes-app"\s+content="[^"]*icon=([^"]+)"/)
      if (iconMatch && iconMatch[1]) {
        data.iconUrl = iconMatch[1]
      }

      // Screenshots
      const screenshotMatches = html.matchAll(/<img[^>]*src="([^"]*mzstatic\.com[^"]*)"[^>]*>/g)
      for (const match of screenshotMatches) {
        if (match[1] && !data.screenshots.includes(match[1]) && data.screenshots.length < 5) {
          data.screenshots.push(match[1])
        }
      }

      // Developer
      const devMatch = html.match(/<a[^>]*class="[^"]*link[^"]*"[^>]*href="[^"]*developer[^"]*"[^>]*>(.*?)<\/a>/s) ||
                       html.match(/"sellerName":\s*"([^"]+)"/)
      data.developer = devMatch ? devMatch[1].replace(/<[^>]+>/g, "").trim() : undefined

      // Category
      const catMatch = html.match(/<a[^>]*class="[^"]*link[^"]*"[^>]*href="[^"]*genre[^"]*"[^>]*>(.*?)<\/a>/s)
      data.category = catMatch ? catMatch[1].replace(/<[^>]+>/g, "").trim() : undefined

    } else {
      // Extract Google Play Store data
      const titleMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>(.*?)<\/h1>/s) ||
                         html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/) ||
                         html.match(/<title>([^<]+)<\/title>/)
      data.title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : ""

      // Description
      const descMatch = html.match(/<div[^>]*jsname="[^"]*sngebd[^"]*"[^>]*>(.*?)<\/div>/s) ||
                        html.match(/<div[^>]*itemprop="description"[^>]*>(.*?)<\/div>/s) ||
                        html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/)
      data.description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().substring(0, 1000) : ""

      // Rating
      const ratingMatch = html.match(/"ratingValue":\s*([\d.]+)/) ||
                          html.match(/<div[^>]*class="[^"]*BHMmbe[^"]*"[^>]*>([\d.]+)/)
      data.rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined

      // Reviews count
      const reviewsMatch = html.match(/"reviewCount":\s*(\d+)/) ||
                           html.match(/(\d+)\s*reviews/i)
      data.reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1]) : undefined

      // Icon
      const iconMatch = html.match(/<img[^>]*itemprop="image"[^>]*src="([^"]+)"[^>]*>/) ||
                        html.match(/<meta\s+property="og:image"\s+content="([^"]*googleusercontent\.com[^"]*icon[^"]*)"[^"]*"/) ||
                        html.match(/<img[^>]*alt="[^"]*icon[^"]*"[^>]*src="([^"]+)"/i)
      if (iconMatch && iconMatch[1]) {
        data.iconUrl = iconMatch[1]
      }

      // Screenshots
      const screenshotMatches = html.matchAll(/<img[^>]*src="([^"]*googleusercontent\.com[^"]*)"[^>]*>/g)
      for (const match of screenshotMatches) {
        if (match[1] && !data.screenshots.includes(match[1]) && data.screenshots.length < 5) {
          data.screenshots.push(match[1])
        }
      }

      // Developer
      const devMatch = html.match(/<a[^>]*itemprop="author"[^>]*>.*?<span[^>]*>(.*?)<\/span>/s) ||
                       html.match(/"author":\s*"([^"]+)"/)
      data.developer = devMatch ? devMatch[1].replace(/<[^>]+>/g, "").trim() : undefined

      // Category
      const catMatch = html.match(/<a[^>]*itemprop="genre"[^>]*>(.*?)<\/a>/s) ||
                       html.match(/"applicationCategory":\s*"([^"]+)"/)
      data.category = catMatch ? catMatch[1].replace(/<[^>]+>/g, "").trim() : undefined
    }

    console.log(`[ASO] Extracted data for ${platform}:`, {
      title: data.title,
      screenshots: data.screenshots.length,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
    })

    return data
  } catch (error) {
    console.error(`[ASO] Error extracting ${platform} data:`, error)
    return data
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { appName, platforms, appUrls, country, language, category, keywords, competitors, apiKey, pexelsApiKey } = body

    // Use API keys from request body (from localStorage) or fallback to env variables
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY
    const pexelsKey = pexelsApiKey || process.env.PEXELS_API_KEY
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY. Please configure it in Settings." }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    if (!appName || !platforms || !country || !language || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    console.log("[ASO] Starting report generation for:", appName, country, language)

    // Extract real data from app stores
    const iosData = appUrls?.ios ? await extractAppStoreData(appUrls.ios, "ios") : null
    const androidData = appUrls?.android ? await extractAppStoreData(appUrls.android, "android") : null
    
    // Extract competitor data
    const competitorData: AppStoreData[] = []
    if (competitors && competitors.length > 0) {
      for (const comp of competitors) {
        if (comp.iosUrl) {
          const data = await extractAppStoreData(comp.iosUrl, "ios")
          if (data.title) competitorData.push(data)
        }
        if (comp.androidUrl) {
          const data = await extractAppStoreData(comp.androidUrl, "android")
          if (data.title) competitorData.push(data)
        }
      }
    }

    const allScreenshots = [
      ...(iosData?.screenshots || []),
      ...(androidData?.screenshots || []),
    ]

    // Prepare app visual assets for the prompt
    const appVisualAssets = {
      iconUrl: iosData?.iconUrl || androidData?.iconUrl,
      screenshots: allScreenshots,
      platforms: platforms,
    }
    
    console.log("[ASO] Extracted real data:", {
      ios: iosData ? { title: iosData.title, rating: iosData.rating, screenshots: iosData.screenshots.length, icon: !!iosData.iconUrl } : null,
      android: androidData ? { title: androidData.title, rating: androidData.rating, screenshots: androidData.screenshots.length, icon: !!androidData.iconUrl } : null,
      competitors: competitorData.length,
      appIcon: !!appVisualAssets.iconUrl,
    })

    // Build comprehensive prompt with real data
    let appDataSection = `\n## APP ACTUAL - DADES REALS:\n\n`
    
    if (iosData) {
      appDataSection += `**iOS App Store:**
- Títol: ${iosData.title || appName}
${iosData.subtitle ? `- Subtítol: ${iosData.subtitle}` : ""}
- Descripció: ${iosData.description ? iosData.description.substring(0, 500) + "..." : "No disponible"}
- Rating: ${iosData.rating ? `${iosData.rating}/5` : "No disponible"}${iosData.reviewsCount ? ` (${iosData.reviewsCount} reviews)` : ""}
- Desenvolupador: ${iosData.developer || "No disponible"}
- Categoria: ${iosData.category || category}
- Icono: ${iosData.iconUrl || "No disponible"}
- Screenshots: ${iosData.screenshots.length} imatges proporcionades
- URLs de Screenshots iOS:
${iosData.screenshots.map((url, idx) => `  ${idx + 1}. ${url}`).join("\n")}
- URL Icono iOS: ${iosData.iconUrl || "No disponible"}\n\n`
    }

    if (androidData) {
      appDataSection += `**Google Play Store:**
- Títol: ${androidData.title || appName}
- Descripció: ${androidData.description ? androidData.description.substring(0, 500) + "..." : "No disponible"}
- Rating: ${androidData.rating ? `${androidData.rating}/5` : "No disponible"}${androidData.reviewsCount ? ` (${androidData.reviewsCount} reviews)` : ""}
- Desenvolupador: ${androidData.developer || "No disponible"}
- Categoria: ${androidData.category || category}
- Icono: ${androidData.iconUrl || "No disponible"}
- Screenshots: ${androidData.screenshots.length} imatges proporcionades
- URLs de Screenshots Android:
${androidData.screenshots.map((url, idx) => `  ${idx + 1}. ${url}`).join("\n")}
- URL Icono Android: ${androidData.iconUrl || "No disponible"}\n\n`
    }

    let competitorSection = `\n## COMPETIDORS - DADES REALS:\n\n`
    if (competitorData.length > 0) {
      competitorData.forEach((comp, idx) => {
        competitorSection += `**Competidor ${idx + 1}:**
- Títol: ${comp.title}
- Descripció: ${comp.description ? comp.description.substring(0, 300) + "..." : "No disponible"}
- Rating: ${comp.rating ? `${comp.rating}/5` : "No disponible"}${comp.reviewsCount ? ` (${comp.reviewsCount} reviews)` : ""}
- Categoria: ${comp.category || "No disponible"}
- Icono: ${comp.iconUrl || "No disponible"}
- Screenshots: ${comp.screenshots.length} imatges proporcionades
- URLs de Screenshots:
${comp.screenshots.map((url, i) => `  ${i + 1}. ${url}`).join("\n")}
- URL Icono: ${comp.iconUrl || "No disponible"}

**UTILITZA AQUESTES DADES REALS** per a l'anàlisi de competidors. Compara iconos, screenshots i paletes de colors amb les dades reals de l'app.\n\n`
      })
    } else {
      competitorSection += "No s'han proporcionat competidors. Identifica els principals competidors locals automàticament.\n\n"
    }

    // Add app visual assets section
    let appAssetsSection = `\n## ASSETS VISUALS DE L'APP - DADES REALS:\n\n`
    appAssetsSection += `- Icono: ${appVisualAssets.iconUrl || "No disponible"}
- Screenshots: ${appVisualAssets.screenshots.length} imatges proporcionades
- Plataformes: ${appVisualAssets.platforms.join(", ")}
- URLs de Screenshots:
${appVisualAssets.screenshots.map((url, i) => `  ${i + 1}. ${url}`).join("\n")}
- URL Icono: ${appVisualAssets.iconUrl || "No disponible"}\n\n`

    // Universal Category Detection System
    const appCategory = category.toLowerCase()
    const appDescription = (iosData?.description || androidData?.description || "").toLowerCase()
    const appTitle = (iosData?.title || androidData?.title || appName).toLowerCase()
    const appFeatures = (iosData?.subtitle || "").toLowerCase()
    
    // Universal category mapping
    const categoryMap: Record<string, string[]> = {
      games: ["game", "play", "puzzle", "casino", "rpg", "strategy", "narrative", "kids", "hypercasual", "chess", "ajedrez", "scacchi", "schach", "échecs"],
      fintech: ["finance", "bank", "money", "payment", "wallet", "crypto", "investment", "accounting", "finanza", "banca"],
      travel: ["travel", "trip", "viaje", "viaggio", "hotel", "booking", "flight", "airport", "navigat"],
      health: ["health", "fitness", "workout", "exercise", "gym", "training", "diet", "meditation", "sleep", "wellness"],
      education: ["education", "learn", "study", "curso", "corso", "aprender", "school", "university", "course"],
      social: ["social", "chat", "message", "connect", "community", "dating", "meet"],
      productivity: ["productivity", "task", "todo", "organize", "manage", "calendar", "notes", "email"],
      music: ["music", "song", "audio", "playlist", "stream", "radio", "podcast"],
      photo: ["photo", "camera", "image", "picture", "edit", "gallery", "filter"],
      shopping: ["shopping", "marketplace", "retail", "coupon", "buy", "purchase", "store"],
      food: ["food", "restaurant", "comida", "ristorante", "delivery", "order", "recipe", "cooking"],
      mobility: ["parking", "park", "aparcar", "parcheggio", "estacionamiento", "zona azul", "ztl", "mobility", "transport", "scooter", "car"],
      ai: ["ai", "chatbot", "assistant", "gpt", "artificial intelligence", "machine learning"],
      kids: ["kids", "children", "child", "toy", "learning game", "storybook"],
      business: ["business", "crm", "erp", "meeting", "saas", "enterprise", "b2b"],
      utilities: ["utility", "vpn", "cleaner", "battery", "file manager", "tool"],
    }
    
    // Detect category
    let detectedCategory = category.toLowerCase()
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => 
        appTitle.includes(kw) || 
        appDescription.includes(kw) || 
        appFeatures.includes(kw) || 
        appCategory.includes(kw)
      )) {
        detectedCategory = cat
        break
      }
    }
    
    // If category is still generic, try to infer from category field
    if (detectedCategory === category.toLowerCase() && category.toLowerCase() !== "general") {
      // Map common category names to our system
      const categoryAliases: Record<string, string> = {
        "games": "games",
        "entertainment": "games",
        "finance": "fintech",
        "travel": "travel",
        "health & fitness": "health",
        "medical": "health",
        "education": "education",
        "social networking": "social",
        "productivity": "productivity",
        "music": "music",
        "photo & video": "photo",
        "shopping": "shopping",
        "food & drink": "food",
        "navigation": "mobility",
        "utilities": "utilities",
        "business": "business",
        "lifestyle": "health",
      }
      detectedCategory = categoryAliases[category.toLowerCase()] || detectedCategory
    }

    // UL-ASO Engine System Prompt
    const systemPrompt = `You are the Universal Localized ASO Intelligence Engine (UL-ASO Engine).

Your mission is to generate hyper-localized ASO reports for any app in the world, regardless of its category, country, language, or vertical.

**CORE RULES:**

1. **AUTOMATIC CATEGORY DETECTION**
   Given the app name, description, and features, determine its true category:
   - Games (casual, midcore, puzzle, casino, kids, narrative...)
   - Fintech / Finance
   - Travel
   - Health & Wellness
   - Fitness
   - Education
   - Social
   - Messaging
   - Photography
   - Tools / Utilities
   - Productivity
   - AI / Chatbot
   - Music / Audio
   - Video
   - Shopping / Retail
   - Food / Delivery
   - Transport / Mobility
   - B2B
   - Professional SaaS
   - News
   - Home / Smart Home
   - Kids
   - And any other category

2. **DEEP CULTURALIZATION**
   Adapt recommendations to:
   - Local lifestyle
   - Daily routines
   - Usual schedules
   - Cultural sensitivities
   - Visual norms
   - Recognizable iconography
   - Real urban landscapes
   - Local signage
   - Colors and aesthetics compatible with culture
   - Seasonality
   - Climate
   - Country events
   - Specific regulations (if applicable)
   - Relevant cities

3. **CATEGORY-ADAPTED SCREENSHOT RECOMMENDATIONS**
   Each category has its own DOs/DON'Ts. Adjust:
   - Image type
   - Visual style
   - Characters (if applicable)
   - Real or conceptual UI
   - Claims
   - Design
   - Icons
   - Expected emotions
   - Hierarchy

4. **ULTRA-LOCAL LANGUAGE AND TONE**
   Generate:
   - Real expressions
   - Common phrases
   - Country's preferred tone
   - Formal vs informal level
   - Claims that connect emotionally
   - CTAs used by similar apps in that market

5. **LOCAL COMPETITOR ANALYSIS (SAME CATEGORY + COUNTRY)**
   Analyze:
   - Top apps in the country in that category
   - Common claims
   - Visual patterns
   - Palettes
   - Cultural concepts
   - Strong promises
   - Repeated benefits
   - Trust elements

6. **LOCALIZED UI PATTERNS**
   Include:
   - Recommended palettes
   - Culturally preferred typographies
   - Visual emotions
   - Country's habitual composition

7. **ALWAYS DELIVER THE REPORT IN 11 FIXED SECTIONS:**
   1. A/B Test Hypotheses
   2. Cultural Insights (country + category)
   3. Daily Life Moments
   4. Language & Tone
   5. Seasonality
   6. Key Cities
   7. Local Competition
   8. Recommended Screenshots (1-8)
   9. Visual & Localized UI
   10. Copywriting Pack (10 headlines + 10 CTAs)
   11. Optimization Priorities

8. **EVERYTHING MUST BE:**
   - Hyper-specific
   - No generic content
   - Adapted to category
   - Adapted to culture
   - Based on real market behavior`

    const prompt = `${systemPrompt}

**APP DATA:**
- Name: ${appName}
- Category: ${detectedCategory}
- Description: ${iosData?.description || androidData?.description || "Not provided"}
- Key Features: ${iosData?.subtitle || androidData?.subtitle || "Not provided"}
- Screenshots Goal: Maximize CVR in ${country} market
- Audience: ${language}-speaking users in ${country}

**LOCALIZATION DATA:**
- Country: ${country}
- Language: ${language}
- Priority Cities: Automatically identify main cities relevant to this category
- Season: Current season and seasonal patterns for ${country}
- Cultural Nuances: Deep cultural insights for ${country} and ${detectedCategory} category

${appDataSection}

${appAssetsSection}

${competitorSection}

**TARGET KEYWORDS:** ${keywords?.length > 0 ? keywords.join(", ") : "Automatically identify the best local keywords based on the category and market."}

**OUTPUT FORMAT (MANDATORY - 11 SECTIONS):**

You MUST generate the report following this exact structure with all 11 sections:

1. **ab_hypotheses** (string): A/B testing hypotheses with specific variants and expected outcomes. Include at least 5-7 detailed hypotheses with control vs test variants, KPIs, and expected impact.

2. **cultural_insights** (string): Deep cultural insights adapted to both the country (${country}) and app category (${detectedCategory}). Include lifestyle patterns, visual preferences, cultural sensitivities, local behaviors, and how they relate to ASO.

3. **daily_life_moments** (string): Category-specific daily life moments for the target country. For ${detectedCategory} apps in ${country}, describe when and where users interact with this type of app. Include specific times, locations, contexts, and emotional states.

4. **language_tone** (string): Language characteristics, tone preferences, and local expressions for the category. Include formal/informal preferences, common phrases, cultural expressions, and how to address users in ${language} for ${detectedCategory} apps.

5. **seasonality** (string): Seasonal patterns, events, and timing relevant to the category and country. Include seasonal behaviors, events, holidays, and how they affect app usage and ASO strategy.

6. **cities** (string): Key cities with category-specific characteristics, locations, and cultural elements. For ${detectedCategory} apps, identify the most relevant cities in ${country} and describe category-specific locations, landmarks, and cultural elements in each city.

7. **competitors** (string): Analysis of top local competitors in the same category. Analyze their strategies, claims, visual patterns, color palettes, messaging, and identify gaps and opportunities.

8. **screenshots** (string): Detailed screenshot recommendations (1-8) adapted to category and culture. For each screenshot, specify: position (S1=hero, S2=functional, etc.), visual content with local elements, UI content, copy in ${language}, and A/B test variants.

9. **visual_guidelines** (string): UI patterns, color palettes, typography, and visual guidelines for the country and category. Include recommended color palettes with RGB/HEX values, typography preferences, visual composition, iconography, and cultural visual norms.

10. **copywriting_pack** (string): 10 headlines and 10 CTAs adapted to the category, country, and cultural context. All copy must be in ${language} and adapted to ${detectedCategory} apps. Include emotional triggers, cultural references, and local expressions.

11. **priorities** (string): Prioritized list of optimization actions based on category, market, and competitor analysis. Rank actions by impact and feasibility, with specific implementation steps.

**CRITICAL REQUIREMENTS:**
- ALL content must be adapted to ${detectedCategory} category - NO generic examples
- ALL content must be adapted to ${country} culture and ${language} language
- Use REAL data from provided app and competitor information
- Generate MINIMUM 50-100 keywords and long-tail keywords
- Include MINIMUM 15-20 Pexels image query suggestions
- Provide SPECIFIC, REALISTIC recommendations (not generic)
- Think like a SENIOR ASO consultant with 15+ years of experience
- Quality and depth over speed - generate a comprehensive, professional report
- The entire report must be written in English
- All sections must be hyper-specific and actionable

**REPORT LANGUAGE:** English (The entire report must be written in English).

${appDataSection}

${appAssetsSection}

${competitorSection}

**TARGET KEYWORDS:** ${keywords?.length > 0 ? keywords.join(", ") : "Automatically identify the best local keywords based on the category, niche, and market."}

**KEYWORD GENERATION REQUIREMENTS:**
- Generate MINIMUM 50-100 keywords and long-tail keywords
- Include niche-specific keywords (e.g., for chess: "chess openings", "chess tactics", "chess tournament [city]")
- Include location-based keywords (e.g., "[niche term] [city]", "[niche term] [famous location]")
- Include long-tail keywords (3-5 words) with lower competition
- Include keyword variations in local language
- For each keyword category, provide:
  * Primary keywords (high volume, high competition)
  * Long-tail keywords (lower volume, lower competition)
  * Local variations (city-specific, region-specific)
  * Niche-specific combinations
- Estimate search volume and competition level for each

**URLs DE LES APPS:**
${appUrls.ios ? `- iOS: ${appUrls.ios}` : ""}
${appUrls.android ? `- Android: ${appUrls.android}` : ""}

**INSTRUCCIONS CRÍTIQUES I DETALLADES:**

1. **UTILITZA LES DADES REALS EXTRETES**: Totes les dades proporcionades són REALS. HAS D'UTILITZAR aquestes dades reals, NO inventis dades.

2. **DEEP ANALYSIS OF SCREENSHOTS AND COLORS**: 
   - Analyze EVERY screenshot provided to extract REAL RGB/HEX color values
   - Identify the dominant color palette of the app (MINIMUM 5-8 primary colors with RGB and HEX values)
   - Identify competitor color palettes for comparison
   - For each color, specify where it's used (background, buttons, text, accents, etc.)
   - Include screenshot URLs in hypotheses and recommendations when relevant
   - Extract color psychology insights (what emotions each color evokes in the ${country} market)
   - Provide color accessibility recommendations (contrast ratios, WCAG compliance)
   - Suggest color palette improvements based on competitor analysis

3. **ULTRA-SPECIFIC LOCAL DATA WITH CITATIONS AND LINKS**:
   For the ${country} market, you MUST provide VERY SPECIFIC data ADAPTED TO THE APP'S NICHE (${detectedNiche}):
   
   **A. Niche-Specific Local Terminology:**
   - List ALL local words/phrases related to the app's niche (${detectedNiche})
   - For chess apps: chess terminology in local language, chess club names, tournament terms
   - For parking apps: parking zones, traffic regulations, mobility terms
   - For fitness apps: gym terminology, exercise names, fitness culture terms
   - For each term: meaning, context of use, and ASO relevance
   - Include niche-specific slang and colloquialisms
   
   **B. Carrers, Zones i Punt de Referència Específics:**
   - Noms de carrers reals i famosos (ex: "Via del Corso", "Piazza Duomo", "Gran Vía")
   - Zones específiques (ex: "ZTL Centro Storico", "Area C Milano", "Zona Residenti Trastevere")
   - Punt de referència locals (ex: "Colosseo", "Duomo di Milano", "Piazza Navona")
   - Utilitza aquests noms específics a les recomanacions de screenshots
   
   **C. Objectes i Elements Visuals Autòctons:**
   - Objectes específics del país (ex: "scooter Vespa", "furgoneta bianca", "tram giallo", "microcar")
   - Senyals de trànsit específiques del país
   - Elements visuals característics (ex: "pietra serena", "terracotta", "piazzas")
   
   **D. Tradicions i Esdeveniments Locals:**
   - Tradicions específiques (ex: "mercati settimanali", "derby calcistico", "ponti")
   - Esdeveniments estacionals (ex: "Natale shopping", "estate al mare", "Settimana della Moda")
   - Comportaments específics (ex: "pausa pranzo lunga", "aperitivo serale")
   
   **E. Dades Estadístiques Concretes:**
   - Estadístiques reals amb fonts (ex: "73% dels milanesos utilitza transport públic")
   - Percentatges específics de comportaments locals
   - Dades oficials de governaments/ajuntaments amb enllaços
   - Estudis recents (2024-2025) amb cites completes
   
   **F. Regulacions Específiques:**
   - Noms EXACTES de lleis i normatives (ex: "Delibera Area C", "Regolamento ZTL")
   - Números de normatives quan sigui possible
   - Zones específiques regulades amb noms reals
   - Fonts oficials amb enllaços
   
   **G. MONEDA I FORMAT LOCAL:**
   - Moneda oficial del país (ex: "EUR (€)", "USD ($)")
   - Símbol de moneda (ex: "€", "$")
   - Format de preus local (ex: "1.234,56 €" per Europa, "$1,234.56" per USA)
   - Com mostrar preus a l'app (format específic)
   
   **H. NICHE-SPECIFIC CITIES AND THEIR CHARACTERISTICS:**
   You MUST list the main cities of the country ADAPTED TO THE APP'S NICHE:
   - Exact name of each city (e.g., "Madrid", "Barcelona", "Milano", "Roma")
   - Niche-specific characteristics of each city:
     * For chess: Famous chess clubs, chess tournaments, chess cafes, chess museums
     * For parking: Famous parking areas, traffic zones, mobility hubs
     * For fitness: Famous gyms, fitness centers, running paths, sports facilities
     * For food: Famous restaurants, food markets, culinary districts
   - Niche-relevant famous locations in each city (NOT generic tourist spots unless relevant)
   - Niche-specific local objects for each city
   - Use these EXACT names in recommendations
   - ONLY include cities and locations relevant to the app's niche
   
   **I. CARACTERÍSTIQUES ESPECÍFIQUES DE L'IDIOMA:**
   - Formes de tractament formals (ex: "Usted", "Lei", "Sie")
   - Formes de tractament informals (ex: "Tú", "Tu", "Du")
   - Frases comunes locals relacionades amb aparcament/mobilitat
   - Termes específics del país per aparcament (ex: "aparcamiento", "parcheggio", "parking")
   - Tono preferit (formal, casual, amigable)
   - Exemples concrets de com parlar a l'usuari
   
   **J. NICHE-SPECIFIC LOCAL OBJECTS:**
   - List objects specific to the country RELATED TO THE APP'S NICHE (${detectedNiche})
   - For chess: chess sets, chess clocks, chess boards, tournament equipment
   - For parking: scooters, cars, parking meters, traffic signs
   - For fitness: gym equipment, yoga mats, running gear, fitness trackers
   - For each object: exact name, description, cultural significance
   - Why they are relevant for ASO
   - Pexels image search suggestions for each object (niche-specific queries)
   
   **K. LLEIS I REGULACIONS ESPECÍFIQUES:**
   - Nom EXACTE de cada llei/normativa (ex: "Delibera Area C Milano", "Ordenanza de Movilidad Sostenible Madrid")
   - Número de llei si està disponible
   - Descripció detallada del que regula
   - Zones específiques afectades amb noms reals
   - Font oficial amb enllaç quan sigui possible
   - Com afecta a l'ús de l'app

4. **PROPOSTES DE SCREENSHOTS ULTRA-DETALLADES AMB CANVIS REALISTES I LOCALS**:
   HAS DE generar propostes de screenshots MOLT específiques amb CANVIS REALISTES basats en elements locals reals:
   
   Per cada screenshot proposat (S1, S2, S3, etc.):
   - **Número i rol**: Quina posició (S1=hero, S2=funcional, etc.) i quin objectiu de negoci
   - **Contingut visual detallat amb ELEMENTS LOCALS REALS**:
     * Tipus de fons (foto real, il·lustració, UI-only, híbrid)
     * Descripció ESPECÍFICA de l'escena local amb ubicacions REALS:
       - Si és una app de parking: "Parking de Plaza Mayor de Madrid amb senyal de zona azul visible"
       - Si és una app de parking: "Carrer Gran Vía de Madrid amb senyal vertical de zona azul i preu en euros"
       - Si és Barcelona: "Plaza Catalunya de Barcelona amb senyal de zona blava en català"
       - Si és Itàlia: "Via del Corso de Roma amb senyal ZTL i preu en euros"
     * Elements obligatoris locals:
       - Senyals de trànsit específics del país (zona azul/blava, ZTL, etc.)
       - Cartells amb preus en la moneda local (€) i en l'idioma local
       - Codi de zona específic (ex: "Zona Azul Madrid", "Zona Blava Barcelona")
       - Icona Bluetooth, cercle de temps
     * Objectes autòctons específics (scooters locals, furgonetes, trams, etc.)
     * Carrers específics REALS a mostrar (noms reals de carrers de la ciutat)
     * Punt de referència locals REALS (monuments, places específiques)
   
   - **CANVIS REALISTES A LES SCREENSHOTS**:
     * Si la screenshot mostra un parking: ha de ser un parking ESPECÍFIC de la ciutat (ex: "Parking Plaza Mayor Madrid")
     * Si mostra un carrer: ha de ser un carrer ESPECÍFIC (ex: "Carrer Gran Vía Madrid", "Passeig de Gràcia Barcelona")
     * Afegir senyals locals reals: zona azul/blava, ZTL, preus en euros, idioma local
     * Si és Barcelona: textos en català, preus en euros
     * Si és Madrid: textos en castellà, preus en euros
     * Si és Itàlia: textos en italià, preus en euros, senyals ZTL
   
   - **Contingut UI detallat**:
     * Nom de la vista del producte (mapa, detall zona, compte enrere, etc.)
     * Camps que han de ser visibles (temps restant, tipus de zona, nivell d'autorització, botó en idioma local)
     * Estat de la UI (zona lliure, gairebé expira, expirada)
   
   - **Copy específic en idioma local**:
     * Headline en idioma local (màx X caràcters)
     * Subheadline (màx X caràcters)
     * Cluster de missatge al qual pertany ("no multa", "carico/scarico", "residenti", etc.)
     * Frases locals autòctones utilitzades
   
   - **Variants A/B**:
     * Variant A vs Control: què canvia específicament (ex: "Afegir senyal de zona azul de Madrid", "Canviar preu a euros")
     * Variant B vs Control: què canvia específicament
     * KPI objectiu del test (CVR global, CVR només store search, etc.)

5. **ACTIONABLE RECOMMENDATIONS ENRICHED WITH NICHE-SPECIFIC VISUAL CONTEXT**:
   Propose very precise and concrete recommendations for creatives (screenshots, icon) and copywriting (title, subtitle, description). Include:
   - **ICON RECOMMENDATIONS WITH VISIBLE COLOR PALETTES**:
     * Provide SPECIFIC, REALISTIC icon design recommendations
     * Include a VISIBLE color palette with RGB and HEX values for the icon
     * Specify icon style (flat, 3D, gradient, outline, etc.)
     * Recommend specific visual elements for the icon (niche-appropriate)
     * Provide 3-5 icon design variations with different color palettes
     * Each palette must be displayed with color swatches (RGB, HEX values)
     * Explain why each palette works for the ${country} market and niche
     * Compare with competitor icon palettes
   
   - **IMPLEMENTATION DETAILS WITH NICHE-SPECIFIC LOCAL ELEMENTS**: 
     * Specify how to implement each recommendation with niche-specific local elements
     * For chess apps: "Use a photo of a chess tournament at [famous chess club] in [city]"
     * For parking apps: "Use a photo of parking at [famous location] with [local parking sign]"
     * For fitness apps: "Show [famous gym] in [city] with [local fitness equipment]"
     * Adapt ALL examples to the app's niche - NO generic examples
   
   - **ENLLAÇOS PER APROFUNDIR**: Quan recomanis dades o conceptes locals, inclou enllaços a articles, estudis o webs oficials que donin suport a la recomanació.
   
   - **NICHE-SPECIFIC PEXELS SEARCH SUGGESTIONS**:
     * For each recommendation that includes a visual element, you MUST suggest a SPECIFIC Pexels query
     * Queries MUST be niche-specific and location-specific:
       - For chess apps: "Pexels Query: 'chess tournament [city] [country]'", "chess club [city]", "chess board [local style]"
       - For parking apps: "Pexels Query: 'parking [location] [city]'", "traffic sign [city] [country]"
       - For fitness apps: "Pexels Query: 'gym [city] [country]'", "fitness [location] [city]"
     * Pexels images must serve to PROVIDE CONTEXT to the recommendation
     * If the recommendation mentions a specific location, the Pexels image must be of that specific location
     * Use the pexelsQuerySuggestion field for each recommendation
     * Generate MINIMUM 10-15 Pexels image suggestions throughout the report to support design proposals

6. **CLUSTERS DE MISSATGERIA LOCALS**:
   HAS DE crear clusters de missatgeria específics per al mercat:
   - Per cada cluster (ex: "No stress, no multa", "Carico/scarico", "Residenti"):
     * Nom del cluster
     * Mínim 3 exemples de copy (headline + subheadline)
     * Paraules clau relacionades
     * Casos d'ús específics (quan utilitzar cada cluster)

6. **ANÀLISI PROFUNDA DE COMPETIDORS**:
   Per cada competidor, HAS DE proporcionar:
   - Nom i bundle ID
   - Proposta de valor principal
   - Missatges clau de cada screenshot (1-3)
   - Elements visuals principals
   - Gaps: què NO cobreixen
   - Oportunitats: com podem diferenciar-nos

7. **ROADMAP D'EXPERIMENTS**:
   HAS DE crear un roadmap d'experiments específics:
   - Nom de l'experiment (ex: "IT – S1 No multe vs generico")
   - Hipòtesi específica
   - Variants (control + variants de test)
   - KPI objectiu
   - Durada mínima
   - Mida esperada de mostra

5. **COMPARACIÓ PROFUNDA AMB COMPETIDORS**:
   - Utilitza les dades reals extretes (ratings, reviews, descripcions)
   - Compara paletes de colors reals
   - Identifica gaps específics basats en dades reals
   - Inclou screenshots reals dels competidors quan sigui rellevant

6. **HIPÒTESIS D'A/B TESTING CONCRETES**:
   - Cada hipòtesi ha de tenir un screenshot d'exemple o descripció visual específica
   - Mètriques concretes esperades (no genèriques)
   - Detalls d'implementació específics

7. **COMPARACIONS DE BENCHMARK VISUAL**:
   HAS DE crear comparacions visuals professionals:
   - Compara iconos de l'app amb iconos dels competidors
   - Compara screenshots de l'app amb screenshots dels competidors
   - Compara paletes de colors
   - Compara copy i missatgeria
   - Per cada comparació, proporciona insights específics i recomanacions accionables
   - Si una comparació menciona un lloc específic, inclou una imatge de Pexels d'aquest lloc

8. **ESTRUCTURA PROFESSIONAL I VISUAL**:
   - L'informe ha de ser MOLT visual amb imatges, iconos i screenshots
   - Utilitza dades, cites i enllaços per donar credibilitat
   - Cada secció ha de ser accionable i específica
   - Written completely in English
   - Pexels images must be in the correct places in the report (where specific places are mentioned)

**ESTRUCTURA DE L'INFORME (ESQUEMA JSON):**

L'informe ha de seguir estrictament l'esquema JSON proporcionat i incloure:

1. **Hipòtesis d'A/B Testing** (mínim 3):
   - Títol, descripció, resultat esperat
   - screenshotUrl: URL d'un screenshot real que il·lustri la hipòtesi
   - visualExample: Descripció específica de l'exemple visual

2. **Insights Culturals**:
   - Tots els camps (urbanMobility, regulations, lifestyle, language, seasonality, regionalFocus)
   - localData: Array amb dades locals CONCRETES i ESPECÍFIQUES, cadascuna amb:
     * fact: Dada CONCRETA amb noms específics (ex: "El 73% dels madrilenys utilitza apps de mobilitat urbana segons l'Ajuntament de Madrid")
     * source: Font ESPECÍFICA (ex: "Estudi de Mobilitat de Madrid 2024 - Ajuntament de Madrid")
     * link: URL real quan sigui possible
     * relevance: Per què és rellevant per a l'ASO amb detalls específics
     * pexelsImageUrl: URL d'imatge de Pexels relacionada amb la dada. Si no tens accés directe a Pexels, deixa-ho buit (el sistema l'enriquirà després)
     * pexelsImageDescription: Descripció de la imatge de Pexels o suggeriment de cerca ESPECÍFICA i local (ex: "Italian street parking Milan Via del Corso", "ZTL zone Rome Colosseo", "carico scarico van Italy", "Roman traffic scooter Vespa")
   
   - localMarketDetails: Objecte amb informació ULTRA-ESPECÍFICA del mercat:
     * currency: Moneda oficial (ex: "EUR (€)", "USD ($)")
     * currencySymbol: Símbol (ex: "€", "$")
     * currencyFormat: Format de preus (ex: "1.234,56 €")
     * specificCities: Array amb les principals ciutats:
       - name: Nom EXACTE de la ciutat (ex: "Madrid", "Barcelona", "Milano")
       - characteristics: Característiques específiques d'aquesta ciutat
       - famousStreets: Array de carrers famosos EXACTS (ex: ["Gran Vía", "Passeig de Gràcia", "Calle Serrano"])
       - landmarks: Array de monuments EXACTS (ex: ["Plaza Mayor", "Sagrada Família", "Colosseo"])
       - localObjects: Objectes específics d'aquesta ciutat
     * languageCharacteristics:
       - formalForms: Formes formals (ex: ["Usted", "Lei"])
       - informalForms: Formes informals (ex: ["Tú", "Tu"])
       - commonPhrases: Frases comunes locals (ex: ["Aparcar aquí", "Parcheggiare qui"])
       - specificTerms: Termes específics per aparcament (ex: ["aparcamiento", "parcheggio"])
       - tonePreferences: Tono preferit (ex: "Casual i amigable")
     * localObjects: Array d'objectes locals específics:
       - name: Nom exacte (ex: "Vespa scooter", "furgoneta bianca")
       - description: Descripció detallada
       - culturalSignificance: Significat cultural
       - visualReference: Suggeriment de cerca Pexels
     * legalSpecifics: Array de lleis específiques:
       - lawName: Nom EXACTE de la llei (ex: "Delibera Area C Milano")
       - lawNumber: Número si està disponible
       - description: Què regula
       - zones: Zones específiques afectades
       - source: Font oficial
       - link: Enllaç quan sigui possible
   
   **NOTA SOBRE IMATGES DE PEXELS:**
   - Per cada dada local, HAS DE suggerir una cerca d'imatge ESPECÍFICA i local relacionada amb la dada
   - Les cerques han de ser ESPECÍFIQUES del país/ciutat amb noms EXACTS (ex: "Milano parking street Via del Corso", "Italian ZTL zone Rome Colosseo", "Roman traffic scooter Vespa", "Torino tram parking")
   - Si no pots accedir directament a Pexels, deixa pexelsImageUrl buit però inclou suggeriments de cerca DETALLATS a pexelsImageDescription
   - El sistema enriquirà automàticament les dades locals amb imatges reals de Pexels després de generar l'informe

3. **Anàlisi de Competidors**:
   - Per cada competidor: name, valueProp, visualPatterns, keywords, comparison
   - screenshotUrl: URL d'un screenshot real del competidor
   - colorPalette: Paleta de colors extreta amb colors RGB/HEX reals
   - rating i reviewsCount: Dades reals extretes

4. **Recomanacions** (mínim 5):
   - Títol, insight, visualElements, copySuggestions, localElements
   - screenshotExample: URL d'un screenshot d'exemple
   - colorPalette: Paleta de colors recomanada amb colors RGB/HEX específics
   - localData: Dades locals que suporten la recomanació amb cites i enllaços
   - implementationDetails: Detalls MOLT específics d'implementació amb elements locals reals (ex: "Afegir senyal de zona azul de Madrid", "Mostrar parking de Plaza Mayor")
   - screenshotProposal: Proposta detallada de screenshot amb tots els detalls visuals i de copy
   - localTerminology: Terminologia local autòctona a utilitzar
   - culturalElements: Elements culturals específics a incorporar
   - specificStreets: Noms de carrers específics a referenciar (ex: "Gran Vía", "Passeig de Gràcia")
   - specificLandmarks: Punt de referència locals a mostrar (ex: "Plaza Mayor", "Sagrada Família")
   - autochthonousObjects: Objectes autòctons a incloure
   - pexelsImageUrl: URL d'imatge de Pexels relacionada amb la recomanació (el sistema l'enriquirà)
   - pexelsImageDescription: Descripció de la imatge de Pexels
   - pexelsQuerySuggestion: Query ESPECÍFICA de Pexels per a la recomanació (ex: "zona azul madrid parking sign", "plaza catalunya barcelona parking")

5. **Propostes de Screenshots Detallades** (mínim 6 screenshots):
   Per cada screenshot:
   - number: Número del screenshot (1, 2, 3, etc.)
   - role: Rol (hero, functional, social_proof, etc.)
   - businessObjective: Objectiu de negoci específic
   - visualContent: Contingut visual detallat amb descripció d'escena local, elements obligatoris, objectes autòctons, carrers específics, punt de referència
   - uiContent: Contingut UI amb nom de vista, camps visibles, estat
   - copy: Copy amb headline, subheadline, cluster de missatge, frases locals
   - abTestVariants: Variants A/B amb canvis específics i KPI objectiu

6. **Clusters de Missatgeria**:
   - name: Nom del cluster
   - examples: Mínim 3 exemples de copy (headline + subheadline)
   - keywords: Paraules clau relacionades
   - useCases: Casos d'ús específics

7. **Terminologia Local**:
   - term: Terme local autòcton
   - meaning: Significat
   - context: Context d'ús
   - asoRelevance: Rellevància per a l'ASO

8. **Elements Culturals**:
   - type: Tipus (tradition, event, lifestyle, visual, language)
   - name: Nom
   - description: Descripció
   - specificDetails: Detalls molt específics
   - asoApplication: Com aplicar-ho a l'ASO
   - visualReferences: Elements visuals a incloure

9. **Insights de Competidors Detallats**:
   - name, bundleId, valueProposition
   - keyMessages: Missatges clau de cada screenshot
   - screenshots: Anàlisi de cada screenshot del competidor
   - gaps: Què no cobreixen
   - opportunities: Oportunitats per diferenciar-nos

10. **Roadmap d'Experiments**:
    - name: Nom de l'experiment
    - hypothesis: Hipòtesi específica
    - variants: Variants (control + test)
    - kpi: KPI objectiu
    - duration: Durada mínima
    - expectedSampleSize: Mida esperada de mostra

11. **Comparacions de Benchmark** (mínim 2):
    HAS DE crear comparacions visuals entre l'app i els competidors:
    - type: Tipus de comparació ("icons", "screenshots", "colors", "copy")
    - title: Títol de la comparació
    - description: Descripció de la comparació
    - appAssets: Assets visuals de l'app (iconUrl, screenshots, platforms)
    - competitorAssets: Assets visuals dels competidors per comparar (iconUrl, screenshots, colorPalette)
    - insights: Insights de la comparació (què fa bé cada un, què es pot millorar)
    - recommendations: Recomanacions basades en la comparació
    - pexelsImageUrl: Si la comparació menciona un lloc específic (ex: "Plaza Catalunya"), inclou una imatge de Pexels d'aquest lloc

12. **Assets Visuals de l'App**:
    - iconUrl: URL de l'icono de l'app (extret de les dades reals)
    - screenshots: Array amb totes les URLs de screenshots reals
    - platforms: Plataformes (ios, android)

13. **NICHE-SPECIFIC KEYWORDS AND LONG-TAIL KEYWORDS**:
   You MUST generate ULTRA-SPECIFIC AND LOCAL keywords related to the app's niche (${detectedNiche}):
   
   **KEYWORD GENERATION RULES:**
   - Generate MINIMUM 50-100 keywords across multiple categories
   - Include niche-specific keywords (e.g., for chess: "chess openings", "chess tactics", "chess puzzle")
   - Include location-based keywords: "[niche term] [city]", "[niche term] [famous location]"
   - Include long-tail keywords (3-5 words): "[niche term] [location] [action]", "[niche term] [benefit] [location]"
   - Include local language variations (Catalan for Barcelona, Spanish for Madrid, Italian for Italy, etc.)
   - Include competitor brand names + niche terms
   - Include question-based keywords: "how to [niche action]", "best [niche term] [location]"
   - Include comparison keywords: "[niche term] vs [competitor]", "best [niche term] app"
   
   **EXAMPLES BY NICHE:**
   - Chess: "chess game [city]", "chess tournament [location]", "learn chess [city]", "chess tactics [language]"
   - Parking: "parking [city]", "parking [famous street]", "parking zone [city]", "parking app [city]"
   - Fitness: "gym [city]", "workout [location]", "fitness [city]", "exercise app [country]"
   
   **FOR EACH KEYWORD CATEGORY:**
   - category: Category name (e.g., "Primary Keywords", "Long-tail Keywords", "Location-based", "Niche-specific")
   - terms: Array of 10-20 specific and local keywords
   - searchVolume: Estimated search volume (High/Medium/Low)
   - competition: Competition level (High/Medium/Low)
   - localVariations: Local language variations of keywords

6. **Paleta de Colors de l'App**:
   - appColorPalette: Paleta principal extreta dels screenshots amb colors RGB/HEX reals

7. **Resum Visual**:
   - visualSummary: Resum de l'estratègia visual general

**EXEMPLES DE DADES LOCALS CONCRETES (per ${country}):**

Busca i cita dades reals com:
- Estadístiques oficials (governs, ajuntaments, instituts d'estadística)
- Estudis de mobilitat urbana recents
- Regulacions específiques amb noms i números de llei
- Dades de mercat d'apps locals
- Tendències de consum locals
- Comportaments específics del país/ciutat

**REPORT LENGTH AND DEPTH REQUIREMENTS:**
- This report MUST be EXTREMELY COMPREHENSIVE, DETAILED, AND PROFESSIONAL
- Generate MINIMUM 8-12 detailed recommendations (not just 5)
- Generate MINIMUM 8-10 detailed screenshot proposals (not just 6)
- Generate MINIMUM 5-7 A/B testing hypotheses (not just 3)
- Generate MINIMUM 50-100 keywords across multiple categories
- Include MINIMUM 15-20 Pexels image suggestions throughout the report
- Each section must be THOROUGHLY detailed with specific, actionable insights
- Use MORE tokens if needed - quality and depth are more important than token count
- Think like a SENIOR ASO consultant with 15+ years of experience
- Provide enterprise-level strategic insights, not generic recommendations

**ICON RECOMMENDATIONS - CRITICAL:**
- When recommending icon changes, you MUST provide:
  * VISIBLE color palettes with RGB and HEX values displayed clearly
  * 3-5 icon design variations with different color schemes
  * Specific, realistic design elements (not generic suggestions)
  * Comparison with competitor icons
  * Explanation of why each palette works for the niche and market
  * Accessibility considerations (contrast, visibility)
  * Cultural appropriateness for ${country}

**FINAL CRITICAL INSTRUCTIONS:**
- DO NOT invent data. Use only real data or clearly indicate when unavailable.
- All screenshot URLs must be real and accessible.
- All colors must have REAL RGB and HEX values extracted from images.
- All links must be valid and relevant URLs.
- The report must be completely written in English.
- The report must be PROFESSIONAL, VISUAL, INTUITIVE, ACTIONABLE, and COMPREHENSIVE.
- ADAPT ALL SECTIONS to the app's niche (${detectedNiche}) - NO generic content.
- Generate a MUCH LONGER, MORE DETAILED report than typical - this is a premium, senior-level analysis.
- Quality over speed - take your time to generate the best possible report.
`

    console.log("[ASO] Generating report with real data for:", appName, country, language)

    // Build messages with text prompt and all real screenshots
    const messageContent: any[] = [{ type: "text", text: prompt }]
    
    // Add all screenshots from main app
    if (iosData?.screenshots) {
      iosData.screenshots.forEach((url) => {
        messageContent.push({ type: "image", image: url })
      })
    }
    if (androidData?.screenshots) {
      androidData.screenshots.forEach((url) => {
        messageContent.push({ type: "image", image: url })
      })
    }
    
    // Add competitor screenshots (limit to avoid token limits)
    competitorData.slice(0, 3).forEach((comp) => {
      comp.screenshots.slice(0, 2).forEach((url) => {
        messageContent.push({ type: "image", image: url })
      })
    })

    const messages: any[] = [
      {
        role: "user",
        content: messageContent,
      },
    ]

    console.log("[ASO] Sending to OpenAI:", {
      textLength: prompt.length,
      images: messageContent.filter((c) => c.type === "image").length,
    })

    // Create OpenAI provider with the API key
    const openaiProvider = createOpenAI({
      apiKey: openaiApiKey,
    })

    console.log("[ASO] Calling OpenAI API...")

    const result = streamObject({
      model: openaiProvider("gpt-4o"),
      schema: asoReportSchema,
      messages: messages,
      maxSteps: 15, // Increased from 5 to 15 for more detailed, professional reports
      temperature: 0.7, // Slightly higher for more creative but still professional output
    })

    console.log("[ASO] Streaming response...")
    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error("[ASO] API Error:", error)
    const errorMessage = error?.message || "Internal Server Error"
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error?.stack 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
