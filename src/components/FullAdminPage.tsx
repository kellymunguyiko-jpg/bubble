import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserData } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trash2, 
  ShieldCheck, 
  Search, 
  Users, 
  ArrowLeft, 
  UserX, 
  AlertTriangle,
  Mail,
  Calendar,
  Key,
  Database,
  ExternalLink,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const ADMIN_PASSKEY = 'kelly_92nZxPq4T7Lm9VbC';

export function FullAdminPage({ onClose }: { onClose: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const handleVerify = () => {
    if (passkey === ADMIN_PASSKEY) {
      setIsAdmin(true);
      toast.success('System Administrator Access Granted');
    } else {
      toast.error('Access Denied: Invalid Passkey');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserData[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this user profile?')) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('User profile purged from database');
      if (selectedUser?.uid === uid) setSelectedUser(null);
    } catch (error) {
      console.error('Purge error:', error);
      toast.error('Database write failed');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#efe7de] dark:bg-[#0b141a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#111b21] p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border-t-[6px] border-brand-green flex flex-col items-center"
        >
          <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center mb-6 shadow-inner">
            <ShieldAlert className="h-10 w-10 text-brand-green animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-text-main dark:text-white uppercase tracking-tighter mb-2">Restricted Area</h2>
          <p className="text-text-sub text-sm font-medium text-center mb-8">
            Administrative credentials are required to modify the global user database.
          </p>
          <div className="space-y-4 w-full">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-green" />
              <Input 
                type="password" 
                placeholder="Admin Passkey" 
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="pl-12 py-6 bg-chat-surface border-none focus-visible:ring-2 focus-visible:ring-brand-green font-mono tracking-widest text-lg"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify} 
                className="flex-[2] bg-brand-green hover:bg-brand-green/90 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg"
              >
                Authenticate
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-[#efe7de] dark:bg-[#0b141a] flex flex-col font-['Outfit'] overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full hover:bg-chat-surface"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-brand-green uppercase tracking-tighter flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Core
            </h1>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Global Administrative Panel</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-text-main">{users.length} Active Profiles</span>
            <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
              <Activity className="h-3 w-3" /> Live Sync Active
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full h-10 px-4 gap-2 text-xs font-bold border-brand-green/20"
            onClick={() => window.open('https://kellyseekhelp.netlify.app', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Support Hub
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* User List Sidebar */}
        <div className="w-full md:w-[400px] border-r border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 flex flex-col shrink-0">
          <div className="p-4 bg-white dark:bg-[#111b21]/50 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-green" />
              <Input 
                placeholder="Search Database..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-chat-surface border-none focus-visible:ring-1 focus-visible:ring-brand-green"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-2 py-4">
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 w-full bg-chat-surface/50 rounded-2xl animate-pulse" />
                ))
              ) : filteredUsers.map((u) => (
                <motion.div 
                  key={u.uid}
                  whileHover={{ x: 5 }}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedUser?.uid === u.uid 
                      ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" 
                      : "bg-white dark:bg-white/5 hover:bg-chat-surface border border-transparent"
                  }`}
                >
                  <Avatar className="h-12 w-12 border-2 border-white/20 shadow-sm">
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm truncate ${selectedUser?.uid === u.uid ? "text-white" : "text-text-main"}`}>
                      {u.displayName}
                    </p>
                    <p className={`text-[10px] truncate ${selectedUser?.uid === u.uid ? "text-white/80" : "text-text-sub"}`}>
                      {u.email || u.uid}
                    </p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${u.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* User Details Area */}
        <div className="flex-1 bg-white/30 dark:bg-black/10 p-4 md:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div 
                key={selectedUser.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Profile Card */}
                <div className="bg-white dark:bg-[#111b21] rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       selectedUser.status === 'online' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                     }`}>
                       {selectedUser.status}
                     </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <Avatar className="h-40 w-40 border-[6px] border-chat-surface shadow-2xl">
                      <AvatarImage src={selectedUser.photoURL} />
                      <AvatarFallback className="text-4xl">{selectedUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                       <h2 className="text-4xl font-black text-text-main tracking-tighter uppercase">{selectedUser.displayName}</h2>
                       <p className="text-lg text-brand-green font-bold tracking-tight">{selectedUser.email}</p>
                       <p className="text-text-sub font-medium max-w-xl italic">
                         "{selectedUser.about || 'System default: Hey there! I am using WhatsApp'}"
                       </p>
                       
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                         <div className="space-y-1">
                           <p className="text-[10px] font-black text-text-sub uppercase tracking-widest flex items-center gap-1">
                             <Key className="h-3 w-3" /> Unique ID
                           </p>
                           <p className="text-xs font-mono font-bold bg-chat-surface p-2 rounded-lg truncate">{selectedUser.uid}</p>
                         </div>
                         <div className="space-y-1">
                           <p className="text-[10px] font-black text-text-sub uppercase tracking-widest flex items-center gap-1">
                             <Calendar className="h-3 w-3" /> Last Activity
                           </p>
                           <p className="text-xs font-bold text-text-main py-2">
                             {selectedUser.lastSeen ? format(selectedUser.lastSeen.toDate ? selectedUser.lastSeen.toDate() : new Date(), 'PPP p') : 'Unknown'}
                           </p>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Actions Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#111b21] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-white/5 space-y-6">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> User Status Control
                    </h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start py-6 rounded-2xl font-bold uppercase tracking-tight text-xs h-auto group bg-chat-surface border-none">
                         <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green mr-4 group-hover:bg-brand-green group-hover:text-white transition-all">
                           <ShieldAlert className="h-5 w-5" />
                         </div>
                         Reset Account Status
                      </Button>
                      <Button variant="outline" className="w-full justify-start py-6 rounded-2xl font-bold uppercase tracking-tight text-xs h-auto group bg-chat-surface border-none opacity-50 cursor-not-allowed">
                         <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mr-4">
                           <AlertTriangle className="h-5 w-5" />
                         </div>
                         Temporary Suspend (Beta)
                      </Button>
                    </div>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-500/5 rounded-[2.5rem] p-8 shadow-xl border border-rose-100 dark:border-rose-500/10 space-y-6">
                    <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <UserX className="h-4 w-4" /> Danger Zone
                    </h3>
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
                        Warning: Deleting a user will permanently remove their profile data and associated synchronization hooks. This action cannot be undone.
                      </p>
                      <Button 
                        onClick={() => handleDeleteUser(selectedUser.uid)}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs h-auto shadow-lg shadow-rose-500/20"
                      >
                        <Trash2 className="h-5 w-5 mr-3" />
                        Purge User Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-brand-green/5 flex items-center justify-center">
                  <Users className="h-16 w-16 text-brand-green/20" />
                </div>
                <div className="max-w-sm">
                  <h2 className="text-xl font-bold text-text-main uppercase tracking-tight">No Selection</h2>
                  <p className="text-sm text-text-sub font-medium">
                    Choose a profile from the database to view advanced metadata and administrative controls.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md px-6 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-8 shrink-0">
        <p className="text-[10px] font-black text-text-sub uppercase tracking-[0.3em]">
          Bubble Chat Systems <span className="text-brand-green mx-2">•</span> Secure Core v4.2.0
        </p>
      </footer>
    </div>
  );
}

const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-y-auto custom-scrollbar ${className}`}>
    {children}
  </div>
);
