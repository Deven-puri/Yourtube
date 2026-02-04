"use client";

import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import axios from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { Crown, Clock, SkipForward, SkipBack } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath?: string;
  };
  relatedVideos?: Array<{
    _id: string;
    videotitle: string;
  }>;
  onOpenComments?: () => void;
}

export default function VideoPlayer({ video, relatedVideos = [], onOpenComments }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [watchTimeStatus, setWatchTimeStatus] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gesture control states
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapZone, setTapZone] = useState<'left' | 'center' | 'right' | null>(null);
  const [showSkipAnimation, setShowSkipAnimation] = useState<'forward' | 'backward' | null>(null);

  useEffect(() => {
    if (user) {
      checkWatchTimeLimit();
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
    };
  }, [user]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Determine zone (left 30%, center 40%, right 30%)
    let zone: 'left' | 'center' | 'right';
    if (clickX < width * 0.3) {
      zone = 'left';
    } else if (clickX > width * 0.7) {
      zone = 'right';
    } else {
      zone = 'center';
    }

    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime;

    // Reset if different zone or too much time has passed
    if (zone !== tapZone || timeSinceLastTap > 500) {
      setTapCount(1);
      setTapZone(zone);
      setLastTapTime(currentTime);

      // Clear existing timeout
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }

      // Set timeout to execute single tap action if no more taps come
      const timeout = setTimeout(() => {
        executeTapAction(1, zone);
        setTapCount(0);
        setTapZone(null);
      }, 300);
      setTapTimeout(timeout);
    } else {
      // Same zone, increment tap count
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);
      setLastTapTime(currentTime);

      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }

      if (newTapCount === 2) {
        // Execute double tap
        const timeout = setTimeout(() => {
          executeTapAction(2, zone);
          setTapCount(0);
          setTapZone(null);
        }, 300);
        setTapTimeout(timeout);
      } else if (newTapCount === 3) {
        // Execute triple tap immediately
        if (tapTimeout) {
          clearTimeout(tapTimeout);
        }
        executeTapAction(3, zone);
        setTapCount(0);
        setTapZone(null);
      }
    }
  };

  const executeTapAction = (taps: number, zone: 'left' | 'center' | 'right') => {
    if (!videoRef.current) return;

    if (taps === 1 && zone === 'center') {
      // Single tap center: Pause/Play
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else if (taps === 2 && zone === 'left') {
      // Double tap left: Skip backward 10 seconds
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      showSkipAnimationFeedback('backward');
    } else if (taps === 2 && zone === 'right') {
      // Double tap right: Skip forward 10 seconds
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
      showSkipAnimationFeedback('forward');
    } else if (taps === 3 && zone === 'center') {
      // Triple tap center: Skip to next video
      skipToNextVideo();
    } else if (taps === 3 && zone === 'right') {
      // Triple tap right: Close website
      window.close();
      // If window.close() doesn't work (some browsers block it), navigate to home
      setTimeout(() => router.push('/'), 100);
    } else if (taps === 3 && zone === 'left') {
      // Triple tap left: Open comments
      if (onOpenComments) {
        onOpenComments();
      } else {
        // Fallback: scroll to comments
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const showSkipAnimationFeedback = (direction: 'forward' | 'backward') => {
    setShowSkipAnimation(direction);
    setTimeout(() => setShowSkipAnimation(null), 500);
  };

  const skipToNextVideo = () => {
    if (relatedVideos && relatedVideos.length > 0) {
      const nextVideo = relatedVideos[0];
      router.push(`/watch/${nextVideo._id}`);
    }
  };

  const checkWatchTimeLimit = async () => {
    try {
      const response = await axios.get(`/premium/watch-time/${user._id}`);
      setWatchTimeStatus(response.data);
      
      if (!response.data.canWatch) {
        setShowLimitModal(true);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    } catch (error) {
      console.error('Error checking watch time:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !user || !watchTimeStatus) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    setWatchedSeconds(currentTime);

    // Check if limit reached (for non-unlimited plans)
    if (watchTimeStatus.watchTimeLimit !== -1) {
      const totalWatched = watchTimeStatus.totalWatchedTime + currentTime;
      
      if (totalWatched >= watchTimeStatus.watchTimeLimit) {
        videoRef.current.pause();
        setShowLimitModal(true);
      }
    }
  };

  const handlePlay = () => {
    if (!user) return;

    // Start tracking watch time
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        try {
          await axios.post(`/premium/watch-time/${user._id}`, {
            watchedSeconds: 10 // Update every 10 seconds
          });
        } catch (error) {
          console.error('Error updating watch time:', error);
        }
      }
    }, 10000); // Update every 10 seconds
  };

  const handlePause = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="aspect-video bg-black rounded-lg overflow-hidden relative cursor-pointer select-none"
        onClick={handleTap}
      >
        {/* Skip Animation Overlay */}
        {showSkipAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-black bg-opacity-60 rounded-full p-6 animate-pulse">
              {showSkipAnimation === 'forward' ? (
                <div className="flex items-center gap-2 text-white">
                  <SkipForward size={48} />
                  <span className="text-2xl font-bold">+10s</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <span className="text-2xl font-bold">-10s</span>
                  <SkipBack size={48} />
                </div>
              )}
            </div>
          </div>
        )}

        {watchTimeStatus && watchTimeStatus.watchTimeLimit !== -1 && (
          <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-70 px-4 py-2 rounded-lg flex items-center gap-2 text-white">
            <Clock size={16} />
            <span className="text-sm">
              {formatTime(watchTimeStatus.remainingTime)} left today
            </span>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          poster={`/placeholder.svg?height=480&width=854`}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
        >
          <source
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/video/stream/${video?._id}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Watch Time Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Watch Time Limit Reached
            </h2>
            <p className="text-gray-600 mb-4">
              You've reached your daily {formatTime(watchTimeStatus?.watchTimeLimit || 0)} watch limit for the{' '}
              <strong>{watchTimeStatus?.planType || 'Free'}</strong> plan.
            </p>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6">
              <Crown className="w-12 h-12 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-semibold text-gray-800">
                Upgrade to watch more!
              </p>
              <ul className="text-xs text-gray-700 mt-2 space-y-1">
                <li>Bronze: 7 minutes/day - ₹10</li>
                <li>Silver: 10 minutes/day - ₹50</li>
                <li>Gold: Unlimited - ₹100</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/premium')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  router.push('/');
                }}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Browse Other Videos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
