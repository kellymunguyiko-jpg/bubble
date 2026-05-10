import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Volume2, 
  VolumeX,
  Play,
  ArrowLeft,
  Youtube
} from 'lucide-react';
import { YouTubeVideo } from '@/services/youtubeService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShortsFeedProps {
  videos: YouTubeVideo[];
  onClose?: () => void;
  initialIndex?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onShare?: (video: YouTubeVideo) => void;
}

export const ShortsFeed = ({ videos, onClose, initialIndex = 0, onLoadMore, isLoadingMore, onShare }: ShortsFeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videos.length === 0 && !isLoadingMore) {
       setHasError(true);
    } else {
       setHasError(false);
    }
  }, [videos, isLoadingMore]);

  useEffect(() => {
    if (!onLoadMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        onLoadMore();
      }
    }, { 
      threshold: 0,
      rootMargin: '600px'
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [onLoadMore, isLoadingMore]);

  // Handle Active Video Detection on Scroll
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      threshold: 0.7, // Video must be 70% visible to play
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const videoId = entry.target.getAttribute('data-video-id');
          if (videoId) setActiveVideoId(videoId);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    const videoElements = containerRef.current?.querySelectorAll('.short-item');
    videoElements?.forEach((el) => observer.observe(el));

    return () => {
      videoElements?.forEach((el) => observer.unobserve(el));
    };
  }, [videos]);

  useEffect(() => {
    if (containerRef.current && initialIndex > 0) {
      containerRef.current.scrollTo({
        top: containerRef.current.clientHeight * initialIndex,
        behavior: 'instant'
      });
      // Set initial active video
      if (videos[initialIndex]) {
        setActiveVideoId(videos[initialIndex].id);
      }
    } else if (videos.length > 0 && !activeVideoId) {
      setActiveVideoId(videos[0].id);
    }
  }, [initialIndex, videos]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Header Overlays */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 rounded-full"
              onClick={onClose}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-600" />
            <h2 className="text-white font-bold text-lg">Shorts</h2>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.length > 0 ? (
          videos.map((video) => (
            <div 
              key={video.id} 
              data-video-id={video.id}
              className="short-item relative h-full w-full snap-start snap-always flex items-center justify-center bg-black"
            >
              {/* The Video Layer */}
              <div className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-[#111] overflow-hidden">
                {activeVideoId === video.id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=0&controls=0&loop=1&playlist=${video.id}&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`}
                    className="absolute inset-0 w-full h-full"
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-zinc-900 flex items-center justify-center">
                    <img 
                      src={video.thumbnail} 
                      className="w-full h-full object-cover blur-sm opacity-50"
                      alt="thumbnail"
                    />
                    <Play className="h-12 w-12 text-white/20" />
                  </div>
                )}
                
                {/* Top Progress Bar (Simulated) */}
                <div className="absolute top-1 left-2 right-2 z-30 flex gap-1 h-0.5">
                  <div className="h-full bg-white/40 flex-1 rounded-full overflow-hidden">
                     <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="h-full bg-white shadow-[0_0_8px_white]" 
                     />
                  </div>
                </div>
                
                {/* Interaction Overlay - Left Side (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-xl">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.id}`} />
                        <AvatarFallback>YT</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm drop-shadow-md">@youtube_shorts</span>
                        <Button size="sm" className="h-7 px-3 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-full mt-1">
                          Follow
                        </Button>
                      </div>
                    </div>
                    <p className="text-white text-sm line-clamp-2 leading-relaxed font-medium drop-shadow-md">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center italic font-serif">♫</div>
                      <span className="truncate">Original audio • {video.title}</span>
                    </div>
                  </div>
                </div>

                {/* Action Bar Overlay - Right Side */}
                <div className="absolute right-0 bottom-24 p-4 z-10 flex flex-col items-center gap-6">
                  <div className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all active:scale-90 cursor-pointer shadow-lg hover:shadow-red-500/20">
                      <Heart className="h-7 w-7 group-hover:fill-current" />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">Likes</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-lg">
                      <MessageCircle className="h-7 w-7" />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">Comments</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 group">
                    <div 
                      className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-lg"
                      onClick={() => onShare?.(video)}
                    >
                      <Share2 className="h-7 w-7" />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">Share</span>
                  </div>

                  <div className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-lg">
                    <MoreVertical className="h-7 w-7" />
                  </div>

                  {/* Rotating Profile Icon (Simulated Music Disc) */}
                  <motion.div 
                    className="w-10 h-10 rounded-full border-4 border-zinc-800 overflow-hidden shadow-2xl mt-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${video.id}`} className="w-full h-full object-cover" alt="disc" />
                  </motion.div>
                </div>
              </div>
            </div>
          ))
        ) : hasError ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center">
             <p className="text-lg font-bold mb-2">No videos available</p>
             <p className="text-sm text-white/50">This could be due to API limits. Please check your settings.</p>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white">
            <div className="spinner" />
          </div>
        )}
        <div ref={sentinelRef} className="h-40 w-full flex items-center justify-center bg-black">
          {isLoadingMore && <div className="spinner scale-50" />}
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
