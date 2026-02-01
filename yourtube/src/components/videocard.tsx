"use clinet";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";

const videos = "/video/vdo.mp4";
export default function VideoCard({ video }: any) {
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-2 sm:space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
          <video
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/${video?.filepath}`}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white sm:bottom-2 sm:right-2">
            10:24
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
