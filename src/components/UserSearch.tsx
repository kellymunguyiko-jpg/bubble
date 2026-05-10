import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, UserPlus, MessageCircle, ChevronRight, Hash, Sparkles, Bot, Ghost } from 'lucide-react';
import { UserData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserSearchProps {
  users: UserData[];
  onSelectUser: (user: UserData) => void;
  onSelectAI: () => void;
  onClose: () => void;
}

export function UserSearch({ users, onSelectUser, onSelectAI, onClose }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const onlineUsers = users.filter(u => u.status === 'online').slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-white dark:bg-[#0b141a] flex flex-col w-full h-full md:h-[80vh] md:max-h-[700px] md:rounded-[3rem] shadow-2xl overflow-hidden pointer-events-auto"
    >
      {/* Header */}
      <div className="px-8 pt-10 pb-6 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black tracking-tighter uppercase text-text-main dark:text-white leading-none">Search</h2>
          <p className="text-[10px] font-bold text-brand-green uppercase tracking-[0.2em] mt-1">Bubble Intelligence</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-chat-surface/80 dark:bg-white/10 hover:bg-brand-green hover:text-white transition-all size-10">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Bar - Instagram Style */}
      <div className="px-6 pb-6 shrink-0">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-brand-green/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-sub group-focus-within:text-brand-green transition-colors z-10" />
          <Input 
            autoFocus
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-13 h-16 bg-chat-surface dark:bg-white/5 border-none rounded-2xl text-[17px] font-medium placeholder:text-text-sub/40 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 shadow-inner"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-10 space-y-6">
          {/* AI Bot Section - Meta AI style */}
          {!searchQuery && (
            <section className="space-y-3">
              <p className="px-4 text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Next-Gen Intelligence</p>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSelectAI}
                className="group relative p-4 rounded-[2.5rem] bg-gradient-to-br from-brand-green/20 via-brand-green/5 to-transparent border border-brand-green/20 cursor-pointer overflow-hidden shadow-lg shadow-brand-green/10"
              >
                <div className="absolute top-0 right-0 p-4">
                   <Sparkles className="h-5 w-5 text-brand-green animate-pulse" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-white dark:border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <AvatarImage src="https://images.unsplash.com/photo-1675249141982-64523f78833a?q=80&w=200&h=200&auto=format&fit=crop" />
                      <AvatarFallback className="bg-brand-green text-white font-black">AI</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-brand-green text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-[#0b141a]">
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-text-main dark:text-white uppercase tracking-tighter text-lg leading-tight">Bubble AI</h3>
                    <p className="text-xs text-brand-green font-bold flex items-center gap-1">
                      Always online <span className="h-1 w-1 rounded-full bg-brand-green animate-ping" />
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-text-sub font-medium leading-relaxed px-1">
                  Ask me about anything, generate code, or just chat. I'm here 24/7.
                </p>
              </motion.div>
            </section>
          )}

          {/* Recently Active Horizontal - Instagram style */}
          {!searchQuery && onlineUsers.length > 0 && (
            <section className="space-y-3">
              <p className="px-4 text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Recently Logged In</p>
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 py-1">
                {onlineUsers.map(u => (
                  <div key={u.uid} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onSelectUser(u)}>
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-green to-blue-500 opacity-50 group-hover:opacity-100 blur-sm transition-opacity" />
                      <Avatar className="h-16 w-16 border-2 border-white dark:border-[#0b141a] relative z-10 group-hover:scale-105 transition-transform">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback>{u.displayName?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-[10px] font-bold text-text-main dark:text-white truncate w-16 text-center">
                      {(u.displayName || 'User').split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main List */}
          <section className="space-y-3">
            <p className="px-4 text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">
              {searchQuery ? 'Search Results' : 'Conversations'}
            </p>
            <div className="space-y-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, i) => (
                  <motion.div 
                    key={u.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center gap-4 p-3 rounded-[2rem] hover:bg-chat-surface dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-brand-green/20 shadow-sm hover:shadow-md"
                    onClick={() => onSelectUser(u)}
                  >
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-white dark:border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback className="bg-brand-green/10 text-brand-green font-black">
                          {u.displayName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {u.status === 'online' && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-[#0b141a]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-main dark:text-white truncate flex items-center gap-2">
                        {u.displayName}
                        <span className="h-3 w-3 rounded-full bg-brand-green/20 flex items-center justify-center">
                          <ChevronRight className="h-2 w-2 text-brand-green" />
                        </span>
                      </h3>
                      <p className="text-xs text-text-sub truncate font-medium">@{(u.email || 'user').split('@')[0]}</p>
                    </div>

                    <div className="hidden group-hover:flex gap-2 transition-all">
                       <Button size="icon" variant="ghost" className="rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/20">
                          <MessageCircle className="h-5 w-5" />
                       </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-chat-surface dark:bg-white/5 flex items-center justify-center relative">
                    <Hash className="h-10 w-10 text-text-sub" />
                    <div className="absolute -top-2 -right-2 transform rotate-12">
                       <Ghost className="h-8 w-8 text-brand-green/30" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-text-main dark:text-white uppercase tracking-tighter text-lg">No humans found</p>
                    <p className="text-xs text-text-sub font-medium">Try searching for another name or email</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

