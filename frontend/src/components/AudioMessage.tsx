import { Play, Pause,  X, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";

interface AudioMessageProps {
  src: string;
  preview?: boolean;
  sending?: boolean;
  onSend?: () => void;
  onCancel?: () => void;
}

export default function AudioMessage({ src, preview, onSend, onCancel, sending }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    setCurrentTime(formatTime(audioRef.current.currentTime));
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setDuration(formatTime(audioRef.current!.duration));
      };
    }
  }, [src]);

  return (
    <div className={`flex flex-col gap-2 bg-white shadow-md border border-purple-200 rounded-2xl px-4 py-3 ${preview?"w-full":"w-full min-w-[280px] max-w-[450px]"}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>
        {/* <Volume2 size={18} className="text-gray-500" /> */}
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      </div>
      {preview && (
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm cursor-pointer bg-gray-300 rounded-md hover:bg-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
              <Button
                  onClick={onSend}
                  disabled={
                    !onSend || sending
                  }
                  size="icon"
                  className="h-12 w-16 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Send className="h-5 w-5" />
                </Button>
        </div>
      )}
    </div>
  );
}
