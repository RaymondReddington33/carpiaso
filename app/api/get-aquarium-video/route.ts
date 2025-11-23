import { NextRequest, NextResponse } from "next/server"
import { searchPexelsVideo } from "@/lib/pexels"

export async function GET(req: NextRequest) {
  try {
    // Get Pexels API key from query params or environment
    const apiKey = req.nextUrl.searchParams.get("apiKey") || process.env.PEXELS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Pexels API key not provided" },
        { status: 400 }
      )
    }

    // Search for aquarium/fish tank video
    const video = await searchPexelsVideo("aquarium fish tank", apiKey)

    if (!video) {
      // Fallback: try alternative queries
      const fallbackQueries = ["underwater fish", "fish swimming", "aquarium"]
      for (const query of fallbackQueries) {
        const fallbackVideo = await searchPexelsVideo(query, apiKey)
        if (fallbackVideo) {
          return NextResponse.json(fallbackVideo)
        }
      }
      
      return NextResponse.json(
        { error: "No aquarium video found" },
        { status: 404 }
      )
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error("[API] Error fetching aquarium video:", error)
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    )
  }
}

