// Minimal type stub for exifr — full types available after npm install
declare module 'exifr' {
  interface ParseOptions {
    gps?: boolean
    tiff?: boolean
    pick?: string[]
  }
  interface ParseResult {
    latitude?: number
    longitude?: number
    DateTimeOriginal?: Date
    CreateDate?: Date
    [key: string]: unknown
  }
  export function parse(file: File | Blob | ArrayBuffer | string, options?: ParseOptions): Promise<ParseResult | null>
}
