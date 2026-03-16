import { useState } from "react"
import { Download, Loader2, FileImage, FileArchive } from "lucide-react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FrameData } from "@/hooks/useSceneDetection"

interface ExportPanelProps {
  frames: FrameData[]
}

type ExportFormat = "png" | "jpg"
type ExportMode = "zip" | "single"

export function ExportPanel({ frames }: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("png")
  const [mode, setMode] = useState<ExportMode>("zip")

  const selectedFrames = frames.filter((f) => f.selected)

  const handleExport = async () => {
    if (selectedFrames.length === 0) return

    setIsExporting(true)

    try {
      if (mode === "zip") {
        const zip = new JSZip()

        for (let i = 0; i < selectedFrames.length; i++) {
          const frame = selectedFrames[i]
          const data = frame.dataUrl.split(",")[1]
          const ext = format === "png" ? "png" : "jpg"
          const fileName = `slide-${(i + 1).toString().padStart(3, "0")}.${ext}`
          zip.file(fileName, data, { base64: true })
        }

        const content = await zip.generateAsync({ type: "blob" })
        saveAs(content, `slides-${Date.now()}.zip`)
      } else {
        for (let i = 0; i < selectedFrames.length; i++) {
          const frame = selectedFrames[i]
          const ext = format === "png" ? "png" : "jpg"
          const fileName = `slide-${(i + 1).toString().padStart(3, "0")}.${ext}`
          
          const link = document.createElement("a")
          link.href = frame.dataUrl
          link.download = fileName
          link.click()
          
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} disabled={selectedFrames.length === 0}>
        <Download className="w-4 h-4 mr-2" />
        导出 ({selectedFrames.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出设置</DialogTitle>
            <DialogDescription>
              已选择 {selectedFrames.length} 张图片
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">图片格式</label>
              <div className="flex gap-2">
                <Button
                  variant={format === "png" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("png")}
                  className="flex-1"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  variant={format === "jpg" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("jpg")}
                  className="flex-1"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  JPG
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">导出方式</label>
              <div className="flex gap-2">
                <Button
                  variant={mode === "zip" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("zip")}
                  className="flex-1"
                >
                  <FileArchive className="w-4 h-4 mr-2" />
                  ZIP
                </Button>
                <Button
                  variant={mode === "single" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("single")}
                  className="flex-1"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  逐个
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedFrames.length === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出 {selectedFrames.length} 张
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
