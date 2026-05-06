import { Play, Video } from "lucide-react";

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/;

export const extractYouTubeId = (url: string): string | null => {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
};

interface VideoPreviewProps {
  url: string;
  className?: string;
}

const VideoPreview = ({ url, className = "" }: VideoPreviewProps) => {
  if (!url.trim()) return null;

  const ytId = extractYouTubeId(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2 rounded-lg overflow-hidden border border-border bg-secondary/50 hover:border-primary/40 transition-all ${className}`}
    >
      {ytId ? (
        <div className="relative w-[100px] h-[56px] flex-shrink-0">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="Video preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      ) : (
        <div className="w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-lg">
          <Video className="w-4 h-4 text-primary" />
        </div>
      )}
      <span className="text-[10px] text-muted-foreground truncate pr-2 flex-1 min-w-0">
        {ytId ? "Assistir vídeo" : url.length > 40 ? url.slice(0, 40) + "…" : url}
      </span>
    </a>
  );
};

export default VideoPreview;
