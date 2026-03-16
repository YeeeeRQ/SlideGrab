import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Loader2,
  Settings2,
  ChevronDown,
  X,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useSceneDetection,
  type FrameData,
  type DetectionMethod,
  type DetectionSettings,
} from "@/hooks/useSceneDetection";

interface VideoPlayerProps {
  videoFile: File | null;
  onFramesExtracted: (frames: FrameData[]) => void;
  seekTime?: number | null;
  onSeekComplete?: () => void;
}

type ExtractMode = "manual" | "auto";

const METHOD_OPTIONS: {
  value: DetectionMethod;
  label: string;
  desc: string;
}[] = [
  {
    value: "histogram",
    label: "直方图法",
    desc: "检测变化像素比例，适合缓慢过渡",
  },
  {
    value: "frame-diff",
    label: "帧差分法",
    desc: "计算平均像素差异，适合快速切换",
  },
  {
    value: "dhash",
    label: "差异哈希法",
    desc: "基于图像指纹比对，检测精确",
  },
];

export function VideoPlayer({
  videoFile,
  onFramesExtracted,
  seekTime,
  onSeekComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [extractTime, setExtractTime] = useState<number | null>(null);
  const [mode, setMode] = useState<ExtractMode>("auto");
  const [jumpTime, setJumpTime] = useState("");

  const [settings, setSettings] = useState<DetectionSettings>({
    method: "histogram",
    threshold: 0.12,
    minInterval: 0.5,
    sampleInterval: 3,
    maxScreenshots: 256,
  });

  const {
    extractFrame,
    detectScenes,
    loadSettings,
    loadAlgorithmSettings,
    saveSettings,
  } = useSceneDetection();

  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
  }, [loadSettings]);

  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      onSeekComplete?.();
    }
  }, [seekTime, onSeekComplete]);

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const url = URL.createObjectURL(videoFile);
      videoRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const extractCurrentFrame = useCallback(async () => {
    if (!videoRef.current) return;

    const dataUrl = await extractFrame(videoRef.current, currentTime);
    const newFrame: FrameData = {
      id: `frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: currentTime,
      dataUrl,
      selected: true,
    };
    onFramesExtracted([newFrame]);
  }, [currentTime, extractFrame, onFramesExtracted]);

  const startAutoExtract = useCallback(async () => {
    if (!videoRef.current) return;

    const startTime = Date.now();
    setIsExtracting(true);
    setExtractProgress(0);
    setExtractTime(null);
    stopRef.current = false;

    if (videoRef.current.pause) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    saveSettings(settings);

    await detectScenes(
      videoRef.current,
      (progress) => {
        setExtractProgress(progress);
      },
      settings,
      (newFrame) => {
        onFramesExtracted([newFrame]);
      },
      () => stopRef.current,
    );

    setIsExtracting(false);
    setExtractTime(Date.now() - startTime);
  }, [detectScenes, onFramesExtracted, settings, saveSettings]);

  const updateSetting = <K extends keyof DetectionSettings>(
    key: K,
    value: DetectionSettings[K],
  ) => {
    if (key === "method") {
      const algoSettings = loadAlgorithmSettings(value as DetectionMethod)
      setSettings((prev) => ({
        ...prev,
        method: value as DetectionMethod,
        ...algoSettings,
      }))
    } else {
      setSettings((prev) => ({ ...prev, [key]: value }))
    }
  };

  const resetSettings = () => {
    const algoSettings = loadAlgorithmSettings(settings.method)
    setSettings({
      method: settings.method,
      ...algoSettings,
    })
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const parseTime = (timeStr: string): number | null => {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseFloat(parts[1]);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    return null;
  };

  const handleJumpByTime = () => {
    const time = parseTime(jumpTime);
    if (time !== null && videoRef.current) {
      videoRef.current.currentTime = Math.min(time, duration);
      setCurrentTime(videoRef.current.currentTime);
      setJumpTime("");
    }
  };

  if (!videoFile) return null;

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
        <Tabs value={mode} onValueChange={(v) => setMode(v as ExtractMode)} className="w-fit">
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <SkipForward className="w-4 h-4" />
              手动提取
            </TabsTrigger>
            <TabsTrigger value="auto" className="gap-2">
              <Zap className="w-4 h-4" />
              自动检测
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={togglePlay} variant="outline" size="icon">
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {mode === "manual" ? (
          <>
            <div className="flex items-center gap-2">
              <Button onClick={extractCurrentFrame} variant="outline">
                <SkipForward className="w-4 h-4 mr-2" />
                提取当前帧
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="时间如 01:30"
                  value={jumpTime}
                  onChange={(e) => setJumpTime(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJumpByTime()}
                  className="w-32 pl-8"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleJumpByTime}>
                跳转
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                className={showSettings ? "border-primary bg-accent" : ""}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                {isExtracting ? "检测中..." : "设置"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showSettings ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-background border rounded-lg shadow-lg z-10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">检测设置</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">检测算法</label>
                  <select
                    value={settings.method}
                    onChange={(e) =>
                      updateSetting("method", e.target.value as DetectionMethod)
                    }
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {
                      METHOD_OPTIONS.find(
                        (opt) => opt.value === settings.method,
                      )?.desc
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">阈值</label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.threshold * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={settings.threshold}
                    onChange={(e) =>
                      updateSetting("threshold", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">采样间隔(秒)</label>
                    <Input
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={settings.sampleInterval}
                      onChange={(e) =>
                        updateSetting(
                          "sampleInterval",
                          parseFloat(e.target.value) || 1,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">最小间隔(秒)</label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={settings.minInterval}
                      onChange={(e) =>
                        updateSetting(
                          "minInterval",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">最大截图数</label>
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={settings.maxScreenshots}
                    onChange={(e) =>
                      updateSetting(
                        "maxScreenshots",
                        parseInt(e.target.value) || 256,
                      )
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSettings}
                    className="flex-1"
                  >
                    重置默认
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      saveSettings(settings);
                      setShowSettings(false);
                    }}
                    className="flex-1"
                  >
                    保存并关闭
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Dialog>
            <Button onClick={startAutoExtract} disabled={isExtracting} className="gap-2">
              <Loader2
                className={`w-4 h-4 ${isExtracting ? "animate-spin" : ""}`}
              />
              {isExtracting ? "检测中..." : "开始检测"}
            </Button>

            {isExtracting && (
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <X className="w-4 h-4" />
                  停止
                </Button>
              </DialogTrigger>
            )}

            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认停止</DialogTitle>
                <DialogDescription>
                  确定要停止当前检测吗？已提取的帧将保留。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">
                    取消
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      stopRef.current = true;
                      setIsExtracting(false);
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                    }}
                  >
                    确认停止
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            {!isExtracting && extractTime !== null && (
              <span className="text-sm text-muted-foreground">
                (用时 {(extractTime / 1000).toFixed(1)}s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
