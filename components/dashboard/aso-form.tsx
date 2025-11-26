"use client"
import { motion } from "framer-motion"
import type React from "react"

import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { asoInputSchema, type ASOInput } from "@/lib/schemas"
import { APP_STORE_CATEGORIES, GOOGLE_PLAY_CATEGORIES, COUNTRIES, LANGUAGES } from "@/lib/constants"
import { Loader2, Search, Globe, Smartphone, Layers, LinkIcon, Plus, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"

interface ASOFormProps {
  onSubmit: (data: ASOInput) => void
  isLoading: boolean
}

const extractIdFromUrl = (url: string, platform: "ios" | "android") => {
  try {
    if (!url) return ""
    if (platform === "ios") {
      // Extract ID from iOS URL (e.g., https://apps.apple.com/us/app/app-name/id123456789)
      const match = url.match(/id\d+/)
      return match ? match[0].replace("id", "") : "" // Return just the ID number if preferred, or keep "id123..."
    } else {
      // Extract package name from Android URL (e.g., https://play.google.com/store/apps/details?id=com.example.app)
      const urlObj = new URL(url)
      return urlObj.searchParams.get("id") || ""
    }
  } catch (e) {
    // Fallback regex for Android if URL object fails or partial URL
    if (platform === "android") {
      const match = url.match(/id=([^&]+)/)
      return match ? match[1] : ""
    }
    return ""
  }
}

export function ASOForm({ onSubmit, isLoading }: ASOFormProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<("ios" | "android")[]>(["ios"])
  const [keywordInput, setKeywordInput] = useState("") // State for keyword input
  const [competitorNames, setCompetitorNames] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ASOInput>({
    resolver: zodResolver(asoInputSchema),
    defaultValues: {
      platforms: ["ios"],
      appUrls: { ios: "", android: "" },
      competitors: [],
      keywords: [], // Default keywords
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "competitors",
  })

  const platforms = watch("platforms")
  const showIos = platforms?.includes("ios")
  const showAndroid = platforms?.includes("android")
  const currentKeywords = watch("keywords") // Watch keywords

  const appIosUrl = watch("appUrls.ios")
  const appAndroidUrl = watch("appUrls.android")
  const appName = watch("appName")

  useEffect(() => {
    let id = ""
    if (showIos && appIosUrl) {
      id = extractIdFromUrl(appIosUrl, "ios")
    } else if (showAndroid && appAndroidUrl) {
      id = extractIdFromUrl(appAndroidUrl, "android")
    }

    if (id && id !== appName) {
      setValue("appName", id)
    }
  }, [appIosUrl, appAndroidUrl, showIos, showAndroid, setValue, appName]) // Removed appName from dependency to allow overwrite


  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (keywordInput.trim() && (currentKeywords?.length || 0) < 5) {
        setValue("keywords", [...(currentKeywords || []), keywordInput.trim()])
        setKeywordInput("")
      }
    }
  }

  const removeKeyword = (index: number) => {
    setValue(
      "keywords",
      currentKeywords?.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-0">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">New ASO Report</h1>
        <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
          Generate strategic insights for your app based on local culture and competitors.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm overflow-hidden"
      >
        {/* Platform selector with checkboxes for multiple selection */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</label>
          <Controller
            name="platforms"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value?.includes("ios")}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), "ios"]
                        : field.value?.filter((p) => p !== "ios") || []
                      field.onChange(newValue)
                      setSelectedPlatforms(newValue as ("ios" | "android")[])
                    }}
                  />
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">iOS App Store</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value?.includes("android")}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), "android"]
                        : field.value?.filter((p) => p !== "android") || []
                      field.onChange(newValue)
                      setSelectedPlatforms(newValue as ("ios" | "android")[])
                    }}
                  />
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Google Play Store</span>
                </label>
              </div>
            )}
          />
          {errors.platforms && <p className="text-xs text-red-500">{errors.platforms.message}</p>}
        </div>

        <div className="space-y-4">
          {showIos && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                iOS App Store URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  {...register("appUrls.ios")}
                  placeholder="https://apps.apple.com/..."
                  className="w-full rounded-lg border border-input bg-background pl-9 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>
          )}

          {showAndroid && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Google Play Store URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  {...register("appUrls.android")}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full rounded-lg border border-input bg-background pl-9 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">App Name / ID</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                {...register("appName")}
                readOnly
                tabIndex={-1}
                placeholder="Auto-generated from URL..."
                className="w-full rounded-lg border border-input bg-muted/30 pl-9 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 cursor-default"
              />
              {appName && (
                <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-green-400">
                  <Sparkles className="h-3 w-3" />
                  <span>Auto-detected</span>
                </div>
              )}
            </div>
            {errors.appName && <p className="text-xs text-red-500">{errors.appName.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val)
                    // setSelectedCategory(val) // Removed state update
                  }}
                >
                  <SelectTrigger className="w-full">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(
                      showIos && showAndroid
                        ? { ...APP_STORE_CATEGORIES, ...GOOGLE_PLAY_CATEGORIES }
                        : showIos
                          ? APP_STORE_CATEGORIES
                          : GOOGLE_PLAY_CATEGORIES,
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Language</label>
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.language && <p className="text-xs text-red-500">{errors.language.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Market</label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Focus Keywords (Max 5)
          </label>
          <div className="rounded-lg border border-input bg-background px-3 py-2 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all">
            <div className="flex flex-wrap gap-2">
              {currentKeywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-1 text-muted-foreground hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder={currentKeywords?.length === 0 ? "Type keyword and press Enter..." : ""}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-[120px]"
                disabled={(currentKeywords?.length || 0) >= 5}
              />
            </div>
          </div>
          {errors.keywords && <p className="text-xs text-red-500">{errors.keywords.message}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Competitors (Optional)
            </label>
            <button
              type="button"
              onClick={() => append({ name: "", iosUrl: "", androidUrl: "" })}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Competitor
            </button>
          </div>

          {fields.map((field, index) => {
            const compIosUrl = watch(`competitors.${index}.iosUrl`)
            const compAndroidUrl = watch(`competitors.${index}.androidUrl`)
            const compName = watch(`competitors.${index}.name`)

            // Auto-generate name for this specific competitor when URLs change
            useEffect(() => {
              let id = ""
              // Check iOS URL first if it exists and iOS is selected
              if (showIos && compIosUrl) {
                id = extractIdFromUrl(compIosUrl, "ios")
              } 
              // If no iOS URL or no ID found, check Android URL
              if (!id && showAndroid && compAndroidUrl) {
                id = extractIdFromUrl(compAndroidUrl, "android")
              }

              // Auto-generate name if we have an ID and it's different from current name
              if (id && id !== compName) {
                setValue(`competitors.${index}.name`, id, { shouldValidate: false })
              }
            }, [compIosUrl, compAndroidUrl, showIos, showAndroid, compName, index, setValue])

            return (
              <div key={field.id} className="space-y-2 p-3 rounded-lg border border-border bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 relative min-w-0">
                    <input
                      {...register(`competitors.${index}.name`)}
                      readOnly
                      tabIndex={-1}
                      placeholder="Name auto-generated..."
                      className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 cursor-default"
                    />
                    {compName && (
                      <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-green-400">
                        <Sparkles className="h-3 w-3" />
                        <span>Auto-detected</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {showIos && (
                  <input
                    {...register(`competitors.${index}.iosUrl`)}
                    placeholder="iOS App Store URL"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  />
                )}

                {showAndroid && (
                  <input
                    {...register(`competitors.${index}.androidUrl`)}
                    placeholder="Google Play Store URL"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  />
                )}
              </div>
            )
          })}

          {fields.length === 0 && (
            <p className="text-[10px] text-muted-foreground">
              Add competitors to analyze their strategies and positioning.
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed",
              isLoading && "animate-pulse",
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Market...
              </span>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
