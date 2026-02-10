import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Music, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

interface NodeAudioPlayerProps {
  audioUrl: string;
  nodeId: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export const NodeAudioPlayer = ({
  audioUrl,
  nodeId,
  autoPlay = true,
  loop = true,
}: NodeAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("lc-audio-volume");
    return saved ? parseFloat(saved) : 0.4;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("lc-audio-muted") === "true";
  });
  const [showControls, setShowControls] = useState(false);

  // Create / swap audio element when URL or nodeId changes
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.loop = loop;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    if (autoPlay && !isMuted) {
      audio.play().catch(() => {
        // Autoplay blocked by browser — user must interact first
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, nodeId]);

  // Sync volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem("lc-audio-volume", String(volume));
    localStorage.setItem("lc-audio-muted", String(isMuted));
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Expand toggle */}
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full h-10 w-10 shadow-lg"
        onClick={() => setShowControls((s) => !s)}
      >
        <Music className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-12 right-0 bg-card border rounded-xl shadow-xl p-3 w-52 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Ambiance</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={([v]) => {
                setVolume(v / 100);
                if (v > 0 && isMuted) setIsMuted(false);
              }}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground text-center">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
