import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchPexelsVideo } from "@/lib/pexels"

export async function GET(req: NextRequest) {
  try {
    // First, try to get video from Supabase
    const supabase = await createClient()
    const { data: config, error: dbError } = await supabase
      .from("app_config")
      .select("value, description")
      .eq("key", "aquarium_video_url")
      .single()

    if (!dbError && config && config.value) {
      // Return video from database
      return NextResponse.json({
        url: config.value,
        description: config.description || "Aquarium video from database",
      })
    }

    // If not in database, try to fetch from Pexels (fallback)
    const apiKey = req.nextUrl.searchParams.get("apiKey") || process.env.PEXELS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "No video found in database and Pexels API key not provided" },
        { status: 404 }
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

