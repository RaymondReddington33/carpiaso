import { NextRequest, NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { openaiApiKey, pexelsApiKey } = body

    const results: {
      openai?: { status: "success" | "error"; message: string; credits?: string }
      pexels?: { status: "success" | "error"; message: string }
    } = {}

    // Check OpenAI API
    if (openaiApiKey) {
      try {
        // Make a minimal test call to verify the key
        const modelsResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
        })

        if (modelsResponse.ok) {
          // Try to get usage information
          let usageInfo = "Check your dashboard to see detailed usage"
          try {
            // Try to get billing/usage info (may not be available for all accounts)
            const usageResponse = await fetch("https://api.openai.com/v1/usage?start_date=2024-01-01&end_date=2025-12-31", {
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
              },
            })
            
            if (usageResponse.ok) {
              const usageData = await usageResponse.json()
              // Calculate approximate costs (rough estimate)
              if (usageData.total_usage) {
                const totalUsage = usageData.total_usage / 1000000 // Convert to millions
                usageInfo = `Approximate usage: ${totalUsage.toFixed(2)}M tokens`
              }
            }
          } catch (usageError) {
            // Usage API might not be available, that's okay
            console.log("[API Status] Usage API not available, using default message")
          }

          // Try to get subscription info
          let subscriptionInfo = ""
          try {
            const subscriptionResponse = await fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
              },
            })
            
            if (subscriptionResponse.ok) {
              const subData = await subscriptionResponse.json()
              if (subData.hard_limit_usd) {
                subscriptionInfo = ` | Limit: $${subData.hard_limit_usd.toFixed(2)}`
              }
            }
          } catch (subError) {
            // Subscription API might not be available
            console.log("[API Status] Subscription API not available")
          }

          results.openai = {
            status: "success",
            message: "API key is valid and working",
            credits: usageInfo + subscriptionInfo || "Check your dashboard to see usage and credits",
          }
        } else if (modelsResponse.status === 401) {
          results.openai = {
            status: "error",
            message: "Invalid API key. Please check your key and try again.",
          }
        } else if (modelsResponse.status === 429) {
          results.openai = {
            status: "error",
            message: "Rate limit exceeded. You may have run out of credits.",
          }
        } else {
          results.openai = {
            status: "error",
            message: `API error: ${modelsResponse.status} ${modelsResponse.statusText}`,
          }
        }
      } catch (error: any) {
        results.openai = {
          status: "error",
          message: error.message || "Failed to connect to OpenAI API",
        }
      }
    }

    // Check Pexels API
    if (pexelsApiKey) {
      try {
        const response = await fetch("https://api.pexels.com/v1/search?query=test&per_page=1", {
          headers: {
            Authorization: pexelsApiKey,
          },
        })

        if (response.ok) {
          results.pexels = {
            status: "success",
            message: "API key is valid and working",
          }
        } else if (response.status === 401) {
          results.pexels = {
            status: "error",
            message: "Invalid API key. Please check your key and try again.",
          }
        } else {
          results.pexels = {
            status: "error",
            message: `API error: ${response.status} ${response.statusText}`,
          }
        }
      } catch (error: any) {
        results.pexels = {
          status: "error",
          message: error.message || "Failed to connect to Pexels API",
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check API status" },
      { status: 500 }
    )
  }
}

