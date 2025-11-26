"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ASOReport } from "@/lib/schemas"
import {
  Lightbulb,
  MapPin,
  Target,
  TrendingUp,
  Search,
  ImageIcon,
  Download,
  ExternalLink,
  Palette,
  BarChart3,
  Link as LinkIcon,
  Camera,
  MessageSquare,
  BookOpen,
  Calendar,
  TestTube,
  FileText,
  Languages,
  Eye,
  X as XIcon,
} from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface ASOReportViewProps {
  data: Partial<ASOReport>
}

// Icon with View Component
function IconWithView({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!isValidImageUrl(src)) return null

  if (hasError) {
    return null
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded-xl" />
        )}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-xl"
          onLoad={() => {
            setIsLoading(false)
          }}
          onError={() => {
            // Silently handle image loading errors (CORS, deleted images, etc.)
            // Only log in development mode
            if (process.env.NODE_ENV === "development") {
              console.warn("[ASO] Icon failed to load (this is normal for some external images):", src.substring(0, 80) + "...")
            }
            setHasError(true)
            setIsLoading(false)
          }}
          loading="lazy"
          crossOrigin="anonymous"
        />
        {!hasError && !isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
            type="button"
          >
            <Eye className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
      {!hasError && (
        <ImageModal src={src} alt={alt} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}

// Image Modal Component
function ImageModal({ src, alt, isOpen, onClose }: { src: string; alt: string; isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[95vh] sm:max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-8 sm:-top-10 right-0 sm:right-0 text-white hover:text-neutral-300 transition-colors z-10 p-2"
          aria-label="Close"
        >
          <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-auto max-h-[95vh] sm:max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  )
}

// Helper function to validate image URL
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (trimmed === "" || trimmed === "https://" || trimmed === "http://") return false
  
  // Check for truncated URLs (common patterns)
  if (trimmed.length < 15) return false // Too short to be a valid URL
  
  // Check for common truncated patterns
  if (trimmed.includes("https://play-lh.goog") && !trimmed.includes(".com") && !trimmed.includes(".net") && !trimmed.includes(".org")) {
    return false // Truncated Google Play URLs like "https://play-lh.goog..."
  }
  if (trimmed.includes("https://is") && !trimmed.includes(".apple.com") && !trimmed.includes(".com")) {
    return false // Truncated App Store URLs
  }
  
  // Check if URL ends with ellipsis or is incomplete
  if (trimmed.endsWith("...") || trimmed.endsWith("..") || trimmed.endsWith(".")) {
    return false
  }
  
  // Check if URL contains incomplete domain (like "goog" without ".com")
  if (trimmed.match(/https?:\/\/[^/]+\.(goog|appl|pexel|unsplash)$/i)) {
    return false // Incomplete domain
  }
  
  // Check for URLs that look like they might be truncated Google Play URLs
  // Google Play image URLs are typically much longer and have specific patterns
  if (trimmed.includes("play-lh.googleusercontent.com")) {
    // Google Play image URLs usually have a path with query parameters or are longer
    // If the pathname is very short (like just "/easypark2.png"), it's likely invalid
    try {
      const urlObj = new URL(trimmed)
      const pathname = urlObj.pathname
      // Google Play URLs typically have longer paths or query parameters
      // A simple filename like "/easypark2.png" is suspicious
      if (pathname && pathname.length < 20 && !urlObj.search && !pathname.includes("=")) {
        // This looks like a truncated or invalid URL
        return false
      }
    } catch {
      // If URL parsing fails, it's invalid
      return false
    }
  }
  
  try {
    const urlObj = new URL(trimmed)
    // Ensure the URL has a valid hostname (contains at least one dot or is localhost)
    if (!urlObj.hostname || urlObj.hostname.length < 4) return false
    if (urlObj.hostname !== "localhost" && !urlObj.hostname.includes(".")) return false
    // Check for incomplete hostnames
    if (urlObj.hostname.endsWith("goog") || urlObj.hostname.endsWith("appl") || urlObj.hostname.endsWith("pexel")) {
      return false
    }
    
    // Additional validation: check if the pathname looks valid
    const pathname = urlObj.pathname
    if (pathname && pathname.length > 0) {
      // Check for common image extensions
      const hasImageExtension = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)(\?|$|#)/i.test(pathname)
      // If no extension and no query params, might be invalid
      if (!hasImageExtension && !urlObj.search && pathname.length < 10) {
        // Very short pathname without extension or query params is suspicious
        return false
      }
    }
    
    return urlObj.protocol === "http:" || urlObj.protocol === "https:"
  } catch {
    return false
  }
}

// Small Image with Eye Icon Component
function SmallImageWithView({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!isValidImageUrl(src)) {
    return null // Don't render anything if URL is invalid
  }

  if (hasError) {
    return null // Don't show error placeholder, just don't render
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded-lg" />
        )}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg border border-border"
          onLoad={() => {
            setIsLoading(false)
          }}
          onError={() => {
            // Silently handle image loading errors (CORS, deleted images, etc.)
            // Only log in development mode
            if (process.env.NODE_ENV === "development") {
              console.warn("[ASO] Image failed to load (this is normal for some external images):", src.substring(0, 80) + "...")
            }
            setHasError(true)
            setIsLoading(false)
          }}
          loading="lazy"
          crossOrigin="anonymous"
        />
        {!hasError && !isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer z-10"
            type="button"
          >
            <Eye className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
      {!hasError && (
        <ImageModal src={src} alt={alt} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}

export function ASOReportView({ data }: ASOReportViewProps) {
  if (!data) return null

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-12 pb-12 sm:pb-16 md:pb-20 px-2 sm:px-0">
      {/* Visual Summary */}
      {data.visualSummary && (
        <section className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Strategic Visual Summary</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{data.visualSummary}</p>
        </section>
      )}

      {/* App Visual Assets */}
      {data.appVisualAssets && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
            App Visual Assets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {isValidImageUrl(data.appVisualAssets.iconUrl) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-xs font-medium text-white mb-3">Icon</h3>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-20 h-20 relative">
                    <IconWithView src={data.appVisualAssets.iconUrl} alt="App Icon" className="w-20 h-20 rounded-xl shadow-lg" />
                  </div>
                </div>
                {data.appVisualAssets.platforms && (
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    {data.appVisualAssets.platforms.map((platform, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400 border border-blue-500/20">
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.appVisualAssets.screenshots && data.appVisualAssets.screenshots.length > 0 && (
              <div className={`rounded-xl border border-border bg-card p-4 ${data.appVisualAssets.iconUrl ? "md:col-span-2" : "md:col-span-3"}`}>
                <h3 className="text-xs font-medium text-white mb-3">Screenshots</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {data.appVisualAssets.screenshots
                    .filter((url) => isValidImageUrl(url))
                    .slice(0, 8)
                    .map((url, i) => (
                      <SmallImageWithView
                        key={i}
                        src={url}
                        alt={`Screenshot ${i + 1}`}
                        className="aspect-[9/16]"
                      />
                    ))}
                </div>
                {data.appVisualAssets.screenshots.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    +{data.appVisualAssets.screenshots.length - 8} more
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* App Color Palette */}
      {data.appColorPalette && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
            Main Color Palette
          </h2>
          <ColorPaletteDisplay palette={data.appColorPalette} />
        </section>
      )}

      {/* UL-ASO Engine: 1. A/B Test Hypotheses */}
      {(data.ab_hypotheses || data.hypothesis?.length) && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
              <TestTube className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              A/B Test Hypotheses
            </h2>
          </div>
          {data.ab_hypotheses ? (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {data.ab_hypotheses}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {data.hypothesis?.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-neutral-700 transition-colors"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <span className="text-sm font-bold">H{i + 1}</span>
              </div>
              <h3 className="mb-2 font-medium text-white">{item.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{item.description}</p>
              
              {isValidImageUrl(item.screenshotUrl) && (
                <div className="mb-4">
                  <SmallImageWithView
                    src={item.screenshotUrl}
                    alt={item.title}
                    className="w-24 h-44 mx-auto"
                  />
                </div>
              )}

              {item.visualExample && (
                <div className="mb-4 rounded-lg bg-neutral-900/50 p-3 border border-neutral-800">
                  <p className="text-xs font-medium text-blue-400 mb-1">Visual Example</p>
                  <p className="text-xs text-neutral-400">{item.visualExample}</p>
                </div>
              )}

              <div className="rounded-lg bg-neutral-900/50 p-3">
                <p className="text-xs font-medium text-green-400">Expected Result</p>
                <p className="text-xs text-neutral-400 mt-1">{item.expectedOutcome}</p>
              </div>
            </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* UL-ASO Engine: 2. Cultural Insights */}
      {(data.cultural_insights || data.culturalInsights) && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
            Cultural Insights (Country + Category)
          </h2>
          {data.cultural_insights ? (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {data.cultural_insights}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
          Cultural Context and Local Data
        </h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard
            title="Urban Mobility"
            content={data.culturalInsights?.urbanMobility}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("mobilitat") || d.fact?.toLowerCase().includes("mobilitat")
            )}
            delay={0.1}
          />
          <InsightCard
            title="Local Regulations"
            content={data.culturalInsights?.regulations}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("regulació") || d.fact?.toLowerCase().includes("regulació")
            )}
            delay={0.2}
          />
          <InsightCard
            title="Lifestyle"
            content={data.culturalInsights?.lifestyle}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("estil") || d.relevance?.toLowerCase().includes("vida")
            )}
            delay={0.3}
          />
          <InsightCard
            title="Language and Tone"
            content={data.culturalInsights?.language}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("llengua") || d.relevance?.toLowerCase().includes("idioma")
            )}
            delay={0.4}
          />
          <InsightCard
            title="Seasonality"
            content={data.culturalInsights?.seasonality}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("estacional") || d.relevance?.toLowerCase().includes("temporada")
            )}
            delay={0.5}
          />
          <InsightCard
            title="Regional Focus"
            content={data.culturalInsights?.regionalFocus}
            localData={data.culturalInsights?.localData?.filter((d) =>
              d.relevance?.toLowerCase().includes("regional") || d.relevance?.toLowerCase().includes("regió")
            )}
            delay={0.6}
          />
        </div>

        {/* Local Market Details - Ultra-specific information */}
        {data.culturalInsights?.localMarketDetails && (
          <div className="mt-8 space-y-6">
            {/* Currency Information */}
            {(data.culturalInsights.localMarketDetails.currency || data.culturalInsights.localMarketDetails.currencySymbol) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-400" />
                  Currency and Local Format
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.culturalInsights.localMarketDetails.currency && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Currency</p>
                      <p className="text-sm text-white font-medium">{data.culturalInsights.localMarketDetails.currency}</p>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.currencySymbol && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Symbol</p>
                      <p className="text-sm text-white font-medium">{data.culturalInsights.localMarketDetails.currencySymbol}</p>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.currencyFormat && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Format</p>
                      <p className="text-sm text-white font-medium">{data.culturalInsights.localMarketDetails.currencyFormat}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specific Cities */}
            {data.culturalInsights.localMarketDetails.specificCities && data.culturalInsights.localMarketDetails.specificCities.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  Specific Cities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.culturalInsights.localMarketDetails.specificCities.map((city: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-border bg-neutral-900/50 p-4"
                    >
                      <h4 className="text-sm font-semibold text-white mb-2">{city.name}</h4>
                      <p className="text-xs text-neutral-300 mb-3 leading-relaxed">{city.characteristics}</p>
                      {city.famousStreets && city.famousStreets.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Famous Streets</p>
                          <div className="flex flex-wrap gap-1">
                            {city.famousStreets.map((street: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400 border border-blue-500/20">
                                {street}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {city.landmarks && city.landmarks.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Monuments</p>
                          <div className="flex flex-wrap gap-1">
                            {city.landmarks.map((landmark: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 rounded bg-purple-500/10 text-[10px] text-purple-400 border border-purple-500/20">
                                {landmark}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {city.localObjects && city.localObjects.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Local Objects</p>
                          <div className="flex flex-wrap gap-1">
                            {city.localObjects.map((obj: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 rounded bg-green-500/10 text-[10px] text-green-400 border border-green-500/20">
                                {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Language Characteristics */}
            {data.culturalInsights.localMarketDetails.languageCharacteristics && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-pink-400" />
                  Language Characteristics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.culturalInsights.localMarketDetails.languageCharacteristics.formalForms && data.culturalInsights.localMarketDetails.languageCharacteristics.formalForms.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Formal Forms</p>
                      <div className="flex flex-wrap gap-2">
                        {data.culturalInsights.localMarketDetails.languageCharacteristics.formalForms.map((form: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded bg-blue-500/10 text-xs text-blue-400 border border-blue-500/20">
                            {form}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.languageCharacteristics.informalForms && data.culturalInsights.localMarketDetails.languageCharacteristics.informalForms.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Informal Forms</p>
                      <div className="flex flex-wrap gap-2">
                        {data.culturalInsights.localMarketDetails.languageCharacteristics.informalForms.map((form: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded bg-green-500/10 text-xs text-green-400 border border-green-500/20">
                            {form}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.languageCharacteristics.commonPhrases && data.culturalInsights.localMarketDetails.languageCharacteristics.commonPhrases.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Common Phrases</p>
                      <div className="flex flex-wrap gap-2">
                        {data.culturalInsights.localMarketDetails.languageCharacteristics.commonPhrases.map((phrase: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded bg-yellow-500/10 text-xs text-yellow-400 border border-yellow-500/20">
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.languageCharacteristics.specificTerms && data.culturalInsights.localMarketDetails.languageCharacteristics.specificTerms.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Parking-Specific Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {data.culturalInsights.localMarketDetails.languageCharacteristics.specificTerms.map((term: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded bg-purple-500/10 text-xs text-purple-400 border border-purple-500/20">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.culturalInsights.localMarketDetails.languageCharacteristics.tonePreferences && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Preferred Tone</p>
                      <p className="text-sm text-white">{data.culturalInsights.localMarketDetails.languageCharacteristics.tonePreferences}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Local Objects */}
            {data.culturalInsights.localMarketDetails.localObjects && data.culturalInsights.localMarketDetails.localObjects.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-green-400" />
                  Specific Local Objects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.culturalInsights.localMarketDetails.localObjects.map((obj: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-border bg-neutral-900/50 p-4"
                    >
                      <h4 className="text-sm font-semibold text-white mb-2">{obj.name}</h4>
                      <p className="text-xs text-neutral-300 mb-2 leading-relaxed">{obj.description}</p>
                      <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20 mb-2">
                        <p className="text-[10px] text-blue-400 mb-1">Cultural Significance</p>
                        <p className="text-xs text-neutral-300">{obj.culturalSignificance}</p>
                      </div>
                      {isValidImageUrl(obj.visualReference) && (
                        <div className="mt-2">
                          <SmallImageWithView
                            src={obj.visualReference}
                            alt={obj.name}
                            className="w-full h-24"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Specifics */}
            {data.culturalInsights.localMarketDetails.legalSpecifics && data.culturalInsights.localMarketDetails.legalSpecifics.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-400" />
                  Specific Laws and Regulations
                </h3>
                <div className="space-y-4">
                  {data.culturalInsights.localMarketDetails.legalSpecifics.map((law: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-border bg-neutral-900/50 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">{law.lawName}</h4>
                          {law.lawNumber && (
                            <p className="text-xs text-muted-foreground font-mono">Número: {law.lawNumber}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 mb-3 leading-relaxed">{law.description}</p>
                      {law.zones && law.zones.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-muted-foreground mb-1">Affected Zones</p>
                          <div className="flex flex-wrap gap-1">
                            {law.zones.map((zone: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 rounded bg-red-500/10 text-[10px] text-red-400 border border-red-500/20">
                                {zone}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {law.source && (
                          <span className="text-[10px] text-blue-400 font-medium">Source: {law.source}</span>
                        )}
                        {law.link && (
                          <a
                            href={law.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View law
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Competitor Analysis */}
      {data.competitorAnalysis && data.competitorAnalysis.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
            Competitor Analysis
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {data.competitorAnalysis.map((comp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
              {isValidImageUrl(comp.iconUrl) && (
                <IconWithView
                  src={comp.iconUrl}
                  alt={`${comp.name} icon`}
                  className="w-12 h-12 rounded-xl"
                />
              )}
                    <div>
                      <h3 className="font-semibold text-white text-lg">{comp.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {comp.rating && (
                          <span className="text-sm text-yellow-400">⭐ {comp.rating}/5</span>
                        )}
                        {comp.reviewsCount && (
                          <span className="text-xs text-muted-foreground">({comp.reviewsCount} reviews)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">{comp.valueProp}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comp.keywords?.map((k, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 rounded-md bg-neutral-900 text-xs text-neutral-400 border border-neutral-800"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {comp.screenshots && comp.screenshots.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Screenshots</h4>
                  <div className="flex gap-2 flex-wrap">
                    {comp.screenshots
                      .filter((url) => isValidImageUrl(url))
                      .slice(0, 4)
                      .map((url, j) => (
                        <SmallImageWithView
                          key={j}
                          src={url}
                          alt={`${comp.name} screenshot ${j + 1}`}
                          className="w-16 h-28"
                        />
                      ))}
                  </div>
                  {comp.screenshots.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-2">+{comp.screenshots.length - 4} more</p>
                  )}
                </div>
              )}

              {isValidImageUrl(comp.screenshotUrl) && (
                <div className="mb-4">
                  <SmallImageWithView
                    src={comp.screenshotUrl}
                    alt={comp.name}
                    className="w-24 h-44 mx-auto"
                  />
                </div>
              )}

              {comp.colorPalette && (
                <div className="mb-4">
                  <ColorPaletteDisplay palette={comp.colorPalette} />
                </div>
              )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Visual Patterns</h4>
                  <ul className="space-y-1">
                    {comp.visualPatterns?.map((vp, k) => (
                      <li key={k} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                        {vp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-neutral-900/30 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Comparison</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">{comp.comparison}</p>
                </div>
              </div>
            </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
            Visual and Strategic Recommendations
          </h2>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {data.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="border-b border-border bg-neutral-900/50 p-3 sm:p-4">
                <h3 className="font-medium text-white text-sm sm:text-base">{rec.title}</h3>
              </div>
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rec.insight}</p>
                </div>

                {isValidImageUrl(rec.pexelsImageUrl) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Contextual image:</span>
                    </div>
                    <SmallImageWithView
                      src={rec.pexelsImageUrl}
                      alt={rec.pexelsImageDescription || rec.title}
                      className="w-32 h-20"
                    />
                    {rec.pexelsImageDescription && (
                      <p className="text-[10px] text-muted-foreground mt-1">{rec.pexelsImageDescription}</p>
                    )}
                  </div>
                )}

                {isValidImageUrl(rec.screenshotExample) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Example screenshot:</span>
                    </div>
                    <SmallImageWithView
                      src={rec.screenshotExample}
                      alt={rec.title}
                      className="w-24 h-44 mx-auto"
                    />
                  </div>
                )}

                {rec.colorPalette && (
                  <div className="mb-4">
                    <ColorPaletteDisplay 
                      palette={rec.colorPalette} 
                      isIconRecommendation={rec.title?.toLowerCase().includes('icon') || rec.insight?.toLowerCase().includes('icon')}
                    />
                  </div>
                )}

                {rec.localData && rec.localData.length > 0 && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-400">Local Data Supporting</span>
                    </div>
                    {rec.localData.map((data, idx) => (
                      <LocalDataCard key={idx} data={data} />
                    ))}
                  </div>
                )}

                {rec.implementationDetails && (
                  <div className="rounded-lg bg-neutral-900/50 p-4 border border-neutral-800">
                    <p className="text-xs font-semibold text-white mb-2">Implementation Details</p>
                    <p className="text-xs text-neutral-300 leading-relaxed">{rec.implementationDetails}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-300">Visual Elements</span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.visualElements?.map((el, k) => (
                          <span
                            key={k}
                            className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400 border border-blue-500/20"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Search className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-300">Copy Suggestions</span>
                      <ul className="list-disc list-inside text-xs text-neutral-400">
                        {rec.copySuggestions?.map((copy, k) => (
                          <li key={k}>{copy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {rec.localElements && rec.localElements.length > 0 && (
                    <div className="flex gap-2">
                      <MapPin className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-neutral-300">Local Elements</span>
                        <ul className="list-disc list-inside text-xs text-neutral-400">
                          {rec.localElements.map((el, k) => (
                            <li key={k}>{el}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
            Keyword Strategy
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {data.keywords.map((kw, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <h3 className="font-medium text-white mb-3">{kw.category}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {kw.terms?.map((term, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-sm text-blue-400 border border-blue-500/20"
                    >
                      {term}
                    </span>
                  ))}
                </div>
                {(kw.searchVolume || kw.competition) && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {kw.searchVolume && <span>Volume: {kw.searchVolume}</span>}
                    {kw.competition && <span>Competition: {kw.competition}</span>}
                  </div>
                )}
                {kw.localVariations && kw.localVariations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-neutral-300 mb-2">Local Variations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {kw.localVariations.map((variation, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 rounded bg-neutral-900 text-xs text-neutral-400"
                        >
                          {variation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Screenshot Proposals */}
      {data.screenshotProposals && data.screenshotProposals.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
            Detailed Screenshot Proposals
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {data.screenshotProposals.map((proposal, i) => (
              <ScreenshotProposalCard key={i} proposal={proposal} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Message Clusters */}
      {data.messageClusters && data.messageClusters.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
            Local Message Clusters
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {data.messageClusters.map((cluster, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <h3 className="font-medium text-white mb-3">{cluster.name}</h3>
                {cluster.examples && cluster.examples.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {cluster.examples.map((example, j) => (
                      <div key={j} className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
                        <p className="text-sm font-medium text-white mb-1">{example.headline}</p>
                        <p className="text-xs text-muted-foreground">{example.subheadline}</p>
                      </div>
                    ))}
                  </div>
                )}
                {cluster.keywords && cluster.keywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-neutral-300 mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.keywords.map((kw, j) => (
                        <span key={j} className="px-2 py-1 rounded bg-blue-500/10 text-xs text-blue-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cluster.useCases && cluster.useCases.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-300 mb-2">Use Cases</p>
                    <ul className="space-y-1">
                      {cluster.useCases.map((useCase, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-green-400" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Local Terminology */}
      {data.localTerminology && data.localTerminology.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Languages className="h-4 w-4 text-yellow-400" />
            Autochthonous Local Terminology
          </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {data.localTerminology.map((term, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <h3 className="font-medium text-white mb-2">{term.term}</h3>
                <p className="text-sm text-muted-foreground mb-2">{term.meaning}</p>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-400">
                    <span className="font-semibold">Context:</span> {term.context}
                  </p>
                  <p className="text-xs text-blue-400">
                    <span className="font-semibold">ASO:</span> {term.asoRelevance}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Cultural Elements */}
      {data.culturalElements && data.culturalElements.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-pink-400" />
            Specific Cultural Elements
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.culturalElements.map((element, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded bg-pink-500/10 text-xs text-pink-400 border border-pink-500/20">
                    {element.type}
                  </span>
                  <h3 className="font-medium text-white">{element.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{element.description}</p>
                <div className="bg-neutral-900/50 rounded-lg p-3 mb-3 border border-neutral-800">
                  <p className="text-xs font-semibold text-neutral-300 mb-1">Specific Details</p>
                  <p className="text-xs text-neutral-400">{element.specificDetails}</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-400 mb-1">ASO Application</p>
                  <p className="text-xs text-blue-300">{element.asoApplication}</p>
                </div>
                {element.visualReferences && element.visualReferences.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-neutral-300 mb-2">Visual References</p>
                    <div className="flex flex-wrap gap-1.5">
                      {element.visualReferences.map((ref, j) => (
                        <span key={j} className="px-2 py-1 rounded bg-neutral-900 text-xs text-neutral-400">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Competitor Insights */}
      {data.competitorInsights && data.competitorInsights.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-red-400" />
            Detailed Competitor Insights
          </h2>
          <div className="space-y-4">
            {data.competitorInsights.map((insight, i) => (
              <CompetitorInsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* 11. Benchmark Comparisons */}
      {data.benchmarkComparisons && data.benchmarkComparisons.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Visual Benchmark Comparisons
          </h2>
          <div className="space-y-6">
            {data.benchmarkComparisons.map((benchmark, i) => (
              <BenchmarkComparisonCard key={i} benchmark={benchmark} />
            ))}
          </div>
        </section>
      )}

      {/* 12. Experiment Roadmap */}
      {data.experimentRoadmap && data.experimentRoadmap.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <TestTube className="h-4 w-4 text-orange-400" />
            Experiment Roadmap
          </h2>
          <div className="space-y-4">
            {data.experimentRoadmap.map((experiment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">{experiment.name}</h3>
                    <p className="text-sm text-muted-foreground">{experiment.hypothesis}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-xs text-orange-400 border border-orange-500/20">
                    Test {i + 1}
                  </span>
                </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-neutral-300 mb-2">Variants</p>
                    <div className="space-y-1">
                      {experiment.variants.map((variant, j) => (
                        <span key={j} className="block text-xs text-neutral-400">
                          • {variant}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-neutral-300 mb-1">Target KPI</p>
                      <p className="text-xs text-green-400">{experiment.kpi}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-300 mb-1">Duration</p>
                      <p className="text-xs text-neutral-400">{experiment.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-300 mb-1">Sample Size</p>
                      <p className="text-xs text-neutral-400">{experiment.expectedSampleSize}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* UL-ASO Engine: New 11-section format */}
      {renderULASOSections(data)}
    </div>
  )
}

function ColorPaletteDisplay({ palette, isIconRecommendation = false }: { palette: any; isIconRecommendation?: boolean }) {
  if (!palette || !palette.colors || palette.colors.length === 0) return null
  
  return (
    <div className={`rounded-lg border ${isIconRecommendation ? 'border-purple-500/50 bg-purple-500/10' : 'border-border bg-neutral-900/30'} p-4 sm:p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Palette className={`h-4 w-4 ${isIconRecommendation ? 'text-purple-400' : 'text-purple-400'}`} />
        <h4 className={`text-xs sm:text-sm font-semibold ${isIconRecommendation ? 'text-purple-300' : 'text-white'}`}>
          {palette.name || (isIconRecommendation ? 'Icon Color Palette' : 'Color Palette')}
        </h4>
        {isIconRecommendation && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Icon Design
          </span>
        )}
      </div>
      {palette.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">{palette.description}</p>
      )}
      <div className={`grid ${palette.colors.length <= 3 ? 'grid-cols-3' : palette.colors.length <= 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'} gap-3 sm:gap-4`}>
        {palette.colors.map((color: any, idx: number) => (
          <div key={idx} className="space-y-2 sm:space-y-3">
            <div
              className="w-full h-20 sm:h-24 rounded-lg border-2 border-white/10 shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: color.hex || color.rgb }}
              title={`${color.hex || color.rgb} - ${color.usage || 'Color'}`}
            />
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono font-semibold text-white bg-black/30 px-1.5 py-0.5 rounded">
                {color.hex || 'N/A'}
              </p>
              <p className="text-[9px] sm:text-[10px] font-mono text-neutral-400">
                {color.rgb || 'N/A'}
              </p>
              {color.usage && (
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 leading-tight">
                  {color.usage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LocalDataCard({ data }: { data: any }) {
  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden">
      {isValidImageUrl(data.pexelsImageUrl) && (
        <div className="mb-3">
          <SmallImageWithView
            src={data.pexelsImageUrl}
            alt={data.pexelsImageDescription || "Local context image"}
            className="w-24 h-16"
          />
          {data.pexelsImageDescription && (
            <p className="text-[9px] text-neutral-400 mt-1 truncate">{data.pexelsImageDescription}</p>
          )}
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-white mb-2 leading-relaxed">{data.fact}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {data.source && (
            <span className="text-[10px] text-blue-400 font-medium">{data.source}</span>
          )}
          {data.link && (
            <a
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
            >
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          )}
        </div>
        {data.relevance && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">Relevance: {data.relevance}</p>
        )}
      </div>
    </div>
  )
}

function InsightCard({
  title,
  content,
  localData,
  delay,
}: {
  title: string
  content?: string
  localData?: any[]
  delay: number
}) {
  if (!content) return <div className="h-32 rounded-xl bg-card/50 border border-border/50 animate-pulse" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-neutral-200 leading-relaxed mb-3">{content}</p>
      {localData && localData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {localData.map((data, idx) => (
            <LocalDataCard key={idx} data={data} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ScreenshotProposalCard({ proposal, index }: { proposal: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          <span className="text-lg font-bold">S{proposal.number}</span>
        </div>
        <div>
          <h3 className="font-semibold text-white">{proposal.role}</h3>
          <p className="text-xs text-muted-foreground">{proposal.businessObjective}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Visual Content</p>
            <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800 space-y-2">
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-white">Type:</span> {proposal.visualContent?.backgroundType}
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {proposal.visualContent?.localSceneDescription}
              </p>
              {proposal.visualContent?.mandatoryElements && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-300 mb-1">Mandatory Elements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.visualContent.mandatoryElements.map((el: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-blue-500/10 text-[10px] text-blue-400">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {proposal.visualContent?.localObjects && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-300 mb-1">Autochthonous Objects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.visualContent.localObjects.map((obj: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-green-500/10 text-[10px] text-green-400">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {proposal.visualContent?.localStreets && proposal.visualContent.localStreets.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-300 mb-1">Specific Streets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.visualContent.localStreets.map((street: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-yellow-500/10 text-[10px] text-yellow-400">
                        {street}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {proposal.visualContent?.localLandmarks && proposal.visualContent.localLandmarks.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-300 mb-1">Reference Point</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.visualContent.localLandmarks.map((landmark: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-pink-500/10 text-[10px] text-pink-400">
                        {landmark}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Contingut UI</p>
            <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800 space-y-2">
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-white">Vista:</span> {proposal.uiContent?.viewName}
              </p>
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-white">Estat:</span> {proposal.uiContent?.state}
              </p>
              {proposal.uiContent?.visibleFields && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-300 mb-1">Camps Visibles</p>
                  <ul className="space-y-1">
                    {proposal.uiContent.visibleFields.map((field: string, i: number) => (
                      <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-blue-400" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Copy</p>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20 space-y-3">
              <div>
                <p className="text-xs font-medium text-blue-400 mb-1">Headline</p>
                <p className="text-sm text-white font-medium">{proposal.copy?.headline}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-purple-400 mb-1">Subheadline</p>
                <p className="text-xs text-neutral-300">{proposal.copy?.subheadline}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-400 mb-1">Cluster</p>
                <span className="px-2 py-1 rounded bg-green-500/10 text-[10px] text-green-400">
                  {proposal.copy?.messageCluster}
                </span>
              </div>
              {proposal.copy?.localPhrases && proposal.copy.localPhrases.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-yellow-400 mb-1">Local Phrases</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.copy.localPhrases.map((phrase: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-yellow-500/10 text-[10px] text-yellow-400">
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {proposal.abTestVariants && proposal.abTestVariants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Variants A/B</p>
              <div className="space-y-2">
                {proposal.abTestVariants.map((variant: any, i: number) => (
                  <div key={i} className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
                    <p className="text-xs font-medium text-white mb-1">Variant {variant.variantId}</p>
                    <p className="text-xs text-neutral-400 mb-2">{variant.changes}</p>
                    <p className="text-xs text-green-400">
                      <span className="font-medium">KPI:</span> {variant.kpiObjective}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function BenchmarkComparisonCard({ benchmark }: { benchmark: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="mb-4">
        <h3 className="text-md font-semibold text-white mb-2 capitalize">{benchmark.type} Comparison</h3>
        <p className="text-sm text-neutral-300 leading-relaxed mb-4">{benchmark.description}</p>
      </div>

      {(benchmark.appAssets || benchmark.competitorAssets || isValidImageUrl(benchmark.pexelsImageUrl)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {benchmark.appAssets?.iconUrl && isValidImageUrl(benchmark.appAssets.iconUrl) && (
            <div className="flex flex-col items-center text-center">
              <p className="text-xs text-neutral-400 mb-2">Your App</p>
              <IconWithView
                src={benchmark.appAssets.iconUrl}
                alt="App Asset"
                className="w-20 h-20 rounded-xl"
              />
            </div>
          )}
          {benchmark.competitorAssets && benchmark.competitorAssets.length > 0 && (
            <div className="flex flex-col items-center text-center">
              <p className="text-xs text-neutral-400 mb-2">Competitor</p>
              {isValidImageUrl(benchmark.competitorAssets[0]?.iconUrl) && (
                <IconWithView
                  src={benchmark.competitorAssets[0].iconUrl}
                  alt="Competitor Asset"
                  className="w-20 h-20 rounded-xl"
                />
              )}
            </div>
          )}
          {isValidImageUrl(benchmark.pexelsImageUrl) && (
            <div className="md:col-span-2 flex flex-col items-center text-center mt-4">
              <p className="text-xs text-neutral-400 mb-2">Local Context (Pexels)</p>
              <SmallImageWithView
                src={benchmark.pexelsImageUrl}
                alt={benchmark.pexelsImageDescription || "Local context"}
                className="w-48 h-32"
              />
              {benchmark.pexelsImageDescription && (
                <p className="text-[9px] text-neutral-500 mt-1">{benchmark.pexelsImageDescription}</p>
              )}
            </div>
          )}
        </div>
      )}

      {benchmark.insights && benchmark.insights.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">Insights</p>
          <ul className="space-y-1">
            {benchmark.insights.map((insight: string, j: number) => (
              <li key={j} className="text-sm text-neutral-300 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-cyan-400" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {benchmark.recommendations && benchmark.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Recommendations</p>
          <ul className="space-y-1">
            {benchmark.recommendations.map((rec: string, j: number) => (
              <li key={j} className="text-sm text-neutral-300 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-green-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

function CompetitorInsightCard({ insight }: { insight: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-lg mb-1">{insight.name}</h3>
          {insight.bundleId && (
            <p className="text-xs text-muted-foreground font-mono">{insight.bundleId}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-neutral-300 leading-relaxed">{insight.valueProposition}</p>
      </div>

      {insight.keyMessages && insight.keyMessages.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Key Messages</p>
          <div className="flex flex-wrap gap-2">
            {insight.keyMessages.map((msg: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-blue-400 border border-blue-500/20">
                {msg}
              </span>
            ))}
          </div>
        </div>
      )}

      {insight.screenshots && insight.screenshots.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Screenshot Analysis</p>
          <div className="space-y-2">
            {insight.screenshots.map((screenshot: any, i: number) => (
              <div key={i} className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
                <p className="text-xs font-medium text-white mb-1">Screenshot {screenshot.number}</p>
                <p className="text-xs text-neutral-400 mb-2">{screenshot.message}</p>
                {screenshot.visualElements && screenshot.visualElements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {screenshot.visualElements.map((el: string, j: number) => (
                      <span key={j} className="px-2 py-1 rounded bg-neutral-800 text-[10px] text-neutral-400">
                        {el}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {insight.gaps && insight.gaps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Gaps</p>
            <ul className="space-y-1">
              {insight.gaps.map((gap: string, i: number) => (
                <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-red-400" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
        {insight.opportunities && insight.opportunities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Opportunities</p>
            <ul className="space-y-1">
              {insight.opportunities.map((opp: string, i: number) => (
                <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-green-400" />
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard({ count, className }: { count: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("rounded-xl bg-card/50 border border-border/50 animate-pulse h-48", className)} />
      ))}
    </>
  )
}

// UL-ASO Engine: Render new 11-section format
function renderULASOSections(data: Partial<ASOReport>) {
  const sections = []
  
  // 3. Daily Life Moments
  if (data.daily_life_moments) {
    sections.push(
      <section key="daily_life_moments">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
          Daily Life Moments
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.daily_life_moments}
          </div>
        </div>
      </section>
    )
  }
  
  // 4. Language & Tone
  if (data.language_tone) {
    sections.push(
      <section key="language_tone">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
          Language, Tone & Local Expressions
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.language_tone}
          </div>
        </div>
      </section>
    )
  }
  
  // 5. Seasonality
  if (data.seasonality) {
    sections.push(
      <section key="seasonality">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          Seasonality
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.seasonality}
          </div>
        </div>
      </section>
    )
  }
  
  // 6. Cities
  if (data.cities) {
    sections.push(
      <section key="cities">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
          City-Level Insights
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.cities}
          </div>
        </div>
      </section>
    )
  }
  
  // 7. Competitors (new format)
  if (data.competitors) {
    sections.push(
      <section key="competitors">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
          Local Competitor Analysis
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.competitors}
          </div>
        </div>
      </section>
    )
  }
  
  // 8. Screenshots (new format)
  if (data.screenshots) {
    sections.push(
      <section key="screenshots">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />
          Screenshot Recommendations (1-8)
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.screenshots}
          </div>
        </div>
      </section>
    )
  }
  
  // 9. Visual Guidelines
  if (data.visual_guidelines) {
    sections.push(
      <section key="visual_guidelines">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
          Localized UI & Visual Guidelines
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.visual_guidelines}
          </div>
        </div>
      </section>
    )
  }
  
  // 10. Copywriting Pack
  if (data.copywriting_pack) {
    sections.push(
      <section key="copywriting_pack">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
          Copywriting Pack (10 Headlines + 10 CTAs)
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.copywriting_pack}
          </div>
        </div>
      </section>
    )
  }
  
  // 11. Priorities
  if (data.priorities) {
    sections.push(
      <section key="priorities">
        <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          Optimization Priorities
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="text-sm sm:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {data.priorities}
          </div>
        </div>
      </section>
    )
  }
  
  return sections
}
