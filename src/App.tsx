import { useState } from "react"
import { VideoUploader } from "./components/VideoUploader"
import { VideoPlayer } from "./components/VideoPlayer"
import { FrameList } from "./components/FrameList"
import { ExportPanel } from "./components/ExportPanel"
import { Button } from "./components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog"
import type { FrameData } from "./hooks/useSceneDetection"

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [frames, setFrames] = useState<FrameData[]>([])
  const [showChangeVideoDialog, setShowChangeVideoDialog] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)

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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("video/")) {
        if (videoFile) {
          setPendingVideoFile(file)
          setShowChangeVideoDialog(true)
        } else {
          handleVideoSelect(file)
        }
      }
    }
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

      <main 
        className="container mx-auto h-[calc(100vh-48px)] relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center">
            <div className="bg-background px-6 py-4 rounded-lg shadow-lg">
              <p className="text-lg font-medium">释放以替换视频</p>
            </div>
          </div>
        )}
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
              <section className="min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">视频</h2>
                  <button
                    onClick={() => setShowChangeVideoDialog(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    更换视频
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={videoFile.name}>
                      {videoFile.name}
                    </p>
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

      <Dialog open={showChangeVideoDialog} onOpenChange={setShowChangeVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认更换视频</DialogTitle>
            <DialogDescription>
              更换视频将清除当前已提取的所有幻灯片，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowChangeVideoDialog(false)
              setPendingVideoFile(null)
            }}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (pendingVideoFile) {
                  handleVideoSelect(pendingVideoFile)
                } else {
                  handleReset()
                }
                setShowChangeVideoDialog(false)
                setPendingVideoFile(null)
              }}
            >
              确认更换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
