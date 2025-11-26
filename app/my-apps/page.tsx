"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { getAppProfiles, deleteAppProfile, duplicateAppProfile, type AppProfile, calculateHealthScore } from "@/lib/app-profile"
import { motion } from "framer-motion"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  TrendingUp,
  Smartphone,
  Globe,
  Sparkles,
  BarChart3,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"

export default function MyAppsPage() {
  const [profiles, setProfiles] = useState<AppProfile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    const allProfiles = getAppProfiles()
    // Calculate health scores for all profiles
    const profilesWithScores = allProfiles.map(profile => ({
      ...profile,
      healthScore: calculateHealthScore(profile),
    }))
    setProfiles(profilesWithScores)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this app profile?")) {
      deleteAppProfile(id)
      loadProfiles()
    }
  }

  const handleDuplicate = (id: string) => {
    duplicateAppProfile(id)
    loadProfiles()
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text-neutral-500"
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreBgColor = (score: number | undefined) => {
    if (!score) return "bg-neutral-800"
    if (score >= 80) return "bg-green-500/10 border-green-500/20"
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading apps...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">My Apps</h1>
            <p className="text-sm text-muted-foreground">
              Manage your app profiles and generate ASO reports
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-neutral-200"
          >
            <Plus className="h-4 w-4" />
            New App Profile
          </Link>
        </div>

        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No app profiles yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first app profile to start generating ASO reports
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />
              Create App Profile
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl border border-border bg-card p-4 sm:p-6 hover:border-neutral-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {profile.metadata?.icon ? (
                      <img
                        src={profile.metadata.icon}
                        alt={profile.name}
                        className="w-12 h-12 rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-6 w-6 text-neutral-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate">{profile.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.platform.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          >
                            {p === "ios" ? "iOS" : "Android"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                {profile.healthScore?.overallScore !== undefined && (
                  <div className={`mb-4 rounded-lg border p-3 ${getScoreBgColor(profile.healthScore.overallScore)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-400">ASO Health Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(profile.healthScore.overallScore)}`}>
                        {profile.healthScore.overallScore}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-neutral-500">Metadata</span>
                        <span className={`ml-1 ${getScoreColor(profile.healthScore.metadataScore)}`}>
                          {profile.healthScore.metadataScore || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Keywords</span>
                        <span className={`ml-1 ${getScoreColor(profile.healthScore.keywordCoverageScore)}`}>
                          {profile.healthScore.keywordCoverageScore || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Competitors</span>
                        <span className={`ml-1 ${getScoreColor(profile.healthScore.competitorStrengthScore)}`}>
                          {profile.healthScore.competitorStrengthScore || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Visuals</span>
                        <span className={`ml-1 ${getScoreColor(profile.healthScore.visualAssetsScore)}`}>
                          {profile.healthScore.visualAssetsScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{profile.targetMarket}</span>
                  </div>
                  {profile.metadata?.rating && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      <span>{profile.metadata.rating}/5</span>
                      {profile.metadata.reviews && (
                        <span className="text-neutral-600">({profile.metadata.reviews.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                  {profile.lastReportGeneratedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Last report: {format(new Date(profile.lastReportGeneratedAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Link
                    href={`/?profileId=${profile.id}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-neutral-200"
                  >
                    <FileText className="h-3 w-3" />
                    Generate Report
                  </Link>
                  <button
                    onClick={() => router.push(`/?profileId=${profile.id}&edit=true`)}
                    className="p-2 rounded-lg border border-border hover:bg-neutral-900 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-3 w-3 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(profile.id)}
                    className="p-2 rounded-lg border border-border hover:bg-neutral-900 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-3 w-3 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 rounded-lg border border-border hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

