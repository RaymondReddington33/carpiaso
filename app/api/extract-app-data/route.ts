import { NextResponse } from "next/server"
import { extractAppStoreData } from "../generate-aso-report/route"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, platform } = body

    if (!url || !platform) {
      return NextResponse.json(
        { error: "Missing url or platform" },
        { status: 400 }
      )
    }

    if (platform !== "ios" && platform !== "android") {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'ios' or 'android'" },
        { status: 400 }
      )
    }

    console.log("[ExtractAppData] Extracting data from:", url, platform)

    const data = await extractAppStoreData(url, platform)

    return NextResponse.json({
      success: true,
      data: {
        title: data.title,
        description: data.description,
        subtitle: data.subtitle,
        category: data.category,
        icon: data.iconUrl,
        rating: data.rating,
        reviews: data.reviewsCount,
        screenshots: data.screenshots,
        developer: data.developer,
      },
    })
  } catch (error: any) {
    console.error("[ExtractAppData] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to extract app data" },
      { status: 500 }
    )
  }
}

