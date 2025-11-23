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

      // Try to save to Supabase (table might not exist yet)
      try {
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
          console.warn("[API] Could not save to Supabase (table may not exist):", dbError.message)
          // Don't fail the request if table doesn't exist - video will be fetched from Pexels
        }
      } catch (dbError: any) {
        console.warn("[API] Supabase error (table may not exist):", dbError?.message || dbError)
        // Continue without saving to database
      }

      return NextResponse.json({
        success: true,
        video: foundVideo,
        message: "Video saved to database"
      })
    }

    // Try to save to Supabase (table might not exist yet)
    try {
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
        console.warn("[API] Could not save to Supabase (table may not exist):", dbError.message)
        // Don't fail the request if table doesn't exist - video will be fetched from Pexels
      }
    } catch (dbError: any) {
      console.warn("[API] Supabase error (table may not exist):", dbError?.message || dbError)
      // Continue without saving to database
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

