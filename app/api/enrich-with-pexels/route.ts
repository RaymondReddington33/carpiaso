import { NextRequest, NextResponse } from "next/server"
import { searchPexelsImage, generatePexelsQuery } from "@/lib/pexels"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { report, country, pexelsApiKey } = body

    if (!report) {
      return NextResponse.json({ error: "Report is required" }, { status: 400 })
    }

    const pexelsKey = pexelsApiKey || process.env.PEXELS_API_KEY

    if (!pexelsKey) {
      // Return report as-is if no Pexels API key
      console.log("[Pexels] No API key provided, skipping enrichment")
      return NextResponse.json({ report })
    }

    console.log("[Pexels] Starting enrichment with API key:", pexelsKey.substring(0, 10) + "...")

    // Enrich localData with Pexels images
    const enrichedReport = { ...report }

    // Helper function to add delay between API calls
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Process cultural insights localData
    if (enrichedReport.culturalInsights?.localData) {
      console.log("[Pexels] Processing cultural insights localData:", enrichedReport.culturalInsights.localData.length)
      for (let i = 0; i < enrichedReport.culturalInsights.localData.length; i++) {
        const localData = enrichedReport.culturalInsights.localData[i]
        if (!localData.pexelsImageUrl) {
          try {
            const query = generatePexelsQuery(localData.fact, country, localData.relevance)
            console.log("[Pexels] Searching for:", query)
            const image = await searchPexelsImage(query, pexelsKey)
            if (image) {
              localData.pexelsImageUrl = image.url
              localData.pexelsImageDescription = image.description
              console.log("[Pexels] Found image:", image.url.substring(0, 50) + "...")
            } else {
              console.log("[Pexels] No image found for query:", query)
            }
            // Add delay between calls to avoid rate limiting (200 req/hour for free tier)
            if (i < enrichedReport.culturalInsights.localData.length - 1) {
              await delay(2000) // 2 seconds delay between calls
            }
          } catch (error) {
            console.error("[Pexels] Error fetching image:", error)
            // Add delay even on error to avoid rate limiting
            if (i < enrichedReport.culturalInsights.localData.length - 1) {
              await delay(2000)
            }
          }
        }
      }
    }

    // Process recommendations and add Pexels images for specific places and local elements mentioned
    if (enrichedReport.recommendations) {
      for (let i = 0; i < enrichedReport.recommendations.length; i++) {
        const rec = enrichedReport.recommendations[i]
        
        // First, check if there's a pexelsQuerySuggestion in the recommendation
        if (!rec.pexelsImageUrl && rec.pexelsQuerySuggestion) {
          try {
            console.log("[Pexels] Using suggested query from recommendation:", rec.pexelsQuerySuggestion)
            const image = await searchPexelsImage(rec.pexelsQuerySuggestion, pexelsKey)
            if (image) {
              rec.pexelsImageUrl = image.url
              rec.pexelsImageDescription = image.description
              console.log("[Pexels] Found image from suggestion:", image.url.substring(0, 50) + "...")
              await delay(2000)
              continue // Skip other searches for this recommendation
            }
          } catch (error) {
            console.error("[Pexels] Error fetching image from suggestion:", error)
            await delay(2000)
          }
        }
        
        // Look for specific places, zones, or local elements in the recommendation
        if (!rec.pexelsImageUrl) {
          // Check title and insight for place names, zones, monuments
          const searchText = `${rec.title || ""} ${rec.insight || ""} ${rec.localElements?.join(" ") || ""}`.toLowerCase()
          
          // Extract specific places, zones, monuments
          const placePatterns = [
            /plaza\s+([a-záéíóúàèìòùñç]+)/gi,
            /piazza\s+([a-záéíóúàèìòùñç]+)/gi,
            /calle\s+([a-záéíóúàèìòùñç]+)/gi,
            /carrer\s+([a-záéíóúàèìòùñç]+)/gi,
            /via\s+([a-záéíóúàèìòùñç]+)/gi,
            /zona\s+(azul|blava|blu|ztl|residenti)/gi,
            /(sagrada\s+família|colosseo|duomo|plaza\s+mayor|gran\s+vía|passeig\s+de\s+gràcia)/gi,
          ]
          
          let foundPlace = null
          for (const pattern of placePatterns) {
            const match = searchText.match(pattern)
            if (match) {
              foundPlace = match[0]
              break
            }
          }
          
          if (foundPlace) {
            try {
              // Create specific query with place and context
              const query = `${foundPlace} ${country} parking`
              console.log("[Pexels] Searching for specific place:", query)
              const image = await searchPexelsImage(query, pexelsKey)
              if (image) {
                rec.pexelsImageUrl = image.url
                rec.pexelsImageDescription = image.description
                console.log("[Pexels] Found place image:", image.url.substring(0, 50) + "...")
              }
              await delay(2000)
            } catch (error) {
              console.error("[Pexels] Error fetching place image:", error)
              await delay(2000)
            }
          }
          
          // If no specific place, look for zone types (zona azul, zona blava, ZTL, etc.)
          if (!rec.pexelsImageUrl) {
            const zonePatterns = [
              /zona\s+azul/gi,
              /zona\s+blava/gi,
              /zona\s+blu/gi,
              /ztl/gi,
              /zona\s+residenti/gi,
            ]
            
            for (const pattern of zonePatterns) {
              if (searchText.match(pattern)) {
                try {
                  const zoneType = searchText.match(pattern)?.[0] || ""
                  const query = `${zoneType} ${country} parking sign`
                  console.log("[Pexels] Searching for zone sign:", query)
                  const image = await searchPexelsImage(query, pexelsKey)
                  if (image) {
                    rec.pexelsImageUrl = image.url
                    rec.pexelsImageDescription = image.description
                    console.log("[Pexels] Found zone sign image:", image.url.substring(0, 50) + "...")
                  }
                  await delay(2000)
                  break
                } catch (error) {
                  console.error("[Pexels] Error fetching zone sign image:", error)
                  await delay(2000)
                }
              }
            }
          }
        }

        // Process localData in recommendations with specific context
        if (rec.localData) {
          for (let j = 0; j < rec.localData.length; j++) {
            const localData = rec.localData[j]
            if (!localData.pexelsImageUrl) {
              try {
                // Extract specific places or zones from the fact
                const factText = localData.fact.toLowerCase()
                let query = ""
                
                // Look for specific places in the fact
                const placeMatch = factText.match(/(plaza|piazza|calle|carrer|via|gran\s+vía|passeig|sagrada|colosseo|duomo|plaza\s+mayor|plaza\s+catalunya)/i)
                if (placeMatch) {
                  query = `${placeMatch[0]} ${country} parking`
                } else {
                  // Look for zones
                  const zoneMatch = factText.match(/(zona\s+azul|zona\s+blava|zona\s+blu|ztl)/i)
                  if (zoneMatch) {
                    query = `${zoneMatch[0]} ${country} parking sign`
                  } else {
                    // Generate query from fact with context
                    query = generatePexelsQuery(localData.fact, country, rec.title)
                  }
                }
                
                console.log("[Pexels] Searching for recommendation local data:", query)
                const image = await searchPexelsImage(query, pexelsKey)
                if (image) {
                  localData.pexelsImageUrl = image.url
                  localData.pexelsImageDescription = image.description
                  console.log("[Pexels] Found recommendation image:", image.url.substring(0, 50) + "...")
                }
                // Add delay between calls
                if (j < rec.localData.length - 1 || i < enrichedReport.recommendations.length - 1) {
                  await delay(2000)
                }
              } catch (error) {
                console.error("[Pexels] Error fetching recommendation image:", error)
                if (j < rec.localData.length - 1 || i < enrichedReport.recommendations.length - 1) {
                  await delay(2000)
                }
              }
            }
          }
        }
      }
    }

    // Process benchmark comparisons - add Pexels images for specific places
    if (enrichedReport.benchmarkComparisons) {
      for (const benchmark of enrichedReport.benchmarkComparisons) {
        if (!benchmark.pexelsImageUrl && benchmark.description) {
          // Look for place names in description
          const placeMatch = benchmark.description.match(/(plaza|piazza|via|street|avenue|boulevard)\s+([a-záéíóúàèìòù]+)/i)
          if (placeMatch) {
            const query = `${placeMatch[0]} ${country}`
            const image = await searchPexelsImage(query, pexelsKey)
            if (image) {
              benchmark.pexelsImageUrl = image.url
            }
          }
        }
      }
    }

    return NextResponse.json({ report: enrichedReport })
  } catch (error: any) {
    console.error("[Pexels] Error enriching report:", error)
    return NextResponse.json(
      { error: "Failed to enrich report with Pexels images" },
      { status: 500 }
    )
  }
}

