import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Video as VideoIcon, Users, ArrowLeft } from 'lucide-react';
import { PostCreationForm } from './PostCreationForm';
import { GroupCreationForm } from './GroupCreationForm';

interface CreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreationDialog = ({ open, onOpenChange }: CreationDialogProps) => {
  const [step, setStep] = useState<'menu' | 'post' | 'group'>('menu');

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(() => setStep('menu'), 300); // Reset after animation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-3xl">
        <DialogHeader className="flex flex-row items-center gap-4">
          {step !== 'menu' && (
            <Button variant="ghost" size="icon" onClick={() => setStep('menu')} className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <DialogTitle className="text-xl font-bold tracking-tight">
            {step === 'menu' && "Create New"}
            {step === 'post' && "Share Update"}
            {step === 'group' && "New Group Chat"}
          </DialogTitle>
        </DialogHeader>

        {step === 'menu' && (
          <div className="grid grid-cols-2 gap-6 py-8">
            <button 
              onClick={() => setStep('post')}
              className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-primary/5 border border-white/5 hover:border-brand-green/50 hover:bg-brand-green/10 transition-all duration-500 shadow-lg hover:shadow-brand-green/20 hover:-translate-y-2 active:scale-95"
            >
              <div className="p-4 rounded-2xl bg-brand-green/20 text-brand-green group-hover:scale-110 transition-transform duration-500">
                <ImageIcon className="h-8 w-8" />
              </div>
              <span className="font-semibold text-lg">Share Update</span>
              <p className="text-xs text-muted-foreground text-center">Post media to your status</p>
            </button>
            
            <button 
              onClick={() => setStep('group')}
              className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-secondary/5 border border-white/5 hover:border-primary/50 hover:bg-primary/10 transition-all duration-500 shadow-lg hover:shadow-primary/20 hover:-translate-y-2 active:scale-95"
            >
              <div className="p-4 rounded-2xl bg-primary/20 text-primary group-hover:scale-110 transition-transform duration-500">
                <Users className="h-8 w-8" />
              </div>
              <span className="font-semibold text-lg">Group Chat</span>
              <p className="text-xs text-muted-foreground text-center">Start a conversation with others</p>
            </button>
          </div>
        )}

        {step === 'post' && <PostCreationForm onSuccess={() => handleOpenChange(false)} />}
        {step === 'group' && <GroupCreationForm onSuccess={() => handleOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
};
