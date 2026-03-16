import { useState } from "react"
import { VideoUploader } from "./components/VideoUploader"
import { VideoPlayer } from "./components/VideoPlayer"
import { FrameList } from "./components/FrameList"
import { ExportPanel } from "./components/ExportPanel"
import type { FrameData } from "./hooks/useSceneDetection"

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [frames, setFrames] = useState<FrameData[]>([])

  const handleVideoSelect = (file: File) => {
    setVideoFile(file)
    setFrames([])
  }

  const handleFramesExtracted = (newFrames: FrameData[]) => {
    setFrames((prev) => [...prev, ...newFrames])
  }

  const handleFramesChange = (newFrames: FrameData[]) => {
    setFrames(newFrames)
  }

  const handleReset = () => {
    setVideoFile(null)
    setFrames([])
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold">视频PPT提取器</h1>
          <p className="text-muted-foreground mt-1">
            从视频中提取PPT幻灯片，导出为图片
          </p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">1. 上传视频</h2>
          {!videoFile ? (
            <VideoUploader onVideoSelect={handleVideoSelect} />
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{videoFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                更换视频
              </button>
            </div>
          )}
        </section>

        {videoFile && (
          <>
            <section>
              <h2 className="text-lg font-semibold mb-4">2. 提取幻灯片</h2>
              <VideoPlayer
                videoFile={videoFile}
                onFramesExtracted={handleFramesExtracted}
              />
            </section>

            {frames.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">
                  3. 管理幻灯片 ({frames.length}张)
                </h2>
                <FrameList frames={frames} onFramesChange={handleFramesChange} />
              </section>
            )}

            <section>
              <ExportPanel frames={frames} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
