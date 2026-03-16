import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause, SkipForward, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSceneDetection } from "@/hooks/useSceneDetection"
import type { FrameData } from "@/hooks/useSceneDetection"

interface VideoPlayerProps {
  videoFile: File | null
  onFramesExtracted: (frames: FrameData[]) => void
}

export function VideoPlayer({ videoFile, onFramesExtracted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState(0)

  const { extractFrame, detectScenes } = useSceneDetection()

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const url = URL.createObjectURL(videoFile)
      videoRef.current.src = url
      return () => URL.revokeObjectURL(url)
    }
  }, [videoFile])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const extractCurrentFrame = useCallback(async () => {
    if (!videoRef.current) return

    const dataUrl = await extractFrame(videoRef.current, currentTime)
    const newFrame: FrameData = {
      id: `frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: currentTime,
      dataUrl,
      selected: true,
    }
    onFramesExtracted([newFrame])
  }, [currentTime, extractFrame, onFramesExtracted])

  const startAutoExtract = useCallback(async () => {
    if (!videoRef.current) return

    setIsExtracting(true)
    setExtractProgress(0)

    if (videoRef.current.pause) {
      videoRef.current.pause()
      setIsPlaying(false)
    }

    const frames = await detectScenes(videoRef.current, (progress) => {
      setExtractProgress(progress)
    })

    setIsExtracting(false)
    onFramesExtracted(frames)
  }, [detectScenes, onFramesExtracted])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (!videoFile) return null

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full max-h-[400px]"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        {isExtracting && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
              <p className="text-white">
                正在检测场景切换... {Math.round(extractProgress * 100)}%
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={togglePlay} variant="outline" size="icon">
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        <Button onClick={extractCurrentFrame} variant="outline">
          <SkipForward className="w-4 h-4 mr-2" />
          提取当前帧
        </Button>

        <Button onClick={startAutoExtract} disabled={isExtracting}>
          <Loader2 className="w-4 h-4 mr-2" />
          {isExtracting ? "检测中..." : "自动检测幻灯片"}
        </Button>
      </div>
    </div>
  )
}
