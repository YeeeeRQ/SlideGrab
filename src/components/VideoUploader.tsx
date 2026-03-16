import { useCallback, useState } from "react"
import { Upload, FileVideo } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void
}

export function VideoUploader({ onVideoSelect }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("video/")) {
        onVideoSelect(file)
      }
    },
    [onVideoSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onVideoSelect(file)
      }
    },
    [onVideoSelect]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        id="video-upload"
      />
      <label
        htmlFor="video-upload"
        className="flex flex-col items-center gap-4 cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          {isDragging ? (
            <FileVideo className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragging ? "释放以上传视频" : "点击或拖拽上传视频"}
          </p>
          <p className="text-sm text-muted-foreground">
            支持 MP4, WebM, MOV 格式
          </p>
        </div>
      </label>
    </div>
  )
}
