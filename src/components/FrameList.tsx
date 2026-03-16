import { useState, useMemo } from "react"
import { Trash2, Check, ZoomIn, ZoomOut, RotateCcw, CheckSquare, Square, FlipHorizontal, ArrowUpDown, Grid, List } from "lucide-react"
import type { FrameData } from "@/hooks/useSceneDetection"
import { Button } from "@/components/ui/button"

interface FrameListProps {
  frames: FrameData[]
  onFramesChange: (frames: FrameData[]) => void
}

type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

interface FrameItemProps {
  frame: FrameData
  index: number
  getDisplayIndex: (id: string) => number
  formatTime: (time: number) => string
  toggleFrame: (id: string) => void
  deleteFrame: (id: string) => void
  openPreview: (index: number) => void
  viewMode: ViewMode
}

function FrameItem({
  frame,
  index,
  getDisplayIndex,
  formatTime,
  toggleFrame,
  deleteFrame,
  openPreview,
  viewMode,
}: FrameItemProps) {
  const displayIndex = getDisplayIndex(frame.id)

  if (viewMode === "grid") {
    return (
      <div
        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
          frame.selected
            ? "border-primary ring-2 ring-primary/20"
            : "border-transparent hover:border-muted-foreground/20"
        }`}
        onClick={() => openPreview(index)}
      >
        <img
          src={frame.dataUrl}
          alt={`幻灯片 ${displayIndex}`}
          className="w-full aspect-video object-cover"
        />
        {frame.selected && (
          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded bg-primary flex items-center justify-center z-10 pointer-events-none">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
            <span className="text-white text-xs font-medium">
              #{displayIndex}
            </span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFrame(frame.id)
                }}
                className={`p-1 rounded-full ${
                  frame.selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/80 hover:bg-white"
                }`}
              >
                {frame.selected ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Square className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFrame(frame.id)
                }}
                className="p-1 rounded-full bg-destructive/80 text-white hover:bg-destructive"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-1.5 right-1.5 text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
          {formatTime(frame.time)}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-10 gap-2 px-2 py-1.5 items-center rounded-md border transition-all ${
        frame.selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      }`}
    >
      <div className="col-span-1 flex items-center gap-1">
        <span className="text-sm">{displayIndex}</span>
      </div>
      <div className="col-span-3">
        <img
          src={frame.dataUrl}
          alt={`幻灯片 ${displayIndex}`}
          className="w-16 h-10 object-cover rounded cursor-pointer"
          onClick={() => openPreview(index)}
        />
      </div>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{formatTime(frame.time)}</span>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1">
        <button
          onClick={() => toggleFrame(frame.id)}
          className={`p-1.5 rounded-full ${
            frame.selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
          title={frame.selected ? "取消选择" : "选择"}
        >
          {frame.selected ? (
            <Check className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => deleteFrame(frame.id)}
          className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function FrameList({ frames, onFramesChange }: FrameListProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const toggleFrame = (id: string) => {
    onFramesChange(
      frames.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    )
  }

  const selectAll = () => {
    onFramesChange(frames.map((f) => ({ ...f, selected: true })))
  }

  const deselectAll = () => {
    onFramesChange(frames.map((f) => ({ ...f, selected: false })))
  }

  const invertSelection = () => {
    onFramesChange(frames.map((f) => ({ ...f, selected: !f.selected })))
  }

  const deleteFrame = (id: string) => {
    onFramesChange(frames.filter((f) => f.id !== id))
  }

  const deleteUnselected = () => {
    onFramesChange(frames.filter((f) => f.selected))
  }

  const selectedCount = frames.filter((f) => f.selected).length

  const sortedFrames = useMemo(() => {
    const sorted = [...frames].sort((a, b) => a.time - b.time)
    return sortOrder === "asc" ? sorted : sorted.reverse()
  }, [frames, sortOrder])

  const getDisplayIndex = (frameId: string) => {
    const originalIndex = frames.findIndex(f => f.id === frameId)
    return originalIndex + 1
  }

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
    if (previewIndex !== null && previewIndex < sortedFrames.length - 1) {
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.1, 5))
    } else {
      setScale((s) => Math.max(s - 0.1, 0.25))
    }
  }

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
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-medium">暂无幻灯片</p>
        <p className="text-sm mt-1">点击上方"自动检测"提取幻灯片</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            title="全选"
            className="h-8"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deselectAll}
            title="取消全选"
            className="h-8"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={invertSelection}
            title="反选"
            className="h-8"
          >
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            title={sortOrder === "asc" ? "正序" : "倒序"}
            className="h-8"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            title="网格视图"
            className="h-8"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            title="列表视图"
            className="h-8"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{frames.length}
          </span>
          {selectedCount < frames.length && selectedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={deleteUnselected} className="h-8 text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3">
            {sortedFrames.map((frame, index) => (
              <FrameItem
                key={frame.id}
                frame={frame}
                index={index}
                getDisplayIndex={getDisplayIndex}
                formatTime={formatTime}
                toggleFrame={toggleFrame}
                deleteFrame={deleteFrame}
                openPreview={openPreview}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-10 gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-1">#</div>
              <div className="col-span-3">缩略图</div>
              <div className="col-span-4">时间</div>
              <div className="col-span-2 text-right">操作</div>
            </div>
            {sortedFrames.map((frame, index) => (
              <FrameItem
                key={frame.id}
                frame={frame}
                index={index}
                getDisplayIndex={getDisplayIndex}
                formatTime={formatTime}
                toggleFrame={toggleFrame}
                deleteFrame={deleteFrame}
                openPreview={openPreview}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={closePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/50">
            <div className="text-white">
              <span className="font-medium">{previewIndex + 1} / {sortedFrames.length}</span>
              <span className="ml-4 text-white/70">{formatTime(sortedFrames[previewIndex].time)}</span>
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
                <ZoomIn className="w-5 h-5" />
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

            {previewIndex < sortedFrames.length - 1 && (
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
                src={sortedFrames[previewIndex].dataUrl}
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
    </div>
  )
}
