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
    <div className="h-screen bg-background overflow-hidden">
      <header className="border-b bg-card h-12 flex-shrink-0">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">视频PPT提取器</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto h-[calc(100vh-48px)]">
        {!videoFile ? (
          <div className="max-w-xl mx-auto py-12 px-4">
            <section>
              <h2 className="text-lg font-semibold mb-4">上传视频</h2>
              <VideoUploader onVideoSelect={handleVideoSelect} />
            </section>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="flex-1 p-6 space-y-6 border-r">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">视频</h2>
                  <button
                    onClick={handleReset}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    更换视频
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium truncate">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-4">提取幻灯片</h2>
                <VideoPlayer
                  videoFile={videoFile}
                  onFramesExtracted={handleFramesExtracted}
                />
              </section>
            </div>

            <div className="w-[600px] flex flex-col bg-card">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  幻灯片管理
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({frames.length}张)
                  </span>
                </h2>
                <ExportPanel frames={frames} />
              </div>
              <div className="flex-1 overflow-hidden">
                <FrameList frames={frames} onFramesChange={handleFramesChange} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
