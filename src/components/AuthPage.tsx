import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LogIn, UserPlus, Chrome, Camera, X } from 'lucide-react';
import HamsterLoader from './HamsterLoader';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserData, ChatData, Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign up triggered');
    
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;
      
      // 2. Upload Profile Image if selected
      if (profileImage) {
        try {
          const res = await uploadToCloudinary(profileImage);
          photoURL = res.secure_url;
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          toast.error('Failed to upload profile image, using default instead.');
        }
      }
      
      // 3. Update Auth Profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });

      // 4. Create Firestore Document immediately for reliability
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        photoURL: photoURL,
        status: 'online',
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign in triggered');
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = error.message;
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid credentials. pleas creating account';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    setLoading(true);
    let authProvider;

    switch (provider) {
      case 'google':
        authProvider = new GoogleAuthProvider();
        break;
      default:
        return;
    }

    try {
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      
      // Ensure user document exists in Firestore (Handled by useAuth but doing it here too for immediate feedback)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        status: 'online',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success(`Successfully signed in with ${provider}!`);
    } catch (error: any) {
      console.error(`${provider} sign in error:`, error);
      let errorMessage = error.message;
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in process was cancelled';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = `${provider} sign-in is not enabled in Firebase Auth console.`;
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-all duration-1000",
      activeTab === 'login' 
        ? "kencode-login-bg" 
        : "bg-[#050505]"
    )} 
    style={{}}>
      
      {/* Login Background Overlay */}
      {activeTab === 'login' && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      )}

      {/* Midnight Sky Background for Sign Up */}
      {activeTab === 'signup' && (
        <div className="uiverse-midnight-sky">
          <div className="sky-canvas"></div>
          <div className="stars stars-1"></div>
          <div className="stars stars-2"></div>
          <div className="stars stars-3"></div>
          <div className="moon"></div>
          <div className="meteor m1"></div>
          <div className="meteor m2"></div>
          <div className="meteor m3"></div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
          <HamsterLoader />
        </div>
      )}

      <Card className={cn(
        "w-full max-w-md rounded-2xl relative z-10 transition-all duration-500",
        activeTab === 'signup' 
          ? "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(253,251,211,0.2)]" 
          : "bg-white/90 backdrop-blur-md shadow-2xl border-none"
      )}>
        <CardHeader className="text-center pt-10 pb-6">
          <CardTitle className={cn(
            "text-3xl font-bold mb-2 tracking-tight transition-colors",
            activeTab === 'signup' ? "text-white" : "text-gray-700"
          )}>
            {activeTab === 'login' ? 'Login' : 'Create Account'}
          </CardTitle>
          <CardDescription className={cn(
            "transition-colors",
            activeTab === 'signup' ? "text-white/60" : "text-gray-500"
          )}>
            {activeTab === 'login' ? 'Welcome back to the chat' : 'Join our cosmic community'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "grid w-full grid-cols-2 mb-8 rounded-xl p-1 transition-colors",
              activeTab === 'signup' ? "bg-white/10" : "bg-gray-200"
            )}>
              <TabsTrigger 
                value="login" 
                className={cn(
                  "rounded-lg transition-all",
                  activeTab === 'login' 
                    ? "bg-[#e0e0e0] shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] font-bold text-gray-700" 
                    : activeTab === 'signup' ? "text-white/60 hover:text-white" : "text-gray-500"
                )}
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className={cn(
                  "rounded-lg transition-all",
                  activeTab === 'signup' 
                    ? "bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)] font-bold text-white" 
                    : "text-gray-500"
                )}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-gray-600">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="!border-none !outline-none !bg-transparent text-[18px] text-[#555] px-[20px] py-[15px] shadow-[inset_8px_8px_8px_#cbced1,inset_-8px_-8px_8px_#ffffff] rounded-[25px] placeholder:text-[#555] placeholder:transition-all placeholder:duration-300 focus:placeholder:text-[#999] focus-visible:ring-0"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold text-gray-600">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    className="!border-none !outline-none !bg-transparent text-[18px] text-[#555] px-[20px] py-[15px] shadow-[inset_8px_8px_8px_#cbced1,inset_-8px_-8px_8px_#ffffff] rounded-[25px] placeholder:text-[#555] placeholder:transition-all placeholder:duration-300 focus:placeholder:text-[#999] focus-visible:ring-0"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-[#e0e0e0] text-gray-700 font-bold py-6 rounded-[25px] transition-all hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] border-none" disabled={loading}>
                  {loading ? 'Logging in...' : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" /> Login
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg cursor-pointer transition-transform hover:scale-105">
                      <AvatarImage src={imagePreview || ''} className="object-cover" />
                      <AvatarFallback className="bg-gray-100 text-gray-400">
                        {imagePreview ? 'Loading...' : <UserPlus className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="image-upload" className="absolute bottom-0 right-0 bg-[#00a884] p-2 rounded-full text-white cursor-pointer shadow-lg hover:bg-[#008f72] transition-colors">
                      <Camera className="h-4 w-4" />
                      <input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange}
                      />
                    </label>
                    {imagePreview && (
                      <button 
                        type="button"
                        onClick={() => { setProfileImage(null); setImagePreview(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Upload Profile Picture</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name" className={cn(
                    "text-sm font-bold ml-1 transition-colors",
                    activeTab === 'signup' ? "text-white/80" : "text-gray-600"
                  )}>
                    Display Name
                  </Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="John Doe" 
                    className={cn(
                      "rounded-xl transition-all",
                      activeTab === 'signup' 
                        ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus-visible:ring-white/20" 
                        : "border-gray-200 focus:border-[#00a884] focus-visible:ring-[#00a884]/20"
                    )}
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className={cn(
                    "text-sm font-bold ml-1 transition-colors",
                    activeTab === 'signup' ? "text-white/80" : "text-gray-600"
                  )}>
                    Email
                  </Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className={cn(
                      "rounded-xl transition-all",
                      activeTab === 'signup' 
                        ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus-visible:ring-white/20" 
                        : "border-gray-200 focus:border-[#00a884] focus-visible:ring-[#00a884]/20"
                    )}
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className={cn(
                    "text-sm font-bold ml-1 transition-colors",
                    activeTab === 'signup' ? "text-white/80" : "text-gray-600"
                  )}>
                    Password
                  </Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••"
                    className={cn(
                      "rounded-xl transition-all",
                      activeTab === 'signup' 
                        ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus-visible:ring-white/20" 
                        : "border-gray-200 focus:border-[#00a884] focus-visible:ring-[#00a884]/20"
                    )}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className={cn(
                  "w-full font-bold py-6 rounded-xl transition-all shadow-lg hover:shadow-xl mt-4",
                  activeTab === 'signup' 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "bg-[#00a884] hover:bg-[#008f72] text-white"
                )} disabled={loading}>
                  {loading ? 'Creating account...' : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className={cn(
                  "w-full",
                  activeTab === 'signup' ? "bg-white/10" : "bg-gray-200"
                )} />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-nowrap">
                <span className={cn(
                  "px-2 font-medium transition-colors",
                  activeTab === 'signup' ? "bg-transparent text-white/40" : "bg-white/90 text-gray-500"
                )}>
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <Button 
                variant="outline" 
                className={cn(
                  "rounded-xl h-14 border transition-all flex items-center justify-center gap-3",
                  activeTab === 'signup' 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" 
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                )}
                onClick={() => handleSocialSignIn('google')}
                disabled={loading}
              >
                <Chrome className="h-5 w-5 text-[#4285F4]" />
                <span className="font-semibold">Google</span>
              </Button>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className={cn(
          "flex flex-col text-center text-xs py-10 transition-colors rounded-b-2xl",
          activeTab === 'signup' ? "bg-white/5 text-white/40" : "bg-white text-gray-500"
        )}>
          <p>By joining, you agree to our Terms of Service.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
