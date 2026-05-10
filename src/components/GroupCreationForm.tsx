import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Loader2, Users } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { UserData } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GroupCreationFormProps {
  onSuccess: () => void;
}

export const GroupCreationForm = ({ onSuccess }: GroupCreationFormProps) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(50));
        const snapshot = await getDocs(q);
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserData).filter(u => u.uid !== user?.uid));
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, [user]);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const participants = [user.uid, ...selectedUsers];
      
      const groupRef = await addDoc(collection(db, 'chats'), {
        name: groupName,
        isGroup: true,
        participants,
        creatorId: user.uid,
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: `Group ${groupName} created`,
          senderId: 'system',
          timestamp: serverTimestamp()
        }
      });

      toast.success('Group created!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-2 px-1">
        <Label className="text-sm font-semibold ml-1">Group Name</Label>
        <Input 
          placeholder="Squad Name" 
          className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center mb-1">
          <Label className="text-sm font-semibold ml-1">Invite Members</Label>
          <span className="text-xs text-muted-foreground">{selectedUsers.length} selected</span>
        </div>
        
        <ScrollArea className="h-64 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-inner">
          <div className="space-y-1">
            {fetchingUsers ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Fetching users...</p>
              </div>
            ) : allUsers.length > 0 ? (
              allUsers.map((u) => (
                <div 
                  key={u.uid} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300",
                    selectedUsers.includes(u.uid) 
                      ? "bg-primary/20 border-white/10 shadow-lg scale-[1.02]" 
                      : "hover:bg-white/5"
                  )}
                  onClick={() => toggleUser(u.uid)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback>{u.displayName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{u.displayName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{u.status}</span>
                    </div>
                  </div>
                  {selectedUsers.includes(u.uid) && (
                    <div className="bg-primary p-1 rounded-full shadow-lg shadow-primary/40 animate-in zoom-in duration-300">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No users found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Button 
        className="w-full h-12 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
        disabled={loading || !groupName.trim() || selectedUsers.length === 0}
        onClick={handleCreateGroup}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Create Group <Users className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};
