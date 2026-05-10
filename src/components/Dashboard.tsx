import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from './ThemeToggle';
import React, { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  limit,
  Timestamp,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { UserData, ChatData, Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Send, 
  Paperclip, 
  LogOut, 
  Plus,
  Users,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Trash2,
  Mic,
  Square,
  Volume2,
  User,
  Bell,
  BellOff,
  Settings,
  Pencil,
  Download,
  Maximize2,
  Play,
  Share2,
  Youtube,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  Info,
  CheckCheck
} from 'lucide-react';
import { fetchTrendingShorts, fetchVideoMetadata, YouTubeVideo } from '@/services/youtubeService';
import YouTube from 'react-youtube';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import HamsterLoader from './HamsterLoader';
import CatLoader from './CatLoader';
import { SettingsDialog } from './SettingsDialog';
import { CloudLoader } from './CloudLoader';
import { CreationDialog } from './CreationDialog';
import { UiverseLoader } from './UiverseLoader';
import { ShortsFeed } from './ShortsFeed';
import { StatusViewer } from './StatusViewer';
import { FullAdminPage } from './FullAdminPage';
import { generateAIResponse } from '@/services/aiService';
import { UserSearch } from './UserSearch';
import { Sparkles, Bot, Ghost, Instagram } from 'lucide-react';
import { CircleDot } from 'lucide-react';

// Background Music Component
const BackgroundMusic = ({ playing, force }: { playing: boolean; force: number }) => {
  if (!playing) return null;
  
  const opts = {
    height: '10',
    width: '10',
    playerVars: {
      autoplay: 1,
      loop: 1,
      playlist: 'fGloYC4kV8A',
      mute: 0,
      controls: 0,
      modestbranding: 1,
      enablejsapi: 1,
    },
  };

  return (
    <div className="fixed bottom-0 right-0 z-[-1] pointer-events-none opacity-0 overflow-hidden w-[10px] h-[10px]">
      <YouTube 
        key={force} 
        videoId="fGloYC4kV8A" 
        opts={opts} 
        onReady={(event) => {
          event.target.playVideo();
          event.target.unMute();
          event.target.setVolume(100);
        }}
        onEnd={(event) => {
          event.target.playVideo(); // Loop backup
        }}
      />
    </div>
  );
};

// Simple visualizer for the credits page
const AudioVisualizer = () => (
  <div className="flex gap-1 items-end h-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        animate={{ height: ["20%", "100%", "20%"] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
        className="w-1 bg-brand-green rounded-full shadow-[0_0_8px_rgba(0,168,132,0.5)]"
      />
    ))}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Add recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeCreationType, setActiveCreationType] = useState<'post' | 'group' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'group' | 'status' | 'about'>('chats');
  const [selectedShortIndex, setSelectedShortIndex] = useState<number | null>(null);
  const [sharingVideo, setSharingVideo] = useState<YouTubeVideo | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [musicGestureTrigger, setMusicGestureTrigger] = useState(0);
  const [musicActive, setMusicActive] = useState(false);
  const [aboutMusicInfo, setAboutMusicInfo] = useState<YouTubeVideo | null>(null);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const AI_USER: UserData = {
    uid: 'kellyseekclone-ai-bot',
    displayName: 'Bubble AI',
    email: 'ai@kellyseekclone.tech',
    photoURL: 'https://images.unsplash.com/photo-1675249141982-64523f78833a?q=80&w=200&h=200&auto=format&fit=crop',
    status: 'online',
    about: 'I am Bubble AI, your next-gen intelligence assistant. Visit kellyseekai.netlify.app for more results. Ask me anything!',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp()
  };

  // Fetch background music info using API
  useEffect(() => {
    if (activeTab === 'about' && !aboutMusicInfo) {
      fetchVideoMetadata('fGloYC4kV8A').then(info => {
        if (info) setAboutMusicInfo(info);
      });
    }
  }, [activeTab, aboutMusicInfo]);
  const [chatSortOrder, setChatSortOrder] = useState<'desc' | 'asc'>('desc');
  const [youtubePageToken, setYoutubePageToken] = useState<string | null>(null);
  
  const messageCounts = React.useMemo(() => messages.reduce((acc, msg) => {
    acc[msg.senderId] = (acc[msg.senderId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [messages]);

  const [loadingMoreShorts, setLoadingMoreShorts] = useState(false);
  const [viewingStatus, setViewingStatus] = useState<{ author: UserData; statuses: any[] } | null>(null);
  const [showFullAdmin, setShowFullAdmin] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shortsGridSentinelRef = useRef<HTMLDivElement>(null);

  const handleCloseStatus = React.useCallback(() => {
    setViewingStatus(null);
  }, []);

  // Infinite scroll for shorts grid in sidebar
  useEffect(() => {
    if (activeTab !== 'status') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMoreShorts) {
        // If we have a page token, use it. If not, it means the last stream ended,
        // so we start a new one with a fresh random search.
        loadYoutubeData(youtubePageToken || undefined);
      }
    }, { 
      threshold: 0.1,
      rootMargin: '400px'
    });

    if (shortsGridSentinelRef.current) {
      observer.observe(shortsGridSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, youtubePageToken, loadingMoreShorts]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleOpenAdmin = () => {
      setShowFullAdmin(true);
      setSettingsOpen(false);
    };
    window.addEventListener('open-full-admin', handleOpenAdmin);
    return () => window.removeEventListener('open-full-admin', handleOpenAdmin);
  }, []);

  // Presence logic
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Set to online
    setDoc(userRef, { 
      status: 'online', 
      lastSeen: serverTimestamp() 
    }, { merge: true });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDoc(userRef, { status: 'offline', lastSeen: serverTimestamp() });
      } else {
        updateDoc(userRef, { status: 'online', lastSeen: serverTimestamp() });
      }
    };

    const handleBeforeUnload = () => {
      updateDoc(userRef, { status: 'offline', lastSeen: serverTimestamp() });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateDoc(userRef, { status: 'offline', lastSeen: serverTimestamp() });
    };
  }, [user]);

  // Fetch chats with real-time participant details
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatData[];

      // Sort client-side
      chatsData.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds * 1000 || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });

      setChats(chatsData);
      setLoadingChats(false);
    });

    return unsubscribe;
  }, [user]);

  // Real-time participant details listener
  const [participantInfo, setParticipantInfo] = useState<Record<string, UserData>>({});
  useEffect(() => {
    if (!user || chats.length === 0) return;

    // Collect all participant IDs we need to track
    const participantIds = new Set<string>();
    chats.forEach(chat => {
      chat.participants.forEach(pid => {
        if (pid !== user.uid) participantIds.add(pid);
      });
    });

    if (participantIds.size === 0) return;

    // Create listeners for each unique participant
    const unsubscribes = Array.from(participantIds).map(pid => {
      return onSnapshot(doc(db, 'users', pid), (docSnap) => {
        if (docSnap.exists()) {
          setParticipantInfo(prev => ({
            ...prev,
            [pid]: docSnap.data() as UserData
          }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, chats]);

  // Fetch all users for new chat - Real-time for status updates
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData)).filter(u => u.uid !== user.uid));
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch status updates (posts)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user]);

  // Fetch YouTube Trending Shorts
  const loadYoutubeData = async (pageToken?: string) => {
    if (loadingMoreShorts) return;
    if (pageToken) setLoadingMoreShorts(true);
    
    // Choose a contextual keyword for variety
    const keywords = ['shorts', 'funny', 'lifestyle', 'viral', 'satisfying', 'gaming', 'tech', 'cooking'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    const result = await fetchTrendingShorts(pageToken, pageToken ? 'shorts' : randomKeyword);
    
    if (pageToken) {
      setYoutubeVideos(prev => {
        const combined = [...prev, ...result.videos];
        // Filter out duplicates by ID
        const unique = combined.filter((video, index, self) => 
          index === self.findIndex((t) => t.id === video.id)
        );
        return unique;
      });
      setLoadingMoreShorts(false);
    } else {
      // Ensure initial load is also unique
      const unique = result.videos.filter((video, index, self) => 
        index === self.findIndex((t) => t.id === video.id)
      );
      setYoutubeVideos(unique);
    }
    setYoutubePageToken(result.nextPageToken);
  };

  useEffect(() => {
    loadYoutubeData();
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const q = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]);
      setLoadingMessages(false);
    });

    return unsubscribe;
  }, [selectedChat]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChat || !user) return;
    try {
      await deleteDoc(doc(db, 'chats', selectedChat.id, 'messages', messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleToggleMute = async (chatId: string) => {
    if (!user) return;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const isMuted = chat.mutedBy?.includes(user.uid);
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        mutedBy: isMuted ? arrayRemove(user.uid) : arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });
      toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
    } catch (error) {
      toast.error('Failed to update notification settings');
    }
  };

  const handleTyping = async (chatId: string) => {
    if (!user) return;
    
    // Update typing status in Firestore
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`typing.${user.uid}`]: serverTimestamp()
    });

    // Clear existing timeout
    if (typingTimeoutRef.current[chatId]) {
      clearTimeout(typingTimeoutRef.current[chatId]);
    }

    // Set timeout to clear typing status after 3 seconds
    typingTimeoutRef.current[chatId] = setTimeout(async () => {
      await updateDoc(chatRef, {
        [`typing.${user.uid}`]: null
      });
    }, 3000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    const text = newMessage;
    setNewMessage('');
    
    // Check if it's the AI chat
    const isAIChat = selectedChat.id === 'ai-chat' || selectedChat.participants.includes(AI_USER.uid);
    
    // Clear typing indicator immediately on send
    if (selectedChat) {
      if (typingTimeoutRef.current[selectedChat.id]) {
        clearTimeout(typingTimeoutRef.current[selectedChat.id]);
      }
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        [`typing.${user.uid}`]: null
      });
    }

    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await addDoc(collection(chatRef, 'messages'), {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      await updateDoc(chatRef, {
        lastMessage: {
          text,
          senderId: user.uid,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Handle AI Response
      if (isAIChat) {
        setAiLoading(true);
        // Get last 10 messages for context
        const history = messages.slice(-10).map(m => ({
          role: m.senderId === AI_USER.uid ? 'model' : 'user' as 'model' | 'user',
          text: m.text
        }));

        const aiResponse = await generateAIResponse(text, history);
        
        await addDoc(collection(chatRef, 'messages'), {
          text: aiResponse,
          senderId: AI_USER.uid,
          timestamp: serverTimestamp(),
        });

        await updateDoc(chatRef, {
          lastMessage: {
            text: aiResponse,
            senderId: AI_USER.uid,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
        setAiLoading(false);
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !user) return;

    // Video duration check (2 mins)
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 120) {
          toast.error('Video must be shorter than 2 minutes');
          setUploading(false);
          return;
        }
        await processFileUpload(file);
      };
      video.src = URL.createObjectURL(file);
      return;
    }

    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {
    if (!selectedChat || !user) return;
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file);
      const chatRef = doc(db, 'chats', selectedChat.id);
      
      const mediaType = res.resource_type === 'video' ? 'video' : 'image';
      
      await addDoc(collection(chatRef, 'messages'), {
        text: `Shared a ${mediaType}`,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        mediaUrl: res.secure_url,
        mediaType: mediaType
      });

      await updateDoc(chatRef, {
        lastMessage: {
          text: `Sent a ${mediaType}`,
          senderId: user.uid,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      toast.success('Media uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

  // Listen to current user data real-time
  useEffect(() => {
    if (!user) {
      setCurrentUserData(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserData;
        setCurrentUserData(data);
      }
    });
    return unsubscribe;
  }, [user]);

  // Sync initial profile values
  useEffect(() => {
    if (currentUserData) {
      setNewDisplayName(currentUserData.displayName || '');
      setNewAbout(currentUserData.about || 'Hey there! I am using WhatsApp');
    }
  }, [currentUserData?.uid]); // Only sync when UID changes (initial load)

  const handleProfileUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const res = await uploadToCloudinary(file);
      await setDoc(doc(db, 'users', user.uid), {
        photoURL: res.secure_url,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Failed to update profile image');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdateAll = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName.trim() || user.displayName,
        about: newAbout.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Profile updated!');
      setProfileOpen(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        // Derive extension from mimeType
        const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
        await handleVoiceUpload(audioBlob, extension);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const handleVoiceUpload = async (blob: Blob, extension: string = 'webm') => {
    if (!selectedChat || !user) return;

    const fileName = `voicerecord-${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type });
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file);
      const chatRef = doc(db, 'chats', selectedChat.id);
      
      await addDoc(collection(chatRef, 'messages'), {
        text: 'Voice note',
        senderId: user.uid,
        timestamp: serverTimestamp(),
        mediaUrl: res.secure_url,
        mediaType: 'voice'
      });

      await updateDoc(chatRef, {
        lastMessage: {
          text: '🎤 Voice note',
          senderId: user.uid,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      toast.success('Voice note sent!');
    } catch (error) {
      toast.error('Failed to send voice note');
    } finally {
      setUploading(false);
    }
  };

  const downloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error('Failed to download media');
    }
  };

  const handleShareToUser = async (targetUser: UserData) => {
    if (!user || !sharingVideo) return;
    
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${sharingVideo.id}`;
      const shareMessage = `Hey, check out this short: ${videoUrl}`;
      
      // 1. Find or Create chat
      let targetChatId = "";
      const existingChat = chats.find(c => 
        c.participants.length === 2 && 
        c.participants.includes(targetUser.uid) && 
        c.participants.includes(user.uid)
      );
      
      if (existingChat) {
        targetChatId = existingChat.id;
      } else {
        const chatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, targetUser.uid],
          participantDetails: {
            [user.uid]: {
              displayName: user.displayName || 'Me',
              photoURL: user.photoURL || ''
            },
            [targetUser.uid]: {
              displayName: targetUser.displayName,
              photoURL: targetUser.photoURL
            }
          },
          updatedAt: serverTimestamp(),
          isGroup: false,
          typing: {}
        });
        targetChatId = chatRef.id;
      }
      
      // 2. Send the link
      await addDoc(collection(db, `chats/${targetChatId}/messages`), {
        text: shareMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'chats', targetChatId), {
        lastMessage: shareMessage,
        updatedAt: serverTimestamp(),
      });
      
      toast.success(`Shared with ${targetUser.displayName}`);
      setShareDialogOpen(false);
      setSharingVideo(null);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share video');
    }
  };

  const openAIChat = async () => {
    if (!user) return;
    const existingAIChat = chats.find(c => c.participants.includes(AI_USER.uid));
    
    if (existingAIChat) {
      setSelectedChat(existingAIChat);
      return;
    }

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, AI_USER.uid],
        participantDetails: {
          [user.uid]: {
            displayName: currentUserData?.displayName || user.displayName || 'Me',
            photoURL: currentUserData?.photoURL || user.photoURL || ''
          },
          [AI_USER.uid]: {
            displayName: AI_USER.displayName,
            photoURL: AI_USER.photoURL,
            about: AI_USER.about
          }
        },
        updatedAt: serverTimestamp(),
        isGroup: false,
        typing: {}
      });

      // Initial message from AI
      await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
        text: "Hello! I am Bubble AI. How can I help you today? Visit kellyseekai.netlify.app for advanced features.",
        senderId: AI_USER.uid,
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chatRef.id), {
        lastMessage: {
          text: "Hello! I am Bubble AI. Visit kellyseekai.netlify.app...",
          senderId: AI_USER.uid,
          timestamp: serverTimestamp(),
        },
      });

      toast.success('Bubble AI initialized');
    } catch (error) {
      console.error("AI Init error:", error);
      toast.error('Failed to start AI chat');
    }
  };

  const startNewChat = async (otherUser: UserData) => {
    if (!user) return;

    // Check if chat already exists (strict check for 1-on-1 chats)
    const existingChat = chats.find(c => 
      c.participants.length === 2 && 
      c.participants.includes(otherUser.uid) && 
      c.participants.includes(user.uid)
    );
    
    if (existingChat) {
      setSelectedChat(existingChat);
      setSearchOpen(false);
      return;
    }

    try {
      const participants = [user.uid, otherUser.uid];
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants,
        participantDetails: {
          [user.uid]: {
            displayName: currentUserData?.displayName || user.displayName || 'Me',
            photoURL: currentUserData?.photoURL || user.photoURL || ''
          },
          [otherUser.uid]: {
            displayName: otherUser.displayName || 'User',
            photoURL: otherUser.photoURL || ''
          }
        },
        updatedAt: serverTimestamp(),
        isGroup: false,
        typing: {}
      });
      
      setSelectedChat({
        id: chatRef.id,
        participants,
        updatedAt: Timestamp.now(),
        participantDetails: { 
          [user.uid]: { displayName: currentUserData?.displayName || user.displayName || 'Me', photoURL: currentUserData?.photoURL || user.photoURL || '' },
          [otherUser.uid]: otherUser 
        }
      });
      setSearchOpen(false);
    } catch (error) {
      console.error('Chat creation error:', error);
      toast.error('Failed to create chat. Please try again.');
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastSeen: serverTimestamp()
        }, { merge: true });
      }
      await signOut(auth);
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getOtherUser = (chat: ChatData) => {
    if (!user) return null;
    const otherId = chat.participants.find(p => p !== user.uid);
    if (!otherId) return null;
    // Prefer real-time participant info, fallback to chat's snapshot details, then basic placeholder
    return participantInfo[otherId] || chat.participantDetails?.[otherId] || { uid: otherId, displayName: 'User', photoURL: '' };
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    // Check for YouTube link specifically
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const isShorts = text.includes('/shorts/');
    const foundYoutubeId = text.match(youtubeRegex)?.[1];

    return (
      <div className="flex flex-col gap-2">
        <div className="text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (part && part.match(urlRegex)) {
              return (
                <a 
                  key={`link-${i}`} 
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline break-all"
                >
                  {part}
                </a>
              );
            }
            return <span key={`text-${i}`}>{part}</span>;
          })}
        </div>
        
        {foundYoutubeId && (
          <div 
            className={cn(
              "mt-1 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer hover:bg-black/10 transition-all group shadow-md",
              isShorts ? "w-[240px]" : "w-full"
            )}
            onClick={() => {
              const baseEmbed = `https://www.youtube.com/embed/${foundYoutubeId}?autoplay=1`;
              setPreviewUrl(isShorts ? `${baseEmbed}&rel=0` : baseEmbed);
              setPreviewType('video');
            }}
          >
            <div className={cn(
              "relative",
              isShorts ? "aspect-[9/16]" : "aspect-video"
            )}>
              <img 
                src={`https://img.youtube.com/vi/${foundYoutubeId}/${isShorts ? 'maxresdefault' : 'mqdefault'}.jpg`}
                alt="Youtube Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if maxres is not available
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${foundYoutubeId}/0.jpg`;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 fill-current ml-1" />
                </div>
              </div>
              {isShorts && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[10px] text-white flex items-center gap-1 font-bold">
                  <Youtube className="h-3 w-3 text-red-500" />
                  SHORTS
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                  {isShorts ? 'View Vertical' : 'Watch in app'}
                </span>
              </div>
              <Maximize2 className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] dark:bg-[#111b21] overflow-hidden p-0 lg:p-0">
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] md:flex md:items-center md:justify-center p-0 md:p-10 pointer-events-none">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
              onClick={() => setSearchOpen(false)}
            />
            <div className="w-full h-full md:h-auto md:max-w-md pointer-events-auto flex items-center justify-center">
              <UserSearch 
                users={allUsers} 
                onClose={() => setSearchOpen(false)}
                onSelectAI={() => {
                  openAIChat();
                  setSearchOpen(false);
                }}
                onSelectUser={(u) => {
                  startNewChat(u);
                  setSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex h-full w-full mx-auto bg-[#ffffff] dark:bg-[#111b21] overflow-hidden rounded-none relative">
        
        <div className={cn(
          "w-20 bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#3b4a54] flex-col items-center py-6 gap-6 z-20 transition-all duration-300",
          selectedChat ? "hidden lg:flex" : "flex"
        )}>
           <motion.div 
             whileHover={{ rotate: 15, scale: 1.1 }}
             className="h-12 w-12 bg-brand-green rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-green/20"
           >
             B
           </motion.div>
           
           <div className="flex flex-col gap-2 w-full px-2">
             <div 
               onClick={() => { setActiveTab('chats'); setSelectedChat(null); }}
               className={cn(
                 "p-3 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-1", 
                 activeTab === 'chats' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-text-sub hover:bg-chat-surface dark:hover:bg-white/5"
               )}
               title="Chats"
             >
              <MessageSquare className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Chats</span>
             </div>

             <div 
               onClick={() => setSearchOpen(true)}
               className={cn(
                 "p-3 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-1 text-text-sub hover:bg-chat-surface dark:hover:bg-white/5"
               )}
               title="Search Users"
             >
              <Search className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Search</span>
             </div>

             <div 
               onClick={() => { setActiveTab('status'); setSelectedChat(null); }}
               className={cn(
                 "p-3 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-1", 
                 activeTab === 'status' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-text-sub hover:bg-chat-surface dark:hover:bg-white/5"
               )}
               title="Moments"
             >
              <CircleDot className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Moments</span>
             </div>
             
             <div 
               onClick={() => { setActiveTab('group'); setSelectedChat(null); }}
               className={cn(
                 "p-3 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-1", 
                 activeTab === 'group' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-text-sub hover:bg-chat-surface dark:hover:bg-white/5"
               )}
               title="Groups"
             >
              <Users className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Groups</span>
             </div>
           </div>

           <div className="mt-auto flex flex-col gap-4 w-full px-2">
             <div 
               onClick={openAIChat}
               className="p-3 rounded-2xl bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all cursor-pointer flex flex-col items-center gap-1"
               title="Bubble AI"
             >
               <Sparkles className="h-6 w-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">Bubble</span>
             </div>

             <button 
               className={cn(
                 "p-3 rounded-2xl transition-all flex flex-col items-center gap-1", 
                 activeTab === 'about' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-text-sub hover:bg-chat-surface dark:hover:bg-white/5"
               )}
               onClick={() => { setActiveTab('about'); setSelectedChat(null); }}
               title="Info"
             >
               <Info className="h-6 w-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">Help</span>
             </button>

             <button 
               className="p-3 text-text-sub hover:bg-chat-surface dark:hover:bg-white/5 rounded-2xl transition-colors flex flex-col items-center gap-1"
               onClick={() => setSettingsOpen(true)}
             >
               <Settings className="h-6 w-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">Settings</span>
             </button>
           </div>
        </div>

        <CreationDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Existing Chat List Sidebar */}
        <div className={cn(
          "w-full lg:w-[400px] bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#3b4a54] flex-col shrink-0 z-10 transition-all duration-300",
          selectedChat ? "hidden lg:flex" : "flex"
        )}>
          {/* Sidebar Header */}
          <div className="h-16 px-4 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#3b4a54]">
            <input 
              type="file" 
              ref={profileInputRef} 
              onChange={handleProfileUpdate} 
              className="hidden" 
              accept="image/*"
            />
            <button 
              onClick={() => profileInputRef.current?.click()}
              className="relative group cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to update profile image"
            >
              <Avatar className="h-10 w-10 border-2 border-brand-green/20">
                <AvatarImage src={currentUserData?.photoURL || user?.photoURL || ''} />
                <AvatarFallback>{currentUserData?.displayName?.charAt(0) || user?.displayName?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
            
            <div className="flex items-center gap-2">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="rounded-full text-brand-green bg-brand-green/10 hover:bg-brand-green hover:text-white transition-all shadow-inner"
                 onClick={openAIChat}
                 title="Talk to Bubble AI"
               >
                 <Bot className="h-5 w-5" />
               </Button>

               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="rounded-full text-text-sub hover:bg-chat-surface"
                 onClick={() => setSearchOpen(true)}
               >
                 <Instagram className="h-5 w-5" />
               </Button>

              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="rounded-full text-text-sub">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                } />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> App Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive font-medium">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogContent className="max-w-md bg-white rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6 text-brand-green" />
                  Profile Settings
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <ThemeToggle />
                <hr className="border-border" />
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-brand-green/30 shadow-xl">
                      <AvatarImage src={currentUserData?.photoURL || user?.photoURL || ''} />
                      <AvatarFallback className="text-4xl">{currentUserData?.displayName?.charAt(0) || user?.displayName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => profileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-brand-green p-2 rounded-full shadow-lg text-white hover:scale-110 transition-transform active:scale-95"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-text-sub text-center bg-gray-50 px-3 py-1 rounded-full border border-gray-100 italic">Click the pencil to change photo</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#00a884] ml-1">Email Address</label>
                    <div className="h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 flex items-center text-sm text-gray-500 font-medium">
                      {currentUserData?.email || user?.email}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#00a884] ml-1">Username / Display Name</label>
                    <Input 
                      placeholder="Enter your name" 
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="h-12 border-2 border-gray-100 focus-visible:border-brand-green focus-visible:ring-0 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#00a884] ml-1">About</label>
                    <Textarea 
                      placeholder="Enter about status" 
                      value={newAbout}
                      onChange={(e) => setNewAbout(e.target.value)}
                      className="min-h-[80px] border-2 border-gray-100 focus-visible:border-brand-green focus-visible:ring-0 rounded-xl resize-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setProfileOpen(false)}
                    className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleProfileUpdateAll}
                    disabled={uploading}
                    className="flex-1 h-12 bg-brand-green hover:bg-brand-green/90 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
                  >
                    {uploading ? 'Updating...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search & Sort */}
          <div className="p-2 flex items-center gap-2 bg-white dark:bg-[#111b21] border-b border-[#f2f2f2] dark:border-[#222d34]">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667781] dark:text-[#aebac1]" />
              <Input 
                placeholder="Search or start new chat" 
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="pl-12 bg-[#f0f2f5] dark:bg-[#202c33] border-none focus-visible:ring-0 h-9 rounded-xl text-[15px] text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-[#667781] dark:text-[#aebac1] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setChatSortOrder('desc')} className={chatSortOrder === 'desc' ? 'bg-accent' : ''}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatSortOrder('asc')} className={chatSortOrder === 'asc' ? 'bg-accent' : ''}>
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Chat List */}
          <div className="flex-1 bg-white dark:bg-[#111b21] chat-scroll-area overflow-y-auto">
            {loadingChats ? (
              <div className="flex flex-col items-center justify-center p-8 mt-12 gap-4">
                <UiverseLoader />
                <p className="text-xs text-[#667781] dark:text-[#aebac1] font-medium animate-pulse">Initializing Squad...</p>
              </div>
            ) : (
              <div className="pb-4">
                {activeTab === 'chats' && (
                  (() => {
                    let uniqueChats: ChatData[] = [];
                    const seenParticipants = new Set();
                    
                    chats.forEach(chat => {
                      if (chat.isGroup) return;
                      const otherUser = getOtherUser(chat);
                      if (otherUser && !seenParticipants.has(otherUser.uid)) {
                        // Filter logic
                        if (chatSearchQuery) {
                          const query_ = chatSearchQuery.toLowerCase();
                          const matchesName = (otherUser.displayName?.toLowerCase() || '').includes(query_);
                          const matchesLastMsg = (chat.lastMessage?.text?.toLowerCase() || '').includes(query_);
                          if (!matchesName && !matchesLastMsg) return;
                        }

                        uniqueChats.push(chat);
                        seenParticipants.add(otherUser.uid);
                      }
                    });

                    // Sorting logic
                    uniqueChats.sort((a, b) => {
                      const aTime = a.lastMessage?.timestamp?.toMillis?.() || a.lastMessage?.timestamp?.seconds * 1000 || 0;
                      const bTime = b.lastMessage?.timestamp?.toMillis?.() || b.lastMessage?.timestamp?.seconds * 1000 || 0;
                      return chatSortOrder === 'desc' ? bTime - aTime : aTime - bTime;
                    });
                    
                    if (uniqueChats.length === 0) return (
                      <div className="p-8 text-center text-[#667781] dark:text-[#8696a0]">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">No chats yet.</p>
                      </div>
                    );

                    return uniqueChats.map((chat) => {
                      const otherUser = getOtherUser(chat);
                      if (!otherUser) return null;
                      
                      const isSelected = selectedChat?.id === chat.id;
                      const lastMsgTime = chat.lastMessage?.timestamp?.toDate ? chat.lastMessage.timestamp.toDate() : null;

                        return (
                          <div 
                            key={chat.id} 
                            className={cn(
                              "flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-b border-[#f2f2f2] dark:border-[#222d34] group",
                              isSelected ? "bg-brand-green/10 dark:bg-brand-green/5 border-l-4 border-l-brand-green" : "bg-white dark:bg-[#111b21] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
                            )}
                            onClick={() => setSelectedChat(chat)}
                          >
                            <div className="relative">
                              <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white dark:border-black/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                                <AvatarImage src={otherUser?.uid === AI_USER.uid ? AI_USER.photoURL : otherUser?.photoURL} />
                                <AvatarFallback className="bg-brand-green/10 text-brand-green font-black">
                                  {otherUser?.displayName?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              {otherUser?.uid === AI_USER.uid ? (
                                <div className="absolute -top-1 -right-1 bg-brand-green text-white p-0.5 rounded-full shadow-sm">
                                  <Sparkles className="h-3 w-3" />
                                </div>
                              ) : otherUser?.status === 'online' && (
                                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#111b21] rounded-full shadow-inner" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex justify-between items-baseline mb-1">
                                <h3 className={cn(
                                  "font-bold text-[16px] truncate tracking-tight",
                                  isSelected ? "text-brand-green" : "text-[#111b21] dark:text-[#e9edef]"
                                )}>
                                  {otherUser?.displayName}
                                </h3>
                                {lastMsgTime && (
                                   <span className="text-[10px] font-black text-[#667781] dark:text-[#8696a0] uppercase tracking-widest">
                                     {format(lastMsgTime, 'HH:mm')}
                                   </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[13px] text-[#667781] dark:text-[#8696a0] truncate leading-tight flex-1 font-medium italic">
                                  {typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage?.text || 'New chat started'}
                                </p>
                                {chat.typing && Object.values(chat.typing).some(t => t !== null) && (
                                  <span className="text-[10px] text-brand-green font-black uppercase tracking-widest animate-pulse ml-2">typing...</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                    });
                  })()
                )}

                {activeTab === 'group' && (
                  <div className="p-4 space-y-4">
                    <p className="text-xs font-semibold text-[#00a884] uppercase tracking-wider px-2">Groups</p>
                    {chats.filter(c => c.isGroup).length > 0 ? (
                       chats.filter(c => c.isGroup).map((chat) => (
                         <div 
                           key={chat.id} 
                           className={cn(
                             "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-xl",
                             selectedChat?.id === chat.id ? "bg-[#ebebeb] dark:bg-[#2a3942]" : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
                           )}
                           onClick={() => setSelectedChat(chat)}
                         >
                           <Avatar className="h-12 w-12 flex-shrink-0">
                             <AvatarFallback className="bg-brand-green/10 text-brand-green">
                               <Users className="h-6 w-6" />
                             </AvatarFallback>
                           </Avatar>
                           <div className="min-w-0 flex-1">
                             <p className="font-bold text-[#111b21] dark:text-[#e9edef] truncate">{chat.name}</p>
                             <p className="text-xs text-[#667781] dark:text-[#8696a0] truncate">{chat.lastMessage?.text || 'New group started'}</p>
                           </div>
                         </div>
                       ))
                    ) : (
                      <div className="py-20 text-center">
                         <div className="p-4 bg-[#00a884]/10 rounded-full inline-block mb-4">
                            <Users className="h-8 w-8 text-brand-green" />
                         </div>
                         <p className="text-sm text-text-sub">No groups yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'status' && (
                  <div className="p-4 space-y-6">
                    <div 
                      className="flex items-center gap-4 bg-background dark:bg-white/5 p-4 rounded-3xl border border-[#d1d7db] dark:border-white/5 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-white/10 transition-all shadow-sm"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <div className="relative">
                         <Avatar className="h-14 w-14 ring-2 ring-[#00a884] ring-offset-2 ring-offset-background">
                           <AvatarImage src={currentUserData?.photoURL || user?.photoURL} />
                           <AvatarFallback>{currentUserData?.displayName?.charAt(0) || user?.displayName?.charAt(0) || '?'}</AvatarFallback>
                         </Avatar>
                         <div className="absolute bottom-0 right-0 bg-[#00a884] rounded-full p-0.5 border-2 border-background text-white">
                           <Plus className="h-3 w-3" />
                         </div>
                      </div>
                      <div>
                        <p className="font-bold text-[#111b21] dark:text-[#e9edef]">My Status</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Share an update</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-[#00a884] uppercase tracking-wider px-2">Recent Status</p>
                      {(() => {
                        // Group posts by authorId
                        const groupedPosts: Record<string, any[]> = {};
                        posts.forEach(post => {
                          if (!groupedPosts[post.authorId]) {
                            groupedPosts[post.authorId] = [];
                          }
                          groupedPosts[post.authorId].push(post);
                        });

                        const authorIds = Object.keys(groupedPosts);

                        if (authorIds.length === 0) {
                          return (
                            <div className="py-20 text-center">
                              <CircleDot className="h-16 w-16 mx-auto mb-4 opacity-10 text-brand-green" />
                              <p className="text-sm text-[#667781] dark:text-[#8696a0]">No recent updates</p>
                            </div>
                          );
                        }

                        return authorIds.map(authorId => {
                          if (!authorId) return null;
                          const author = allUsers.find(u => u.uid === authorId) || (authorId === user?.uid ? currentUserData || { uid: user?.uid, displayName: user?.displayName, photoURL: user?.photoURL } : null);
                          if (!author) return null;
                          
                          const userStatuses = groupedPosts[authorId];
                          const latestStatus = userStatuses[0];

                          return (
                            <div 
                              key={`status-author-${authorId}`} 
                              className="flex items-center gap-4 p-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] rounded-3xl transition-all cursor-pointer group"
                              onClick={() => setViewingStatus({ author: author as UserData, statuses: userStatuses })}
                            >
                              <div className="relative p-0.5 rounded-full border-2 border-brand-green">
                                <Avatar className="h-14 w-14 border-2 border-background">
                                  <AvatarImage src={author.photoURL} />
                                  <AvatarFallback>{author.displayName?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#111b21] dark:text-[#e9edef] truncate">{author.displayName}</p>
                                <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                                  {latestStatus.timestamp?.toDate ? format(latestStatus.timestamp.toDate(), 'HH:mm') : 'Just now'}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-xs font-semibold text-[#FF0000] flex items-center gap-1 uppercase tracking-wider">
                          <Youtube className="h-3 w-3" /> Popular Shorts
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[10px] h-6 text-brand-green hover:bg-brand-green/10 rounded-full"
                          onClick={() => {
                            if (youtubeVideos.length > 0) {
                              setSelectedShortIndex(0);
                              setSelectedChat(null);
                            }
                          }}
                        >
                          Watch All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-8">
                        {youtubeVideos.length > 0 ? (
                          (() => {
                            // Deduplicate videos by ID to avoid key warnings
                            const seenIds = new Set();
                            const uniqueVideos = youtubeVideos.filter(v => {
                              if (seenIds.has(v.id)) return false;
                              seenIds.add(v.id);
                              return true;
                            });

                            return uniqueVideos.map((video, index) => (
                              <div 
                                key={`yt-${video.id}`} 
                                className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
                                onClick={() => {
                                  setSelectedShortIndex(index);
                                  setSelectedChat(null);
                                }}
                              >
                              <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-[10px] text-white/90 font-medium line-clamp-2 leading-tight">
                                  {video.title}
                                </p>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                <Play className="h-8 w-8 text-white fill-white" />
                              </div>
                            </div>
                            ))
                          })()
                        ) : (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div 
                              key={`skeleton-${i}`} 
                              className="aspect-[9/16] rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                          ))
                        )}
                      </div>
                      <div ref={shortsGridSentinelRef} className="h-10 w-full flex items-center justify-center">
                        {loadingMoreShorts && (
                          <div className="w-5 h-5 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {chats.length === 0 && activeTab === 'chats' && (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-brand-green uppercase tracking-wider mb-4 px-2">Suggested People</p>
                    
                    <div className="mb-4 px-2">
                      <Input 
                        placeholder="Search users..." 
                        value={newChatSearchQuery}
                        onChange={(e) => setNewChatSearchQuery(e.target.value)}
                        className="w-full bg-chat-surface border-none"
                      />
                    </div>

                    <div className="space-y-1">
                      {allUsers.filter(u => (u.displayName?.toLowerCase() || '').includes(newChatSearchQuery.toLowerCase())).length > 0 ? (
                        allUsers.filter(u => (u.displayName?.toLowerCase() || '').includes(newChatSearchQuery.toLowerCase())).map((u) => (
                          <div 
                            key={u.uid} 
                            className="flex items-center gap-3 p-3 hover:bg-chat-surface rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                            onClick={() => startNewChat(u)}
                          >
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                              <AvatarImage src={u.photoURL} />
                              <AvatarFallback>{u.displayName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-main text-[15px] truncate">{u.displayName}</p>
                              <p className="text-[12px] text-text-sub flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                {u.status}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-text-sub">
                          <p className="text-sm italic">No other users found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
           )}
          </div>
        </div>

        {/* Chat Window / Main Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#efe7de] dark:bg-[#0b141a] relative overflow-hidden transition-all duration-300",
          selectedChat || activeTab === 'about' ? "flex" : "hidden lg:flex"
        )}>
          {activeTab === 'about' && !selectedChat ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col bg-white dark:bg-[#111b21] overflow-hidden font-['Outfit'] relative transition-colors duration-500"
            >
              <AnimatePresence>
                {!musicActive && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 text-center"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white dark:bg-[#202c33] p-10 rounded-[3rem] shadow-2xl max-w-sm border border-brand-green/20"
                    >
                      <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Volume2 className="h-10 w-10 text-brand-green animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-black text-text-main dark:text-white uppercase tracking-tighter mb-4">Experience with Sound</h2>
                      <p className="text-text-sub text-sm font-medium mb-8 italic">
                        "{aboutMusicInfo?.title || 'Loading Soundtrack...'}"
                      </p>
                      <Button 
                        className="w-full bg-brand-green hover:bg-[#06cf9c] text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg transform transition-transform active:scale-95"
                        onClick={() => {
                          setMusicActive(true);
                          setMusicGestureTrigger(prev => prev + 1);
                        }}
                      >
                        <Play className="h-5 w-5 mr-2 fill-current" />
                        Start Experience
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 relative overflow-hidden flex flex-col items-center">
                {/* Overlay gradients for cinematic feel */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white dark:from-[#111b21] to-transparent z-10" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-[#111b21] to-transparent z-10" />

                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: "-100%" }}
                  transition={{ 
                    duration: 25, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="w-full max-w-2xl px-8 flex flex-col gap-12 text-center py-20"
                >
                  {[
                    { name: 'kellymunguyiko', role: 'Super Project Creator & Lead Developer' },
                    { name: 'alpha', role: 'Conceptual Vision & Ideas' },
                    { name: 'ChatGPT', role: 'Data Analysis & Technical Architect' },
                    { name: 'Xline', role: 'Core Development Environment' },
                    { name: 'Figma', role: 'High-Fidelity UI/UX Prototyping' },
                    { name: 'Cline', role: 'Cloud Database Architecture' },
                    { name: 'Codex', role: 'SEO Framework & Intelligence' },
                    { name: 'Google Gemini', role: 'AI Integration & Publishing' },
                    { name: 'kellyseekai', role: 'Next-Gen Motion & Animations' },
                    { name: 'sofferrwanda', role: 'Advanced Security Protocol' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2 group">
                      <h3 className="text-4xl lg:text-5xl font-black text-brand-green uppercase tracking-tighter transition-all group-hover:scale-110">
                        {item.name}
                      </h3>
                      <p className="text-lg lg:text-xl font-bold text-text-sub uppercase tracking-[0.2em]">
                        {item.role}
                      </p>
                    </div>
                  ))}

                  <div className="py-20 flex flex-col items-center gap-4">
                    <div className="flex -space-x-6">
                      {['K', 'N', 'G'].map((sym, i) => (
                         <div key={i} className="w-16 h-16 rounded-full border-4 border-white dark:border-[#111b21] bg-gradient-to-br from-brand-green to-[#06cf9c] flex items-center justify-center text-xl font-black text-white shadow-2xl">
                           {sym}
                         </div>
                      ))}
                    </div>
                    <p className="text-sm font-black text-text-sub uppercase tracking-[0.5em]">CREATIT ELITE TEAM</p>
                  </div>
                </motion.div>
              </div>

              {/* Fixed Footer Links */}
              <div className="p-8 lg:p-12 bg-white/50 dark:bg-[#111b21]/50 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-20 shrink-0">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AudioVisualizer />
                      <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest animate-pulse max-w-[200px] truncate">
                        Now Playing: {aboutMusicInfo?.title || 'Loading Soundtrack...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-5 p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-brand-green/10 transition-all cursor-pointer"
                    onClick={() => window.open('https://kellybox.netlify.app', '_blank')}
                  >
                    <div className="p-4 bg-brand-green/10 rounded-2xl text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-white transition-all shadow-inner">
                      <Share2 className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">Official Platform</p>
                      <h4 className="text-lg font-bold text-text-main group-hover:text-brand-green transition-colors">Media Share</h4>
                      <p className="text-sm text-text-sub font-medium truncate">kellybox.netlify.app</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-5 p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-brand-green/10 transition-all cursor-pointer"
                    onClick={() => window.open('https://kellyseekhelp.netlify.app', '_blank')}
                  >
                    <div className="p-4 bg-brand-green/10 rounded-2xl text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-white transition-all shadow-inner">
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">Support Network</p>
                      <h4 className="text-lg font-bold text-text-main group-hover:text-brand-green transition-colors">Community Help</h4>
                      <p className="text-sm text-text-sub font-medium truncate">kellyseekhelp.netlify.app</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
          ) : selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 bg-background/50 backdrop-blur-md px-4 flex items-center justify-between z-10 shadow-sm border-b border-white/5">
                <div className="flex items-center gap-3 flex-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden rounded-full mr-1"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-xl transition-all"
                    onClick={() => {
                      const otherUser = getOtherUser(selectedChat);
                      if (otherUser) setViewingUser(otherUser);
                    }}
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-brand-green/20">
                      <AvatarImage src={getOtherUser(selectedChat)?.photoURL} />
                      <AvatarFallback>{getOtherUser(selectedChat)?.displayName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-bold text-foreground leading-tight tracking-tight">{getOtherUser(selectedChat)?.displayName}</h2>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const otherUser = getOtherUser(selectedChat);
                          const otherId = selectedChat.participants.find(p => p !== user?.uid);
                          const typingTime = selectedChat.typing?.[otherId || ''];
                          const isTyping = typingTime && (Date.now() - (typingTime?.toMillis?.() || typingTime?.seconds * 1000 || 0) < 5000);
                          
                          if (isTyping) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xs text-brand-green font-medium flex items-center gap-1"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                                </span>
                                typing...
                              </motion.div>
                            );
                          }
                          
                          return (
                            <>
                              {otherUser?.status === 'offline' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                              <p className="text-xs text-muted-foreground">
                                {otherUser?.status === 'online' ? 'online' : (
                                  otherUser?.lastSeen ? `last seen ${format(otherUser.lastSeen.toDate ? otherUser.lastSeen.toDate() : new Date(), 'HH:mm')}` : 'offline'
                                )}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-foreground hover:bg-accent"
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                      } else {
                        document.exitFullscreen();
                      }
                    }}
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-text-sub">
                    <Search className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="rounded-full text-text-sub">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleMute(selectedChat.id)}>
                        {selectedChat.mutedBy?.includes(user?.uid || '') ? (
                          <><Bell className="mr-2 h-4 w-4" /> Unmute Notifications</>
                        ) : (
                          <><BellOff className="mr-2 h-4 w-4" /> Mute Notifications</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 px-4 lg:px-16 py-6 bg-[#efe7de] dark:bg-[#0b141a] chat-scroll-area h-0 overflow-y-auto">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <UiverseLoader />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                      {messages.map((msg, i) => {
                        const isMine = msg.senderId === user?.uid;
                        const time = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
                        const messageKey = msg.id || `msg-${i}-${time.getTime()}`;
                        
                        return (
                          <div key={messageKey} className={cn("flex group mb-4", isMine ? "justify-end" : "justify-start")}>
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, x: isMine ? 20 : -20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              className={cn(
                                "max-w-[85%] lg:max-w-[70%] p-1 rounded-[2.2rem] shadow-xl relative transition-all",
                                isMine 
                                  ? "bg-brand-green text-white rounded-tr-none shadow-brand-green/20" 
                                  : "bg-white dark:bg-[#202c33] text-text-main dark:text-white rounded-tl-none border border-gray-100 dark:border-white/5 shadow-black/5"
                              )}
                            >
                              <div className="px-5 py-4">
                                {!isMine && selectedChat.isGroup && (
                                  <p className="text-[12px] font-black text-brand-green uppercase tracking-widest mb-2">
                                    {allUsers.find(u => u.uid === msg.senderId)?.displayName || 'Unknown'}
                                  </p>
                                )}
                                
                                {msg.mediaUrl && (
                                  <div className="mb-3 rounded-[1.8rem] overflow-hidden shadow-inner bg-black/5 dark:bg-white/5">
                                    {msg.mediaType === 'video' ? (
                                      <div className="relative">
                                        <video src={msg.mediaUrl} className="max-w-full rounded-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Maximize2 
                                            className="h-8 w-8 text-white cursor-pointer" 
                                            onClick={() => {
                                              setPreviewUrl(msg.mediaUrl!);
                                              setPreviewType('video');
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ) : msg.mediaType === 'image' ? (
                                      <img 
                                        src={msg.mediaUrl} 
                                        alt="Uploaded media" 
                                        referrerPolicy="no-referrer"
                                        className="max-h-96 w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                        onClick={() => { setPreviewUrl(msg.mediaUrl!); setPreviewType('image'); }}
                                      />
                                    ) : msg.mediaType === 'voice' && (
                                      <div className="p-4 bg-brand-green/10 rounded-2xl flex items-center gap-4">
                                        <div className="h-10 w-10 bg-brand-green rounded-full flex items-center justify-center text-white shadow-lg">
                                           <Volume2 className="h-5 w-5" />
                                        </div>
                                        <audio src={msg.mediaUrl} controls className="h-8 max-w-[150px] md:max-w-xs filter invert dark:invert-0" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {msg.text && (
                                  <div className={cn(
                                    "text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium tracking-tight",
                                    isMine ? "text-white" : "text-text-main dark:text-white"
                                  )}>
                                    {renderMessageText(msg.text)}
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "flex items-center gap-1.5 mt-2 transition-opacity",
                                  isMine ? "justify-end opacity-80" : "justify-start opacity-50"
                                )}>
                                  <span className="text-[9px] font-black uppercase tracking-widest">
                                    {format(time, 'HH:mm')}
                                  </span>
                                  {isMine && <CheckCheck className="h-3 w-3" />}
                                </div>
                              </div>

                              <div className={cn(
                                "absolute top-2 opacity-0 group-hover:opacity-100 transition-all flex gap-1",
                                isMine ? "-left-12 flex-row-reverse" : "-right-12"
                              )}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-md shadow-sm"
                                  onClick={() => handleDeleteMessage(msg.id!)}
                                >
                                  <Trash2 className="h-4 w-4 text-rose-500" />
                                </Button>
                              </div>
                            </motion.div>
                          </div>
                      );
                    })}
                    {aiLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white dark:bg-[#202c33] p-3 rounded-2xl shadow-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Bubble AI is thinking</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-chat-surface px-4 py-3 flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,video/*"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="rounded-full text-text-sub">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  } />
                  <DropdownMenuContent align="start" className="mb-2">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="mr-2 h-4 w-4" /> Photo & Video
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-muted-foreground opacity-50 cursor-not-allowed">
                      <VideoIcon className="mr-2 h-4 w-4" /> Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
                  <textarea 
                    placeholder={isRecording ? "Recording voice note..." : "Type a message"}
                    autoFocus
                    className="bg-white border focus-visible:border-brand-green focus-visible:ring-1 focus-visible:ring-brand-green/20 min-h-[48px] max-h-[120px] rounded-2xl text-gray-900 shadow-inner px-4 py-3 flex-1 resize-none overflow-hidden"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (selectedChat) {
                        handleTyping(selectedChat.id);
                      }
                      e.target.style.height = 'auto';
                      if (e.target.scrollHeight > 120) {
                        e.target.style.height = '120px';
                        e.target.style.overflowY = 'scroll';
                      } else {
                        e.target.style.height = e.target.scrollHeight + 'px';
                        e.target.style.overflowY = 'hidden';
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                        e.currentTarget.style.height = '48px';
                        e.currentTarget.style.overflowY = 'hidden';
                      }
                    }}
                    disabled={uploading || isRecording}
                    rows={1}
                  />
                  
                  <div className="flex gap-2">
                    {newMessage.trim() ? (
                      <Button type="submit" size="icon" className="bg-brand-green hover:bg-brand-green/90 rounded-full h-11 w-11 shadow-md transition-all active:scale-95">
                        <Send className="h-5 w-5 text-white" />
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        size="icon" 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full h-11 w-11 shadow-md transition-all active:scale-95 ${
                          isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-brand-green hover:bg-brand-green/90'
                        }`}
                      >
                        {isRecording ? <Square className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
              
              {uploading && (
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-50">
                  <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                     <CloudLoader />
                     <p className="font-semibold text-gray-900">Sending media...</p>
                  </div>
                </div>
              )}
            </>
          ) : selectedShortIndex !== null ? (
            <ShortsFeed 
              videos={youtubeVideos} 
              initialIndex={selectedShortIndex} 
              onClose={() => setSelectedShortIndex(null)} 
              onLoadMore={() => youtubePageToken && loadYoutubeData(youtubePageToken)}
              isLoadingMore={loadingMoreShorts}
              onShare={(v) => {
                setSharingVideo(v);
                setShareDialogOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#222e35] text-center p-8 relative">
              <div className="max-w-md space-y-6">
                <div className="flex justify-center">
                   <div className="w-64 h-64 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                     <img 
                       src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa699P6fS_L.png" 
                       alt="WhatsApp Desktop" 
                       className="w-48 h-auto opacity-50 grayscale"
                       referrerPolicy="no-referrer"
                     />
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-[32px] font-light text-[#41525d] dark:text-[#e9edef]">WhatsApp Web</h1>
                  <p className="text-sm text-[#667781] dark:text-[#8696a0] leading-relaxed">
                    Send and receive messages without keeping your phone online.<br />
                    Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                   <div className="flex items-center gap-2 text-[#8696a0] text-xs">
                     <Download className="h-4 w-4" />
                     <span>Get the app for Windows</span>
                   </div>
                </div>
              </div>
              
              <div className="absolute bottom-10 flex items-center gap-2 text-[#8696a0] text-xs">
                <Plus className="h-3 w-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          )}
        </div>

        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none rounded-none sm:rounded-2xl">
            <DialogTitle className="sr-only">Media Preview</DialogTitle>
            <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[50vh]">
               <button 
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
               >
                 <X className="h-6 w-6" />
               </button>
               
               {previewType === 'video' ? (
                  previewUrl?.includes('youtube.com') ? (
                    <div className={cn(
                      "relative w-full flex items-center justify-center",
                      previewUrl.includes('/shorts/') ? "h-[85vh] aspect-[9/16]" : "aspect-video max-w-4xl max-h-[80vh]"
                    )}>
                      <iframe
                        src={previewUrl}
                        className="w-full h-full shadow-2xl border-none rounded-xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video 
                      src={previewUrl || ''} 
                      controls 
                      autoPlay
                      className="max-w-full max-h-[80vh] shadow-2xl" 
                    />
                  )
               ) : (
                 <img 
                   src={previewUrl || ''} 
                   alt="Preview" 
                   className="max-w-full max-h-[80vh] object-contain shadow-2xl" 
                   referrerPolicy="no-referrer"
                 />
               )}
               
               <div className="mt-6 flex gap-4">
                 {previewUrl && !previewUrl.includes('youtube.com') && (
                   <Button 
                     onClick={() => downloadMedia(previewUrl, `media-${Date.now()}`)}
                     className="bg-brand-green hover:bg-brand-green/90 text-white rounded-full px-6 flex items-center gap-2"
                   >
                     <Download className="h-4 w-4" /> Download
                   </Button>
                 )}
                 <Button 
                  variant="outline"
                  onClick={() => setPreviewUrl(null)}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-full px-6"
                 >
                   Close
                 </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-[425px] overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl font-bold tracking-tight">Share with Friends</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2 py-4">
                  {allUsers.length > 0 ? (
                    allUsers.map((u) => (
                      <div 
                        key={u.uid} 
                        className="flex items-center gap-3 p-3 hover:bg-chat-surface rounded-xl cursor-pointer transition-all active:scale-[0.98] border border-transparent hover:border-brand-green/20"
                        onClick={() => handleShareToUser(u)}
                      >
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
                          <AvatarImage src={u.photoURL} />
                          <AvatarFallback>{u.displayName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-main text-sm truncate">{u.displayName}</p>
                          <p className="text-[11px] text-text-sub truncate">Click to send link</p>
                        </div>
                        <div className="p-2 rounded-full bg-brand-green/10 text-brand-green">
                          <Send className="h-4 w-4" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-muted-foreground">
                      <p className="text-sm">No friends found to share with</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Info Dialog */}
        <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
          <DialogContent className="max-w-md bg-white dark:bg-[#111b21] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-32 bg-brand-green w-full relative">
               <button 
                 onClick={() => setViewingUser(null)}
                 className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
               >
                 <X className="h-5 w-5" />
               </button>
            </div>
            <div className="px-8 pb-8 -mt-16 flex flex-col items-center">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-[#111b21] shadow-xl mb-4">
                <AvatarImage src={viewingUser?.photoURL} />
                <AvatarFallback className="text-4xl">{viewingUser?.displayName?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold text-text-main text-center mb-1">{viewingUser?.displayName}</h2>
              <div className="flex items-center gap-2 mb-6">
                <span className={`w-2.5 h-2.5 rounded-full ${viewingUser?.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-text-sub font-medium capitalize">{viewingUser?.status}</span>
              </div>

              <div className="w-full space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-xs font-bold text-brand-green uppercase tracking-widest mb-2 font-mono">About</p>
                  <p className="text-text-main text-[15px] leading-relaxed">
                    {viewingUser?.about || 'Hey there! I am using WhatsApp'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group">
                    <div className="p-2 text-brand-green group-hover:scale-110 transition-transform"><MessageSquare className="h-6 w-6" /></div>
                    <span className="text-[10px] font-bold text-text-sub uppercase">Chat</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group">
                    <div className="p-2 text-brand-green group-hover:scale-110 transition-transform"><VideoIcon className="h-6 w-6" /></div>
                    <span className="text-[10px] font-bold text-text-sub uppercase">Video</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group">
                    <div className="p-2 text-rose-500 group-hover:scale-110 transition-transform"><Trash2 className="h-6 w-6" /></div>
                    <span className="text-[10px] font-bold text-text-sub uppercase text-rose-500">Block</span>
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Viewer */}
        {viewingStatus && (
          <StatusViewer 
            author={viewingStatus.author}
            statuses={viewingStatus.statuses}
            onClose={handleCloseStatus}
          />
        )}

        {/* Full Admin Page */}
        {showFullAdmin && (
          <FullAdminPage onClose={() => setShowFullAdmin(false)} />
        )}

        {/* Global Components */}
        <BackgroundMusic playing={activeTab === 'about' && musicActive} force={musicGestureTrigger} />

        {/* About Dialog Removed as it's now a full page */}
      </div>
    </div>
  );
}
