export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  status: 'online' | 'offline';
  about?: string;
  lastSeen: any;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'voice';
}

export interface ChatData {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  updatedAt: any;
  mutedBy?: string[];
  typing?: Record<string, any>;
  isGroup?: boolean;
  name?: string;
  creatorId?: string;
  participantDetails?: Record<string, UserData>;
}

export interface Post {
  id: string;
  authorId: string;
  caption?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: any;
  likes: string[];
  commentsCount: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  text: string;
  timestamp: any;
}
