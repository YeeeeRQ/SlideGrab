import { useCallback } from "react"

export interface FrameData {
  id: string
  time: number
  dataUrl: string
  selected: boolean
}

export type DetectionMethod = "frame-diff" | "histogram" | "sampling"

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

const DEFAULT_SETTINGS: DetectionSettings = {
  method: "histogram",
  threshold: 0.12,
  minInterval: 0.5,
  sampleInterval: 3,
  maxScreenshots: 256,
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
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error("Failed to load settings:", e)
    }
    return DEFAULT_SETTINGS
  }, [])

  const saveSettings = useCallback((settings: DetectionSettings) => {
    try {
      localStorage.setItem("detection-settings", JSON.stringify(settings))
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
              } else if (method === "sampling") {
                diff = 1
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
