import { z } from "zod"

// App Profile Schema
export const appProfileSchema = z.object({
  id: z.string(),
  platform: z.array(z.enum(["ios", "android"])).min(1),
  appStoreURL: z.object({
    ios: z.string().url().optional().or(z.literal("")),
    android: z.string().url().optional().or(z.literal("")),
  }),
  name: z.string().min(1),
  appId: z.string().optional(),
  category: z.string().min(1),
  language: z.string().min(1),
  targetMarket: z.string().min(1),
  keywords: z.array(z.string()).max(5),
  competitors: z.array(
    z.object({
      name: z.string().optional(),
      iosUrl: z.string().optional(),
      androidUrl: z.string().optional(),
    })
  ).optional(),
  autoSuggestions: z.object({
    aiKeywords: z.array(z.object({
      keyword: z.string(),
      intent: z.string().optional(),
      searchVolume: z.string().optional(),
      competition: z.string().optional(),
    })).optional(),
    aiCompetitors: z.array(z.object({
      name: z.string(),
      url: z.string().optional(),
      reason: z.string().optional(),
    })).optional(),
    aiMarkets: z.array(z.object({
      country: z.string(),
      language: z.string(),
      opportunity: z.string().optional(),
    })).optional(),
    recommendations: z.string().optional(),
  }).optional(),
  metadata: z.object({
    icon: z.string().url().optional(),
    rating: z.number().optional(),
    reviews: z.number().optional(),
    descriptionShort: z.string().optional(),
    descriptionLong: z.string().optional(),
    screenshots: z.array(z.string().url()).optional(),
    developer: z.string().optional(),
  }).optional(),
  healthScore: z.object({
    metadataScore: z.number().min(0).max(100).optional(),
    keywordCoverageScore: z.number().min(0).max(100).optional(),
    competitorStrengthScore: z.number().min(0).max(100).optional(),
    visualAssetsScore: z.number().min(0).max(100).optional(),
    overallScore: z.number().min(0).max(100).optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastReportGeneratedAt: z.string().optional(),
  lastReportId: z.string().optional(),
})

export type AppProfile = z.infer<typeof appProfileSchema>

// Storage functions for App Profiles
const STORAGE_KEY = "aso_app_profiles"

export function saveAppProfile(profile: AppProfile): void {
  try {
    const profiles = getAppProfiles()
    const existingIndex = profiles.findIndex((p) => p.id === profile.id)
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = {
        ...profile,
        updatedAt: new Date().toISOString(),
      }
    } else {
      profiles.push({
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch (error) {
    console.error("[AppProfile] Error saving profile:", error)
  }
}

export function getAppProfiles(): AppProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const profiles = JSON.parse(stored)
    return profiles.map((p: any) => ({
      ...p,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("[AppProfile] Error loading profiles:", error)
    return []
  }
}

export function getAppProfile(id: string): AppProfile | null {
  const profiles = getAppProfiles()
  return profiles.find((p) => p.id === id) || null
}

export function deleteAppProfile(id: string): void {
  try {
    const profiles = getAppProfiles()
    const filtered = profiles.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("[AppProfile] Error deleting profile:", error)
  }
}

export function duplicateAppProfile(id: string): AppProfile | null {
  const profile = getAppProfile(id)
  if (!profile) return null
  
  const duplicated: AppProfile = {
    ...profile,
    id: `${profile.id}_copy_${Date.now()}`,
    name: `${profile.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastReportGeneratedAt: undefined,
    lastReportId: undefined,
  }
  
  saveAppProfile(duplicated)
  return duplicated
}

export function updateAppProfileLastReport(id: string, reportId: string): void {
  const profile = getAppProfile(id)
  if (!profile) return
  
  const updated: AppProfile = {
    ...profile,
    lastReportGeneratedAt: new Date().toISOString(),
    lastReportId: reportId,
    updatedAt: new Date().toISOString(),
  }
  
  saveAppProfile(updated)
}

// Health Score calculation
export function calculateHealthScore(profile: AppProfile): AppProfile["healthScore"] {
  let metadataScore = 0
  let keywordCoverageScore = 0
  let competitorStrengthScore = 0
  let visualAssetsScore = 0
  
  // Metadata Score (0-100)
  if (profile.metadata?.descriptionShort) metadataScore += 20
  if (profile.metadata?.descriptionLong) metadataScore += 20
  if (profile.metadata?.icon) metadataScore += 20
  if (profile.metadata?.rating !== undefined) metadataScore += 20
  if (profile.metadata?.screenshots && profile.metadata.screenshots.length >= 3) metadataScore += 20
  
  // Keyword Coverage Score (0-100)
  if (profile.keywords.length >= 1) keywordCoverageScore += 20
  if (profile.keywords.length >= 3) keywordCoverageScore += 20
  if (profile.keywords.length >= 5) keywordCoverageScore += 20
  if (profile.autoSuggestions?.aiKeywords && profile.autoSuggestions.aiKeywords.length > 0) keywordCoverageScore += 20
  if (profile.autoSuggestions?.aiKeywords && profile.autoSuggestions.aiKeywords.length >= 10) keywordCoverageScore += 20
  
  // Competitor Strength Score (0-100)
  if (profile.competitors && profile.competitors.length >= 1) competitorStrengthScore += 25
  if (profile.competitors && profile.competitors.length >= 3) competitorStrengthScore += 25
  if (profile.autoSuggestions?.aiCompetitors && profile.autoSuggestions.aiCompetitors.length > 0) competitorStrengthScore += 25
  if (profile.competitors && profile.competitors.length >= 5) competitorStrengthScore += 25
  
  // Visual Assets Score (0-100)
  if (profile.metadata?.icon) visualAssetsScore += 30
  if (profile.metadata?.screenshots && profile.metadata.screenshots.length >= 1) visualAssetsScore += 20
  if (profile.metadata?.screenshots && profile.metadata.screenshots.length >= 3) visualAssetsScore += 25
  if (profile.metadata?.screenshots && profile.metadata.screenshots.length >= 5) visualAssetsScore += 25
  
  const overallScore = Math.round(
    (metadataScore + keywordCoverageScore + competitorStrengthScore + visualAssetsScore) / 4
  )
  
  return {
    metadataScore,
    keywordCoverageScore,
    competitorStrengthScore,
    visualAssetsScore,
    overallScore,
  }
}

