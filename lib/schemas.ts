import { z } from "zod"

// Input Schema
export const asoInputSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  appUrls: z.object({
    ios: z.string().url().optional().or(z.literal("")),
    android: z.string().url().optional().or(z.literal("")),
  }),
  platforms: z.array(z.enum(["ios", "android"])).min(1, "Select at least one platform"),
  country: z.string().min(1, "Country/Market is required"),
  language: z.string().min(1, "Language is required"), // Added language field
  category: z.string().min(1, "Category is required"),
  keywords: z.array(z.string()).max(5, "Maximum 5 keywords"), // Added keywords array (max 5)
  competitors: z
    .array(
      z.object({
        name: z.string().optional(), // Name is now optional, auto-generated
        iosUrl: z.string().optional(),
        androidUrl: z.string().optional(),
      }),
    )
    .optional(),
})

export type ASOInput = z.infer<typeof asoInputSchema>

// Color and Palette Schemas
export const colorSchema = z.object({
  rgb: z.string(), // e.g., "rgb(255, 100, 50)"
  hex: z.string(), // e.g., "#FF6432"
  usage: z.string(), // Description of where this color is used
})

export const paletteSchema = z.object({
  name: z.string(), // e.g., "Primary Palette", "Competitor Palette"
  colors: z.array(colorSchema),
  description: z.string(),
})

// Local Data Schema with citations
export const localDataSchema = z.object({
  fact: z.string(), // The concrete local fact/data
  source: z.string().optional(), // Source name
  link: z.string().url().optional(), // Link to verify/deepen
  relevance: z.string(), // Why this is relevant for ASO
  pexelsImageUrl: z.string().url().optional(), // Pexels image URL related to this local data
  pexelsImageDescription: z.string().optional(), // Description of the Pexels image
})

// Screenshot Proposal Schema
export const screenshotProposalSchema = z.object({
  number: z.number(), // S1, S2, etc.
  role: z.string(), // "hero", "functional", "social_proof"
  businessObjective: z.string(), // What business goal this screenshot serves
  visualContent: z.object({
    backgroundType: z.enum(["real_photo", "illustration", "ui_only", "hybrid"]),
    localSceneDescription: z.string(), // Detailed description of local scene
    mandatoryElements: z.array(z.string()), // Required elements (signs, codes, etc.)
    localObjects: z.array(z.string()), // Autochthonous objects (scooters, vans, etc.)
    localStreets: z.array(z.string()).optional(), // Specific street names
    localLandmarks: z.array(z.string()).optional(), // Local landmarks
  }),
  uiContent: z.object({
    viewName: z.string(), // Product view name
    visibleFields: z.array(z.string()), // Fields that must be visible
    state: z.string(), // UI state (zone free, expiring, expired)
  }),
  copy: z.object({
    headline: z.string(), // Headline in local language
    subheadline: z.string(), // Subheadline (max characters)
    messageCluster: z.string(), // Which message cluster this belongs to
    localPhrases: z.array(z.string()).optional(), // Autochthonous phrases used
  }),
  abTestVariants: z.array(
    z.object({
      variantId: z.string(), // A, B, C
      changes: z.string(), // Specific changes vs control
      kpiObjective: z.string(), // What KPI this tests
    })
  ).optional(),
})

// Competitor Insight Schema
export const competitorInsightSchema = z.object({
  name: z.string(),
  bundleId: z.string().optional(),
  valueProposition: z.string(),
  keyMessages: z.array(z.string()), // Main messages from screenshots
  screenshots: z.array(
    z.object({
      number: z.number(),
      message: z.string(),
      visualElements: z.array(z.string()),
    })
  ),
  gaps: z.array(z.string()), // What they don't cover
  opportunities: z.array(z.string()), // Opportunities for our app
})

// Message Cluster Schema
export const messageClusterSchema = z.object({
  name: z.string(), // e.g., "No stress, no multa"
  examples: z.array(
    z.object({
      headline: z.string(),
      subheadline: z.string(),
    })
  ),
  keywords: z.array(z.string()), // Related keywords
  useCases: z.array(z.string()), // When to use this cluster
})

// Local Terminology Schema
export const localTerminologySchema = z.object({
  term: z.string(), // Local term
  meaning: z.string(), // What it means
  context: z.string(), // When/where it's used
  asoRelevance: z.string(), // Why it matters for ASO
})

// Cultural Element Schema
export const culturalElementSchema = z.object({
  type: z.enum(["tradition", "event", "lifestyle", "visual", "language"]),
  name: z.string(),
  description: z.string(),
  specificDetails: z.string(), // Very specific details
  asoApplication: z.string(), // How to use in ASO
  visualReferences: z.array(z.string()).optional(), // Visual elements to include
})

// Output Schemas for the AI Report
export const hypothesisSchema = z.object({
  title: z.string(),
  description: z.string(),
  expectedOutcome: z.string(),
  screenshotUrl: z.string().url().optional(), // Real screenshot URL
  visualExample: z.string().optional(), // Description of visual example
})

// Local Market Details Schema - Ultra-specific local information
export const localMarketDetailsSchema = z.object({
  currency: z.string().optional(), // e.g., "EUR (€)", "USD ($)"
  currencySymbol: z.string().optional(), // e.g., "€", "$"
  currencyFormat: z.string().optional(), // e.g., "1.234,56 €" (European format)
  specificCities: z.array(z.object({
    name: z.string(), // e.g., "Madrid", "Barcelona", "Milano"
    characteristics: z.string(), // Specific characteristics of this city
    famousStreets: z.array(z.string()).optional(), // Famous streets in this city
    landmarks: z.array(z.string()).optional(), // Famous landmarks
    localObjects: z.array(z.string()).optional(), // Objects specific to this city
  })).optional(),
  languageCharacteristics: z.object({
    formalForms: z.array(z.string()).optional(), // Formal address forms
    informalForms: z.array(z.string()).optional(), // Informal address forms
    commonPhrases: z.array(z.string()).optional(), // Common local phrases
    specificTerms: z.array(z.string()).optional(), // Terms specific to parking/mobility
    tonePreferences: z.string().optional(), // Preferred tone (formal, casual, etc.)
  }).optional(),
  localObjects: z.array(z.object({
    name: z.string(), // e.g., "Vespa scooter", "furgoneta bianca"
    description: z.string(), // Description of the object
    culturalSignificance: z.string(), // Why it's culturally significant
    visualReference: z.string().url().optional(), // Pexels image URL
  })).optional(),
  legalSpecifics: z.array(z.object({
    lawName: z.string(), // Exact name of law/regulation
    lawNumber: z.string().optional(), // Law number if available
    description: z.string(), // What it regulates
    zones: z.array(z.string()).optional(), // Specific zones affected
    source: z.string().optional(), // Source
    link: z.string().url().optional(), // Link to law
  })).optional(),
})

export const culturalInsightsSchema = z.object({
  urbanMobility: z.string(),
  regulations: z.string(),
  lifestyle: z.string(),
  language: z.string(),
  seasonality: z.string(),
  regionalFocus: z.string(),
  localData: z.array(localDataSchema).optional(), // Concrete local data with citations
  localMarketDetails: localMarketDetailsSchema.optional(), // Ultra-specific local details
})

export const competitorAnalysisSchema = z.object({
  name: z.string(),
  valueProp: z.string(),
  visualPatterns: z.array(z.string()),
  keywords: z.array(z.string()).optional().or(z.array(z.string())),
  comparison: z.string(),
  screenshotUrl: z.string().url().optional(), // Real competitor screenshot
  screenshots: z.array(z.string().url()).optional(), // All competitor screenshots
  iconUrl: z.string().url().optional(), // Competitor app icon
  colorPalette: paletteSchema.optional(), // Extracted color palette
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
})

export const recommendationSchema = z.object({
  title: z.string(),
  insight: z.string(),
  visualElements: z.array(z.string()),
  copySuggestions: z.array(z.string()),
  localElements: z.array(z.string()),
  screenshotExample: z.string().url().optional(), // Example screenshot URL
  colorPalette: paletteSchema.optional(), // Recommended color palette
  localData: z.array(localDataSchema).optional(), // Local data supporting the recommendation
  implementationDetails: z.string().optional(), // Very specific implementation details
  screenshotProposal: screenshotProposalSchema.optional(), // Detailed screenshot proposal
  localTerminology: z.array(localTerminologySchema).optional(), // Local terms to use
  culturalElements: z.array(culturalElementSchema).optional(), // Cultural elements to incorporate
  specificStreets: z.array(z.string()).optional(), // Specific street names to reference
  specificLandmarks: z.array(z.string()).optional(), // Specific landmarks to show
  autochthonousObjects: z.array(z.string()).optional(), // Local objects to include
})

export const keywordSchema = z.object({
  category: z.string(),
  terms: z.array(z.string()),
  searchVolume: z.string().optional(), // Estimated search volume
  competition: z.string().optional(), // Competition level
  localVariations: z.array(z.string()).optional(), // Local variations of keywords
})

// App Visual Assets Schema
export const appVisualAssetsSchema = z.object({
  iconUrl: z.string().url().optional(), // Main app icon URL
  screenshots: z.array(z.string().url()).optional(), // All app screenshots
  platforms: z.array(z.string()).optional(), // Platforms (ios, android)
})

// Benchmark Comparison Schema
export const benchmarkComparisonSchema = z.object({
  type: z.enum(["icons", "screenshots", "colors", "copy"]),
  title: z.string(),
  description: z.string(),
  appAssets: appVisualAssetsSchema.optional(), // Our app assets
  competitorAssets: z.array(
    z.object({
      name: z.string(),
      iconUrl: z.string().url().optional(),
      screenshots: z.array(z.string().url()).optional(),
      colorPalette: paletteSchema.optional(),
    })
  ).optional(), // Competitor assets for comparison
  insights: z.array(z.string()), // Comparison insights
  recommendations: z.array(z.string()), // Recommendations based on comparison
  pexelsImageUrl: z.string().url().optional(), // Pexels image for context
})

export const asoReportSchema = z.object({
  hypothesis: z.array(hypothesisSchema),
  culturalInsights: culturalInsightsSchema,
  competitorAnalysis: z.array(competitorAnalysisSchema),
  recommendations: z.array(recommendationSchema),
  keywords: z.array(keywordSchema),
  appColorPalette: paletteSchema.optional(), // Main app color palette extracted from screenshots
  appVisualAssets: appVisualAssetsSchema.optional(), // App icon and screenshots
  visualSummary: z.string().optional(), // Overall visual strategy summary
  screenshotProposals: z.array(screenshotProposalSchema).optional(), // Detailed screenshot proposals
  messageClusters: z.array(messageClusterSchema).optional(), // Message clusters for the market
  localTerminology: z.array(localTerminologySchema).optional(), // Key local terminology
  culturalElements: z.array(culturalElementSchema).optional(), // Important cultural elements
  competitorInsights: z.array(competitorInsightSchema).optional(), // Detailed competitor insights
  benchmarkComparisons: z.array(benchmarkComparisonSchema).optional(), // Benchmark comparisons
  experimentRoadmap: z.array(
    z.object({
      name: z.string(),
      hypothesis: z.string(),
      variants: z.array(z.string()),
      kpi: z.string(),
      duration: z.string(),
      expectedSampleSize: z.string(),
    })
  ).optional(), // Roadmap of experiments to run
})

export type ASOReport = z.infer<typeof asoReportSchema>
