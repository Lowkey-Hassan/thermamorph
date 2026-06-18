/**
 * Server-side Hugging Face vision integration.
 *
 * Uses the BLIP image-captioning model to extract building condition signals
 * from uploaded photos. Results feed directly into the energy engine's
 * vision-override pass to adjust problem-area severities.
 *
 * Setup:
 *   1. Create a free account at https://huggingface.co
 *   2. Settings > Access Tokens > New token (read scope is sufficient)
 *   3. Add to .env.local:  HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
 *
 * Free tier: ~30 000 inference calls/month, no credit card required.
 */

const CAPTION_MODEL = 'Salesforce/blip-image-captioning-base'
const HF_API_BASE   = 'https://api-inference.huggingface.co/models'

/** Per-image timeout in ms. HF cold-starts can be slow on free tier. */
const REQUEST_TIMEOUT_MS = 15_000

/** Maximum number of images to analyse per audit (keeps free-tier usage in check). */
export const MAX_IMAGES_PER_AUDIT = 5

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisionInsights {
  // Window signals
  hasOldWindows:        boolean
  hasSinglePaneWindows: boolean
  // HVAC signals
  hasOldAcUnit:         boolean
  hasDirtyEquipment:    boolean
  // Lighting
  hasFluorescentLighting: boolean
  hasOldLighting:       boolean
  // Building fabric
  hasRoofDamage:        boolean
  hasCracks:            boolean
  hasMould:             boolean
  hasGoodInsulation:    boolean
  // Metadata
  rawCaptions:     string[]
  imagesAnalyzed:  number
  confidence:      'high' | 'low' | 'none'
  skippedReason?:  string
}

const EMPTY_INSIGHTS: Readonly<VisionInsights> = {
  hasOldWindows:         false,
  hasSinglePaneWindows:  false,
  hasOldAcUnit:          false,
  hasDirtyEquipment:     false,
  hasFluorescentLighting: false,
  hasOldLighting:        false,
  hasRoofDamage:         false,
  hasCracks:             false,
  hasMould:              false,
  hasGoodInsulation:     false,
  rawCaptions:           [],
  imagesAnalyzed:        0,
  confidence:            'none',
}

// ─── Token validation ─────────────────────────────────────────────────────────

/**
 * Validate the HF token format without making a network call.
 * HF tokens are either `hf_...` (user tokens) or `api_org_...` (org tokens).
 */
function isValidHFToken(token: string): boolean {
  return /^(hf_|api_org_)[A-Za-z0-9]{10,}$/.test(token)
}

// ─── Image captioning ─────────────────────────────────────────────────────────

/**
 * Request a caption for a single image URL from the HF Inference API.
 * Returns `null` on any error — callers filter nulls after collecting results.
 */
async function captionImageUrl(url: string, token: string): Promise<string | null> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${HF_API_BASE}/${CAPTION_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Pass as a URL so HF fetches the image server-side
      body:   JSON.stringify({ inputs: url }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Log status but not the full body to avoid leaking token details
      const text = await response.text().catch(() => '')
      console.warn(`[hf-vision] HTTP ${response.status}: ${text.slice(0, 100)}`)
      return null
    }

    const json = await response.json() as unknown
    // BLIP returns: [{ generated_text: "a photo of ..." }]
    if (Array.isArray(json) && json.length > 0 && typeof json[0]?.generated_text === 'string') {
      return (json[0].generated_text as string).trim() || null
    }
    return null

  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[hf-vision] Request timed out after', REQUEST_TIMEOUT_MS, 'ms')
    } else {
      console.warn('[hf-vision] Request failed:', err instanceof Error ? err.message : String(err))
    }
    return null
  }
}

// ─── Signal parsing ───────────────────────────────────────────────────────────

type InsightFlags = Omit<VisionInsights, 'rawCaptions' | 'imagesAnalyzed' | 'confidence' | 'skippedReason'>

/**
 * Parse free-text captions into structured boolean signals.
 * All regex patterns use word boundaries or specific phrasing to reduce
 * false positives on ambiguous captions.
 */
function parseInsights(captions: string[]): InsightFlags {
  const c = captions.join(' ').toLowerCase()

  return {
    hasOldWindows:
      /old\s+window|wooden\s+(window|frame)|deteriorat\w*\s+window|aged\s+window|rusted\s+(frame|window)|weathered\s+window/.test(c),

    hasSinglePaneWindows:
      /single[\s-]pane|single\s+glass|thin\s+glass/.test(c),

    hasOldAcUnit:
      /old\s+(air\s+condition|ac\b|split\s+unit|hvac|unit)|rusted\s+(air|unit|conditioner)|aged\s+(hvac|unit|conditioner)|worn\s+(unit|conditioner)/.test(c),

    hasDirtyEquipment:
      /\bdirty\b|\bdust[yi]\w*\b|\bgrimy\b|\bclogged\b|\bgrime\b/.test(c),

    hasFluorescentLighting:
      /fluorescent|tube\s+(light|lamp)|strip\s+light/.test(c),

    hasOldLighting:
      /old\s+light|yellow\s+light|dim\s+light|\bhalogen\b|\bincandescent\b/.test(c),

    hasRoofDamage:
      /crack\w*\s+roof|damage[d]?\s+roof|deteriorat\w*\s+roof|old\s+roof|leak\w*\s+roof|broken\s+tile/.test(c),

    hasCracks:
      /\bcrack\w*\b|\bfracture\w*\b|\bgap\s+(in|on)\s+(wall|ceiling|floor)/.test(c),

    hasMould:
      /\bm[o]?uld?\b|\bdamp\b|\bmoisture\s+(stain|patch|damage)/.test(c),

    hasGoodInsulation:
      /\binsulat(ed|ion)\b|double[\s-]glaz|triple[\s-]glaz|modern\s+window|energy[\s-]efficient/.test(c),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse up to `MAX_IMAGES_PER_AUDIT` images and return structured building
 * condition signals. Gracefully degrades to empty insights on any failure.
 */
export async function analyzeImages(imageUrls: string[]): Promise<VisionInsights> {
  const token = process.env.HF_API_TOKEN

  if (!token) {
    return { ...EMPTY_INSIGHTS, skippedReason: 'HF_API_TOKEN not configured' }
  }
  if (!isValidHFToken(token)) {
    console.warn('[hf-vision] HF_API_TOKEN does not match expected format (hf_... or api_org_...)')
    return { ...EMPTY_INSIGHTS, skippedReason: 'Invalid HF_API_TOKEN format' }
  }
  if (imageUrls.length === 0) {
    return { ...EMPTY_INSIGHTS, skippedReason: 'No images provided' }
  }

  const urls = imageUrls.slice(0, MAX_IMAGES_PER_AUDIT)
  console.info(`[hf-vision] Captioning ${urls.length} image(s) via BLIP…`)

  // Run requests concurrently; individual failures return null
  const rawResults = await Promise.all(urls.map(url => captionImageUrl(url, token)))
  const captions   = rawResults.filter((c): c is string => c !== null && c.length > 0)

  if (captions.length === 0) {
    return { ...EMPTY_INSIGHTS, skippedReason: 'All caption requests failed or timed out' }
  }

  console.info('[hf-vision] Captions received:', captions)

  const signals = parseInsights(captions)
  return {
    ...signals,
    rawCaptions:    captions,
    imagesAnalyzed: captions.length,
    confidence:     captions.length >= 3 ? 'high' : 'low',
  }
}
