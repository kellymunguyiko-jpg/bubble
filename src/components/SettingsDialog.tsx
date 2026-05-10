import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, User, Bell, Shield, Palette, Lock } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { toast } from 'sonner';
import { AdminPanel } from './AdminPanel';

export function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6 mt-6">
          <div className="w-48 flex flex-col gap-2">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'admin', label: 'Admin', icon: Lock },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className="justify-start gap-3"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="flex-1 border-l pl-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your public profile information.</p>
                {/* Add profile fields here later */}
              </div>
            )}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy & Data</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Clear Video Cache</h4>
                    <p className="text-xs text-muted-foreground">Force clear YouTube video cache to resolve loading issues.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => {
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('yt_cache_')) localStorage.removeItem(key);
                    });
                    toast.success('YouTube cache cleared');
                  }}>Clear Cache</Button>
                </div>
              </div>
            )}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            )}
            {activeTab === 'admin' && <AdminPanel />}
            {/* Add other tab contents */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
