import { NextRequest, NextResponse } from "next/server"
import { searchPexelsVideo } from "@/lib/pexels"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pexelsApiKey } = body

    if (!pexelsApiKey) {
      return NextResponse.json(
        { error: "Pexels API key is required" },
        { status: 400 }
      )
    }

    // Search for aquarium video
    const video = await searchPexelsVideo("aquarium fish tank", pexelsApiKey)

    if (!video) {
      // Try fallback queries
      const fallbackQueries = ["underwater fish", "fish swimming", "aquarium"]
      let foundVideo = null
      
      for (const query of fallbackQueries) {
        foundVideo = await searchPexelsVideo(query, pexelsApiKey)
        if (foundVideo) break
      }

      if (!foundVideo) {
        return NextResponse.json(
          { error: "No aquarium video found" },
          { status: 404 }
        )
      }

      // Save to Supabase
      const supabase = await createClient()
      const { error: dbError } = await supabase
        .from("app_config")
        .upsert({
          key: "aquarium_video_url",
          value: foundVideo.url,
          description: foundVideo.description,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "key"
        })

      if (dbError) {
        console.error("[API] Error saving to Supabase:", dbError)
        return NextResponse.json(
          { error: "Failed to save video to database" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        video: foundVideo,
        message: "Video saved to database"
      })
    }

    // Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from("app_config")
      .upsert({
        key: "aquarium_video_url",
        value: video.url,
        description: video.description,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key"
      })

    if (dbError) {
      console.error("[API] Error saving to Supabase:", dbError)
      return NextResponse.json(
        { error: "Failed to save video to database" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      video: video,
      message: "Video saved to database"
    })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

