import { useCallback } from "react"

export interface FrameData {
  id: string
  time: number
  dataUrl: string
  selected: boolean
}

interface SceneDetectionOptions {
  threshold?: number
  minInterval?: number
}

export function useSceneDetection() {
  const extractFrame = useCallback(
    async (
      video: HTMLVideoElement,
      time: number,
      width: number = 1920
    ): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        const aspectRatio = video.videoWidth / video.videoHeight
        canvas.width = width
        canvas.height = width / aspectRatio

        video.currentTime = time
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL("image/jpeg", 0.9))
        }
      })
    },
    []
  )

  const detectScenes = useCallback(
    async (
      video: HTMLVideoElement,
      onProgress?: (progress: number) => void,
      options: SceneDetectionOptions = {}
    ): Promise<FrameData[]> => {
      const { threshold = 0.3, minInterval = 0.5 } = options

      const duration = video.duration
      const frames: FrameData[] = []
      const sampleInterval = 0.5

      let prevImageData: ImageData | null = null
      let lastSceneTime = -minInterval

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const width = 320
      const aspectRatio = video.videoWidth / video.videoHeight
      canvas.width = width
      canvas.height = width / aspectRatio

      const totalSamples = Math.ceil(duration / sampleInterval)
      let currentSample = 0

      return new Promise((resolve) => {
        const processFrame = (time: number) => {
          if (time >= duration) {
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
              const diff = calculateFrameDifference(prevImageData, imageData)
              if (diff > threshold) {
                isNewScene = true
                lastSceneTime = time
              }
            }

            if (!prevImageData || isNewScene) {
              const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
              frames.push({
                id: `frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                time,
                dataUrl,
                selected: true,
              })
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

  return { extractFrame, detectScenes }
}

function calculateFrameDifference(
  img1: ImageData,
  img2: ImageData
): number {
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
