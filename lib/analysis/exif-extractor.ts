/**
 * Client-side EXIF metadata extractor.
 * Extracts GPS coordinates and capture timestamp from image files.
 * Requires: npm install exifr
 */

export interface ExifData {
  lat?: number
  lon?: number
  capturedAt?: Date
  hasGPS: boolean
}

/**
 * Extract GPS + timestamp from a single image file.
 * Dynamic import avoids SSR issues in Next.js app router.
 */
export async function extractExif(file: File): Promise<ExifData> {
  if (!file.type.startsWith('image/')) return { hasGPS: false }
  try {
    // Dynamic import keeps exifr out of the server bundle
    const exifr = await import('exifr')
    const data = await exifr.parse(file, {
      gps: true,
      tiff: true,
      pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'CreateDate'],
    })
    if (!data) return { hasGPS: false }

    const lat: number | undefined = data.latitude
    const lon: number | undefined = data.longitude
    const capturedAt: Date | undefined = data.DateTimeOriginal ?? data.CreateDate

    return { lat, lon, capturedAt, hasGPS: lat != null && lon != null }
  } catch {
    return { hasGPS: false }
  }
}

/**
 * Try each image file in order until GPS is found.
 * Returns the first hit — phone photos almost always have GPS.
 */
export async function extractGPSFromFiles(files: File[]): Promise<ExifData> {
  for (const file of files) {
    const exif = await extractExif(file)
    if (exif.hasGPS) return exif
  }
  return { hasGPS: false }
}
