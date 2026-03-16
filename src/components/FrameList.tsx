import { useState, useCallback } from "react"
import { Trash2, Check, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { FrameData } from "@/hooks/useSceneDetection"
import { Button } from "@/components/ui/button"

interface FrameListProps {
  frames: FrameData[]
  onFramesChange: (frames: FrameData[]) => void
}

export function FrameList({ frames, onFramesChange }: FrameListProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

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

  const openPreview = (index: number) => {
    setPreviewIndex(index)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const closePreview = () => {
    setPreviewIndex(null)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const goToPrev = () => {
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const goToNext = () => {
    if (previewIndex !== null && previewIndex < frames.length - 1) {
      setPreviewIndex(previewIndex + 1)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 5))
  }

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.25))
  }

  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.1, 5))
    } else {
      setScale((s) => Math.max(s - 0.1, 0.25))
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
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
    <>
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
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                frame.selected
                  ? "border-primary"
                  : "border-transparent opacity-60"
              }`}
              onClick={() => openPreview(index)}
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
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
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

      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={closePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/50">
            <div className="text-white">
              <span className="font-medium">{previewIndex + 1} / {frames.length}</span>
              <span className="ml-4 text-white/70">{formatTime(frames[previewIndex].time)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut() }}
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn() }}
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleResetZoom() }}
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="重置"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-2" />
              <button
                onClick={closePreview}
                className="p-2 text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {previewIndex > 0 && (
              <button
                className="absolute left-4 p-2 text-white/70 hover:bg-white/20 rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {previewIndex < frames.length - 1 && (
              <button
                className="absolute right-4 p-2 text-white/70 hover:bg-white/20 rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                src={frames[previewIndex].dataUrl}
                alt={`幻灯片 ${previewIndex + 1}`}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  maxHeight: 'calc(100vh - 120px)',
                }}
                className="object-contain select-none"
                draggable={false}
              />
            </div>
          </div>

          <div className="p-2 bg-black/50 text-center text-white/50 text-xs">
            滚轮缩放 · {scale > 1 ? '拖拽移动' : '点击查看'}
          </div>
        </div>
      )}
    </>
  )
}
