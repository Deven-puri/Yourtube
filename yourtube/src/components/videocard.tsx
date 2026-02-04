"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useEffect, useRef, useState } from "react";

const videos = "/video/vdo.mp4";
export default function VideoCard({ video }: any) {
  const videoUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/video/stream/${video?._id}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>("0:00");

  useEffect(() => {
    // If duration is stored in database, use it
    if (video?.duration) {
      setDuration(formatDuration(video.duration));
    }
  }, [video]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && !video?.duration) {
      const durationInSeconds = Math.floor(videoRef.current.duration);
      setDuration(formatDuration(durationInSeconds));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-2 sm:space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
          <video
            ref={videoRef}
            src={videoUrl}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />
          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white sm:bottom-2 sm:right-2">
            {duration}
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9">
            <AvatarFallback>{video?.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-medium group-hover:text-blue-600 sm:text-base">
              {video?.videotitle}
            </h3>
            <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">{video?.videochanel}</p>
            <p className="text-xs text-gray-600 sm:text-sm">
              {video?.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
