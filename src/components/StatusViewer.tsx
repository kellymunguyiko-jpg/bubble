import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Heart, MessageCircle, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Post, Comment } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Status {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  timestamp: any;
  authorId: string;
}

interface StatusViewerProps {
  statuses: Post[];
  author: {
    displayName: string;
    photoURL: string;
  };
  onClose: () => void;
}

export const StatusViewer = ({ statuses, author, onClose }: StatusViewerProps) => {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  
  const currentStatus = statuses[index];

  // Fetch comments for current status
  useEffect(() => {
    if (!currentStatus?.id) return;
    
    const q = query(
      collection(db, 'posts', currentStatus.id, 'comments'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    
    return unsubscribe;
  }, [currentStatus?.id]);

  useEffect(() => {
    if (isPaused || showComments || currentStatus?.mediaType === 'video') return;
    
    setProgress(0);
    const duration = 5000; // 5 seconds per status
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (index < statuses.length - 1) {
            setIndex(index + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [index, statuses.length, onClose]);

  const next = () => {
    if (index < statuses.length - 1) {
      setIndex(index + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setProgress(0);
    }
  };

  const handleVideoEnd = () => {
    setProgress(100);
    setTimeout(() => {
      if (index < statuses.length - 1) {
        setIndex(index + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }, 300);
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentStatus) return;
    
    const postRef = doc(db, 'posts', currentStatus.id);
    const isLiked = currentStatus.likes?.includes(user.uid);
    
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !currentStatus) return;
    
    try {
      const postRef = doc(db, 'posts', currentStatus.id);
      await addDoc(collection(postRef, 'comments'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        text: newComment.trim(),
        timestamp: serverTimestamp()
      });
      
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });
      
      setNewComment('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[500px] h-full lg:h-[90vh] lg:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
          {statuses.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-white"
                 initial={{ width: 0 }}
                 animate={{ 
                   width: i === index ? `${progress}%` : i < index ? '100%' : '0%' 
                 }}
                 transition={{ duration: 0.1, ease: 'linear' }}
               />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={author.photoURL} />
              <AvatarFallback>{author.displayName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm drop-shadow-md">{author.displayName}</span>
              <span className="text-white/60 text-xs drop-shadow-md">
                {currentStatus.timestamp?.toDate ? format(currentStatus.timestamp.toDate(), 'HH:mm') : 'Just now'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStatus.mediaType === 'video' && (
               <button 
                onClick={() => setMuted(!muted)}
                className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
               >
                 {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
               </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex items-center justify-center bg-black">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStatus.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex items-center justify-center"
            >
              {currentStatus.mediaType === 'image' ? (
                <img 
                  src={currentStatus.mediaUrl} 
                  alt="Status" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={currentStatus.mediaUrl} 
                  className="max-w-full max-h-full"
                  autoPlay
                  muted={muted}
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnd}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Tap Zones */}
          <div className="absolute inset-0 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={prev} />
            <div className="w-2/3 h-full cursor-pointer" onClick={next} />
          </div>

          <div className="absolute inset-y-0 left-4 flex items-center lg:-left-16">
             <button onClick={prev} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hidden lg:block hover:bg-white/20">
               <ChevronLeft className="h-8 w-8" />
             </button>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center lg:-right-16">
             <button onClick={next} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hidden lg:block hover:bg-white/20">
               <ChevronRight className="h-8 w-8" />
             </button>
          </div>
        </div>

        {/* Caption */}
        {currentStatus.caption && (
          <div className="absolute bottom-24 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/40 to-transparent text-center z-40">
            <p className="text-white text-lg font-medium drop-shadow-lg leading-relaxed">
              {currentStatus.caption}
            </p>
          </div>
        )}

        {/* Interaction Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`p-3 rounded-full backdrop-blur-md transition-all ${currentStatus.likes?.includes(user?.uid || '') ? 'bg-rose-500 scale-110' : 'bg-white/10 hover:bg-white/20'}`}>
                <Heart className={`h-6 w-6 ${currentStatus.likes?.includes(user?.uid || '') ? 'fill-white text-white' : 'text-white'}`} />
              </div>
              <span className="text-white text-[10px] font-bold drop-shadow-md">{currentStatus.likes?.length || 0}</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); setIsPaused(!showComments); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-[10px] font-bold drop-shadow-md">{currentStatus.commentsCount || 0}</span>
            </button>
          </div>
        </div>

        {/* Comments Panel */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 top-1/2 bg-zinc-900 z-[60] rounded-t-3xl border-t border-white/10 flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <h3 className="text-white font-bold">Comments</h3>
                <button onClick={() => { setShowComments(false); setIsPaused(false); }} className="text-white/60 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={comment.authorPhoto} />
                          <AvatarFallback>{comment.authorName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-xs">{comment.authorName}</span>
                            <span className="text-white/40 text-[10px]">
                              {comment.timestamp?.toDate ? format(comment.timestamp.toDate(), 'HH:mm') : 'now'}
                            </span>
                          </div>
                          <p className="text-white/90 text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <MessageCircle className="h-10 w-10 text-white/10 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">No comments yet. Be the first!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/10">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input 
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-brand-green"
                  />
                  <Button type="submit" className="bg-brand-green hover:bg-brand-green/90 text-white font-bold">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
