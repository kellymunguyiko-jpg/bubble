import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Video as VideoIcon, X, Loader2, Send } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UiverseLoader } from './UiverseLoader';

interface PostCreationFormProps {
  onSuccess: () => void;
}

export const PostCreationForm = ({ onSuccess }: PostCreationFormProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 1 minute limit for video
      if (selectedFile.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 61) { // buffer
            toast.error('Videos must be under 1 minute');
            return;
          }
          setFile(selectedFile);
          setPreview(URL.createObjectURL(selectedFile));
        };
        video.src = URL.createObjectURL(selectedFile);
      } else {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleCreatePost = async () => {
    if (!user || !file) return;

    setLoading(true);
    try {
      const uploadRes = await uploadToCloudinary(file);
      
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        caption,
        mediaUrl: uploadRes.secure_url,
        mediaType: file.type.startsWith('image/') ? 'image' : 'video',
        timestamp: serverTimestamp(),
        likes: [],
        commentsCount: 0
      });

      toast.success('Post created successfully!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 bg-[#111b21] p-6 rounded-3xl border border-white/5 shadow-2xl">
      <div 
        className="relative aspect-square md:aspect-video rounded-3xl border-2 border-dashed border-[#00a884]/30 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group overflow-hidden shadow-inner"
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        {preview ? (
          <>
            {file?.type.startsWith('image/') ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
            ) : (
              <video src={preview} className="w-full h-full object-cover" controls />
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors shadow-lg backdrop-blur-md"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground group-hover:text-[#00a884] transition-colors">
            <div className="flex gap-6">
              <div className="p-4 rounded-full bg-[#00a884]/10 group-hover:bg-[#00a884]/20 transition-all">
                <ImageIcon className="h-10 w-10" />
              </div>
              <div className="p-4 rounded-full bg-[#00a884]/10 group-hover:bg-[#00a884]/20 transition-all">
                <VideoIcon className="h-10 w-10" />
              </div>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">Tap to share media</p>
            <p className="text-[10px] opacity-60 uppercase tracking-tighter">Support images & videos under 1m</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleFileChange} 
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-widest text-[#00a884]">Add a Caption</Label>
        <Textarea 
          placeholder="Say something amazing..." 
          className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl focus:ring-[#00a884]/50 focus:border-[#00a884] resize-none text-lg font-medium placeholder:text-white/20"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <Button 
        className="w-full h-14 rounded-2xl bg-[#00a884] text-white hover:bg-[#06cf9c] font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-[#00a884]/20 disabled:opacity-50 transform active:scale-95 transition-all"
        disabled={loading || !file}
        onClick={handleCreatePost}
      >
        {loading ? (
          <UiverseLoader />
        ) : (
          <>
            Share Post <Send className="ml-3 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
};
