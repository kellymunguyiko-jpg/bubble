import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { UserData } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, ShieldCheck, Search, Users, ExternalLink, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_PASSKEY = 'kelly_92nZxPq4T7Lm9VbC';

export function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVerify = () => {
    if (passkey === ADMIN_PASSKEY) {
      setIsAdmin(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid passkey');
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
    if (!window.confirm('Are you sure you want to delete this user? This will only remove their profile from the database.')) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('User profile deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="h-16 w-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-2">
          <ShieldCheck className="h-8 w-8 text-brand-green" />
        </div>
        <h3 className="text-xl font-bold">Admin Verification</h3>
        <p className="text-sm text-text-sub text-center max-w-xs">
          Please enter the administrative passkey to access user management tools.
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <Input 
            type="password" 
            placeholder="Enter passkey..." 
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="flex-1 bg-chat-surface border-none focus-visible:ring-brand-green"
          />
          <Button onClick={handleVerify} className="bg-brand-green hover:bg-brand-green/90 text-white font-bold">
            Verify
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">User Management</h3>
            <p className="text-xs text-text-sub">{users.length} total users registered</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full border-brand-green text-brand-green hover:bg-brand-green hover:text-white transition-all gap-2"
          onClick={() => {
            // We need a way to trigger this from Dashboard. 
            // I'll use a custom event or window property for simplicity in this specific architecture 
            // if I don't want to drill props too deep.
            window.dispatchEvent(new CustomEvent('open-full-admin'));
          }}
        >
          <Maximize2 className="h-4 w-4" />
          Go Full Screen
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-sub" />
        <Input 
          placeholder="Search by name, email or UID..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-chat-surface border-none focus-visible:ring-brand-green"
        />
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u) => (
              <motion.div 
                key={u.uid}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-between p-3 bg-chat-surface rounded-xl hover:bg-chat-surface/80 transition-all border border-transparent hover:border-brand-green/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-brand-green/20">
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold truncate max-w-[120px] sm:max-w-none">{u.displayName}</span>
                    <span className="text-[10px] text-text-sub font-mono">{u.email || u.uid.slice(0, 8)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full"
                    onClick={() => handleDeleteUser(u.uid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center p-12 bg-chat-surface/50 rounded-3xl border border-dashed border-zinc-700">
            <p className="text-sm text-text-sub italic">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
