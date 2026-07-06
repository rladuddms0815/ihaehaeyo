declare module 'tesseract.js' {
  interface LoggerMessage {
    status: string
    progress?: number
  }

  interface BBox {
    x0: number
    y0: number
    x1: number
    y1: number
  }

  interface TesseractWord {
    text: string
    confidence: number
    bbox: BBox
  }

  interface TesseractData {
    text: string
    confidence: number
    words: TesseractWord[]
  }

  interface TesseractResult {
    data: TesseractData
  }

  interface RecognizeOptions {
    logger?: (message: LoggerMessage) => void
  }

  export function recognize(
    image: string | HTMLImageElement | HTMLCanvasElement | Blob,
    lang?: string | string[],
    options?: RecognizeOptions
  ): Promise<TesseractResult>
}
