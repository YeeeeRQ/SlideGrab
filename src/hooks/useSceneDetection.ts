import { useCallback } from "react"

export interface FrameData {
  id: string
  time: number
  dataUrl: string
  selected: boolean
}

export type DetectionMethod = "frame-diff" | "histogram" | "dhash"

export interface DetectionOptions {
  method?: DetectionMethod
  threshold?: number
  minInterval?: number
  sampleInterval?: number
  maxScreenshots?: number
}

export interface DetectionSettings {
  method: DetectionMethod
  threshold: number
  minInterval: number
  sampleInterval: number
  maxScreenshots: number
}

export interface AlgorithmSettings {
  threshold: number
  minInterval: number
  sampleInterval: number
  maxScreenshots: number
}

const DEFAULT_ALGORITHM_SETTINGS: Record<DetectionMethod, AlgorithmSettings> = {
  histogram: { threshold: 0.15, minInterval: 0.5, sampleInterval: 3, maxScreenshots: 256 },
  "frame-diff": { threshold: 0.1, minInterval: 0.5, sampleInterval: 3, maxScreenshots: 256 },
  dhash: { threshold: 0.06, minInterval: 0.5, sampleInterval: 3, maxScreenshots: 256 },
}

const DEFAULT_SETTINGS: DetectionSettings = {
  method: "dhash",
  ...DEFAULT_ALGORITHM_SETTINGS["dhash"],
}

export function useSceneDetection() {
  const extractFrame = useCallback(
    async (
      video: HTMLVideoElement,
      time: number,
      width?: number
    ): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        const targetWidth = width || video.videoWidth
        const aspectRatio = video.videoWidth / video.videoHeight
        canvas.width = targetWidth
        canvas.height = targetWidth / aspectRatio

        video.currentTime = time
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL("image/jpeg", 0.95))
        }
      })
    },
    []
  )

  const loadSettings = useCallback((): DetectionSettings => {
    try {
      const saved = localStorage.getItem("detection-settings")
      if (saved) {
        const parsed = JSON.parse(saved)
        const method = (parsed.method as DetectionMethod) || "dhash"
        const methodSettings = parsed[method] || {}
        return {
          method,
          threshold: methodSettings.threshold ?? DEFAULT_ALGORITHM_SETTINGS[method].threshold,
          minInterval: methodSettings.minInterval ?? DEFAULT_ALGORITHM_SETTINGS[method].minInterval,
          sampleInterval: methodSettings.sampleInterval ?? DEFAULT_ALGORITHM_SETTINGS[method].sampleInterval,
          maxScreenshots: methodSettings.maxScreenshots ?? DEFAULT_ALGORITHM_SETTINGS[method].maxScreenshots,
        }
      }
    } catch (e) {
      console.error("Failed to load settings:", e)
    }
    return DEFAULT_SETTINGS
  }, [])

  const loadAlgorithmSettings = useCallback((method: DetectionMethod): AlgorithmSettings => {
    try {
      const saved = localStorage.getItem("detection-settings")
      if (saved) {
        const parsed = JSON.parse(saved)
        const methodSettings = parsed[method]
        if (methodSettings) {
          return {
            threshold: methodSettings.threshold ?? DEFAULT_ALGORITHM_SETTINGS[method].threshold,
            minInterval: methodSettings.minInterval ?? DEFAULT_ALGORITHM_SETTINGS[method].minInterval,
            sampleInterval: methodSettings.sampleInterval ?? DEFAULT_ALGORITHM_SETTINGS[method].sampleInterval,
            maxScreenshots: methodSettings.maxScreenshots ?? DEFAULT_ALGORITHM_SETTINGS[method].maxScreenshots,
          }
        }
      }
    } catch (e) {
      console.error("Failed to load algorithm settings:", e)
    }
    return DEFAULT_ALGORITHM_SETTINGS[method]
  }, [])

  const saveSettings = useCallback((settings: DetectionSettings) => {
    try {
      const existing = localStorage.getItem("detection-settings")
      const allSettings = existing ? JSON.parse(existing) : {}
      allSettings.method = settings.method
      allSettings[settings.method] = {
        threshold: settings.threshold,
        minInterval: settings.minInterval,
        sampleInterval: settings.sampleInterval,
        maxScreenshots: settings.maxScreenshots,
      }
      localStorage.setItem("detection-settings", JSON.stringify(allSettings))
    } catch (e) {
      console.error("Failed to save settings:", e)
    }
  }, [])

  const detectScenes = useCallback(
    async (
      video: HTMLVideoElement,
      onProgress?: (progress: number) => void,
      options: DetectionOptions = {},
      onNewFrame?: (frame: FrameData) => void,
      shouldStop?: () => boolean
    ): Promise<FrameData[]> => {
      const settings = { ...DEFAULT_SETTINGS, ...options }
      const {
        method,
        threshold = 0.12,
        minInterval = 0.5,
        sampleInterval = 3,
        maxScreenshots = 256,
      } = settings

      const duration = video.duration
      const frames: FrameData[] = []

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const width = video.videoWidth
      const aspectRatio = video.videoWidth / video.videoHeight
      canvas.width = width
      canvas.height = width / aspectRatio

      let prevImageData: ImageData | null = null
      let lastSceneTime = -minInterval

      const totalSamples = Math.ceil(duration / sampleInterval)
      let currentSample = 0

      return new Promise((resolve) => {
        const processFrame = (time: number) => {
          if (shouldStop?.()) {
            resolve(frames)
            return
          }

          if (time >= duration || frames.length >= maxScreenshots) {
            resolve(frames)
            return
          }

          video.currentTime = time
          currentSample++

          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            let isNewScene = false

            if (prevImageData && time - lastSceneTime >= minInterval) {
              let diff = 0

              if (method === "frame-diff") {
                diff = calculateFrameDifference(prevImageData, imageData)
              } else if (method === "histogram") {
                diff = calculateHistogramDifference(prevImageData, imageData)
              } else if (method === "dhash") {
                diff = calculateDHash(prevImageData, imageData)
              }

              if (diff > threshold) {
                isNewScene = true
                lastSceneTime = time
              }
            }

            if (!prevImageData || isNewScene) {
              const dataUrl = canvas.toDataURL("image/jpeg", 0.95)
              const newFrame: FrameData = {
                id: `frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                time,
                dataUrl,
                selected: true,
              }
              frames.push(newFrame)
              onNewFrame?.(newFrame)
            }

            prevImageData = imageData
            onProgress?.(currentSample / totalSamples)

            setTimeout(() => processFrame(time + sampleInterval), 0)
          }
        }

        processFrame(0)
      })
    },
    []
  )

  return {
    extractFrame,
    detectScenes,
    loadSettings,
    loadAlgorithmSettings,
    saveSettings,
    DEFAULT_SETTINGS,
  }
}

function calculateFrameDifference(img1: ImageData, img2: ImageData): number {
  const data1 = img1.data
  const data2 = img2.data
  let diff = 0

  for (let i = 0; i < data1.length; i += 4) {
    const r = Math.abs(data1[i] - data2[i])
    const g = Math.abs(data1[i + 1] - data2[i + 1])
    const b = Math.abs(data1[i + 2] - data2[i + 2])
    diff += (r + g + b) / 3
  }

  return diff / (img1.data.length / 4) / 255
}

function calculateHistogramDifference(img1: ImageData, img2: ImageData): number {
  const data1 = img1.data
  const data2 = img2.data
  const totalPixels = img1.width * img1.height
  const pixelThreshold = 30

  let changedPixels = 0

  for (let i = 0; i < data1.length; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i])
    const gDiff = Math.abs(data1[i + 1] - data2[i + 1])
    const bDiff = Math.abs(data1[i + 2] - data2[i + 2])
    const avgDiff = (rDiff + gDiff + bDiff) / 3

    if (avgDiff > pixelThreshold) {
      changedPixels++
    }
  }

  return changedPixels / totalPixels
}

function calculateDHash(img1: ImageData, img2: ImageData): number {
  const width = 9
  const height = 8
  
  const canvas1 = document.createElement("canvas")
  const canvas2 = document.createElement("canvas")
  canvas1.width = width
  canvas1.height = height
  canvas2.width = width
  canvas2.height = height
  
  const ctx1 = canvas1.getContext("2d")!
  const ctx2 = canvas2.getContext("2d")!
  
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = img1.width
  tempCanvas.height = img1.height
  const tempCtx = tempCanvas.getContext("2d")!
  
  tempCtx.putImageData(img1, 0, 0)
  ctx1.drawImage(tempCanvas, 0, 0, width, height)
  
  tempCtx.putImageData(img2, 0, 0)
  ctx2.drawImage(tempCanvas, 0, 0, width, height)
  
  const data1 = ctx1.getImageData(0, 0, width, height).data
  const data2 = ctx2.getImageData(0, 0, width, height).data
  
  let hash1 = 0
  let hash2 = 0
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const idxNext = (y * width + x + 1) * 4
      
      const gray = data1[idx] * 0.299 + data1[idx + 1] * 0.587 + data1[idx + 2] * 0.114
      const grayNext = data1[idxNext] * 0.299 + data1[idxNext + 1] * 0.587 + data1[idxNext + 2] * 0.114
      
      hash1 = hash1 << 1
      if (grayNext > gray) {
        hash1 |= 1
      }
      
      const gray2 = data2[idx] * 0.299 + data2[idx + 1] * 0.587 + data2[idx + 2] * 0.114
      const grayNext2 = data2[idxNext] * 0.299 + data2[idxNext + 1] * 0.587 + data2[idxNext + 2] * 0.114
      
      hash2 = hash2 << 1
      if (grayNext2 > gray2) {
        hash2 |= 1
      }
    }
  }
  
  const xor = hash1 ^ hash2
  let hammingDistance = 0
  let tempXor = xor
  while (tempXor > 0) {
    if (tempXor & 1) {
      hammingDistance++
    }
    tempXor = tempXor >> 1
  }
  
  return hammingDistance / 64
}
