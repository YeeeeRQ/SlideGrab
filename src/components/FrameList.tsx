import { Trash2, Check, X } from "lucide-react"
import type { FrameData } from "@/hooks/useSceneDetection"
import { Button } from "@/components/ui/button"

interface FrameListProps {
  frames: FrameData[]
  onFramesChange: (frames: FrameData[]) => void
}

export function FrameList({ frames, onFramesChange }: FrameListProps) {
  const toggleFrame = (id: string) => {
    onFramesChange(
      frames.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    )
  }

  const deleteFrame = (id: string) => {
    onFramesChange(frames.filter((f) => f.id !== id))
  }

  const deleteUnselected = () => {
    onFramesChange(frames.filter((f) => f.selected))
  }

  const selectedCount = frames.filter((f) => f.selected).length

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const ms = Math.floor((time % 1) * 100)
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  if (frames.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>暂无提取的幻灯片</p>
        <p className="text-sm mt-1">请先上传视频并提取幻灯片</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          已提取 {frames.length} 张幻灯片，已选择 {selectedCount} 张
        </p>
        {selectedCount < frames.length && (
          <Button variant="ghost" size="sm" onClick={deleteUnselected}>
            <Trash2 className="w-4 h-4 mr-2" />
            删除未选择
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              frame.selected
                ? "border-primary"
                : "border-transparent opacity-60"
            }`}
          >
            <img
              src={frame.dataUrl}
              alt={`幻灯片 ${index + 1}`}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-white text-xs">
                  #{index + 1} {formatTime(frame.time)}
                </span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => toggleFrame(frame.id)}
                  className={`p-1.5 rounded-full ${
                    frame.selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/80 hover:bg-white"
                  }`}
                >
                  {frame.selected ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => deleteFrame(frame.id)}
                  className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {frame.selected && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">
                  {index + 1}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
