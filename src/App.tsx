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
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold">视频PPT提取器</h1>
          <p className="text-muted-foreground mt-1">
            从视频中提取PPT幻灯片，导出为图片
          </p>
        </div>
      </header>

      <main className="container mx-auto">
        {!videoFile ? (
          <div className="max-w-xl mx-auto py-12 px-4">
            <section>
              <h2 className="text-lg font-semibold mb-4">上传视频</h2>
              <VideoUploader onVideoSelect={handleVideoSelect} />
            </section>
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-100px)]">
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

              <section>
                <ExportPanel frames={frames} />
              </section>
            </div>

            <div className="w-[600px] flex flex-col bg-card">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">
                  幻灯片管理
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({frames.length}张)
                  </span>
                </h2>
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
