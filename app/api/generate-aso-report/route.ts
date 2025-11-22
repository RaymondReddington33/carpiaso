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

async function extractAppStoreData(url: string, platform: "ios" | "android"): Promise<AppStoreData> {
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

    const prompt = `
You are an expert ASO (App Store Optimization) consultant generating a detailed strategic report to maximize the CVR (Conversion Rate) of the app "${appName}" on ${platforms.join(" and ")} in the ${country} market.

**REPORT LANGUAGE:** English (The entire report must be written in English).

${appDataSection}

${appAssetsSection}

${competitorSection}

**PARAULES CLAU OBJECTIU:** ${keywords?.length > 0 ? keywords.join(", ") : "Identifica automàticament les millors paraules clau locals basant-te en la categoria i el mercat."}

**URLs DE LES APPS:**
${appUrls.ios ? `- iOS: ${appUrls.ios}` : ""}
${appUrls.android ? `- Android: ${appUrls.android}` : ""}

**INSTRUCCIONS CRÍTIQUES I DETALLADES:**

1. **UTILITZA LES DADES REALS EXTRETES**: Totes les dades proporcionades són REALS. HAS D'UTILITZAR aquestes dades reals, NO inventis dades.

2. **ANÀLISI PROFUNDA DE SCREENSHOTS I COLORS**: 
   - Analitza CADA screenshot proporcionat per extreure colors RGB/HEX reals
   - Identifica la paleta de colors dominant de l'app (mínim 3-5 colors principals amb valors RGB i HEX)
   - Identifica paletes de colors dels competidors per comparació
   - Per cada color, indica on s'utilitza (fons, botons, text, etc.)
   - Inclou URLs de screenshots reals a les hipòtesis i recomanacions quan sigui rellevant

3. **DADES LOCALS ULTRA-ESPECÍFIQUES AMB CITES I ENLLAÇOS**:
   Per al mercat de ${country}, HAS DE proporcionar dades MOLT ESPECÍFIQUES:
   
   **A. Terminologia Local Autòctona:**
   - Llista TOTES les paraules/frases locals relacionades amb aparcament i mobilitat
   - Exemples: "ZTL", "Area C", "strisce blu", "carico/scarico", "permesso residenti", "varco", etc.
   - Per cada terme: significat, context d'ús, i rellevància ASO
   
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
   
   **H. CIUTATS ESPECÍFIQUES I LLURS CARACTERÍSTIQUES:**
   HAS DE llistar les principals ciutats del país amb:
   - Nom EXACTE de cada ciutat (ex: "Madrid", "Barcelona", "Milano", "Roma")
   - Característiques específiques de cada ciutat
   - Carrers famosos de cada ciutat (ex: "Gran Vía", "Passeig de Gràcia", "Via del Corso")
   - Monuments i punt de referència específics (ex: "Plaza Mayor", "Sagrada Família", "Colosseo")
   - Objectes locals específics de cada ciutat
   - Utilitza aquests noms EXACTES a les recomanacions
   
   **I. CARACTERÍSTIQUES ESPECÍFIQUES DE L'IDIOMA:**
   - Formes de tractament formals (ex: "Usted", "Lei", "Sie")
   - Formes de tractament informals (ex: "Tú", "Tu", "Du")
   - Frases comunes locals relacionades amb aparcament/mobilitat
   - Termes específics del país per aparcament (ex: "aparcamiento", "parcheggio", "parking")
   - Tono preferit (formal, casual, amigable)
   - Exemples concrets de com parlar a l'usuari
   
   **J. OBJECTES LOCALS ESPECÍFICS:**
   - Llista d'objectes específics del país relacionats amb mobilitat/aparcament
   - Per cada objecte: nom exacte, descripció, significat cultural
   - Exemples: "Vespa scooter", "furgoneta bianca", "tram giallo", "microcar", "bicicleta eléctrica"
   - Per què són rellevants per a l'ASO
   - Suggeriments de cerques d'imatges de Pexels per a cada objecte
   
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

5. **RECOMANACIONS ACCIONABLES I ENRIQUIDES AMB CONTEXT VISUAL LOCAL**:
   Proposa recomanacions molt precises i concretes per a creativitats (screenshots, icona) i copywriting (títol, subtítol, descripció). Inclou:
   - **DETALLS D'IMPLEMENTACIÓ AMB ELEMENTS LOCALS REALS**: 
     * Especifica com implementar cada recomanació amb elements locals ESPECÍFICS
     * Exemple: "Utilitzar una foto d'un parking de Plaza Mayor de Madrid amb senyal de zona azul visible i preu en euros"
     * Exemple: "Afegir un cartell de zona blava de Barcelona en català amb el preu del parking"
     * Exemple: "Mostrar un carrer específic com Gran Vía de Madrid amb senyal vertical de zona azul"
     * Exemple: "Si la screenshot mostra un parking, ha de ser un parking ESPECÍFIC de la ciutat (ex: Parking Plaza Mayor Madrid)"
     * Exemple: "Si mostra un carrer, ha de ser un carrer ESPECÍFIC (ex: Carrer Gran Vía Madrid, Passeig de Gràcia Barcelona)"
     * Exemple: "Afegir senyals locals reals: zona azul/blava, ZTL, preus en euros, idioma local"
   
   - **ENLLAÇOS PER APROFUNDIR**: Quan recomanis dades o conceptes locals, inclou enllaços a articles, estudis o webs oficials que donin suport a la recomanació.
   
   - **SUGGERIMENTS DE CERCA PEXELS ESPECÍFICS I CONTEXTUALS**:
     * Per a cada recomanació que inclogui un element visual local, HAS DE suggerir una query ESPECÍFICA de Pexels
     * Les queries han de ser ESPECÍFIQUES del lloc/element mencionat:
       - Si recomanes alguna cosa de "zona azul": "Pexels Query: 'zona azul madrid parking sign'"
       - Si recomanes alguna cosa de "Plaza Catalunya Barcelona": "Pexels Query: 'plaza catalunya barcelona parking'"
       - Si recomanes alguna cosa de "zona blava": "Pexels Query: 'zona blava barcelona parking sign catalan'"
       - Si recomanes alguna cosa de "ZTL Roma": "Pexels Query: 'ztl zone rome traffic sign'"
       - Si recomanes un carrer específic: "Pexels Query: 'gran via madrid parking street'"
       - Si recomanes un monument: "Pexels Query: 'sagrada familia barcelona parking'"
     * Les imatges de Pexels han de servir per DONAR CONTEXT a la recomanació
     * Si la recomanació menciona un lloc específic, la imatge de Pexels ha de ser d'aquest lloc específic
     * Utilitza el camp pexelsQuerySuggestion per a cada recomanació

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

13. **Paraules Clau LOCALS I ESPECÍFIQUES**:
   HAS DE generar paraules clau ULTRA-ESPECÍFIQUES I LOCALS relacionades amb la temàtica de l'app:
   
   **EXEMPLES PER APPS DE PARKING:**
   - "aparcar en [CIUTAT]" (ex: "aparcar en madrid", "aparcar en barcelona", "aparcar en milano")
   - "aparcar en [CARRER ESPECÍFIC]" (ex: "aparcar en plaza mayor", "aparcar en calle alcala", "aparcar en via del corso")
   - "parking [ZONA ESPECÍFICA]" (ex: "parking zona azul madrid", "parking zona blava barcelona", "parking ztl roma")
   - "aparcament [MONUMENT/LOCALITZACIÓ]" (ex: "aparcament sagrada família", "aparcament colosseo", "aparcament duomo milano")
   - "zona [TIPUS] [CIUTAT]" (ex: "zona azul madrid", "zona blava barcelona", "zona residenti roma")
   - "preu parking [CIUTAT]" (ex: "preu parking barcelona", "precio parking madrid")
   - "app aparcament [CIUTAT]" (ex: "app aparcament barcelona", "app parcheggio milano")
   
   **REGLES:**
   - Totes les paraules clau han de ser ESPECÍFIQUES del país/ciutat
   - Inclou noms reals de carrers, places, monuments, zones
   - Combina la temàtica de l'app amb ubicacions locals reals
   - Per cada paraula clau, indica el volum de cerca estimat i el nivell de competència
   - Inclou variacions en l'idioma local (català per Barcelona, castellà per Madrid, italià per Itàlia, etc.)
   - category: Categoria de la paraula clau
   - terms: Array de paraules clau específiques i locals
   - searchVolume: Volum de cerca estimat
   - competition: Nivell de competència
   - localVariations: Variacions locals de les paraules clau

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

**IMPORTANT FINAL**: 
- NO inventis dades. Utilitza només dades reals o indica clarament quan no estan disponibles.
- Totes les URLs de screenshots han de ser reals i accessibles.
- Tots els colors han de tenir valors RGB i HEX reals extrets de les imatges.
- Tots els enllaços han de ser URLs vàlides i rellevants.
- The report must be completely written in English.
- The report must be professional, visual, intuitive and actionable.
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
      maxSteps: 5,
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
