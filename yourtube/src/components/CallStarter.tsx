import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CallStarterProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function CallStarter({ variant = "default", size = "default", className = "" }: CallStarterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  // Get current room ID if already in a call
  const currentRoomId = router.pathname.startsWith('/call/') ? router.query.roomId as string : null;

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 12);
    return id;
  };

  const createNewCall = () => {
    const newRoomId = generateRoomId();
    setIsOpen(false);
    router.push(`/call/${newRoomId}`);
  };

  const joinCall = () => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      alert('Please enter a room ID');
      return;
    }
    
    if (currentRoomId && trimmedRoomId === currentRoomId) {
      alert('You are already in this room!');
      return;
    }
    
    setIsOpen(false);
    router.push(`/call/${trimmedRoomId}`);
  };

  const copyCurrentRoomLink = () => {
    if (currentRoomId) {
      const link = `${window.location.origin}/call/${currentRoomId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isIconOnly = size === "icon";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setRoomId('');
        setCopied(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} title="Start Video Call">
          <Video className={isIconOnly ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 mr-2"} />
          {!isIconOnly && "Start Call"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Video Call</DialogTitle>
          <DialogDescription>
            {currentRoomId ? 'Share this room or create a new one' : 'Create a new call room or join an existing one'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* If already in a call, show share options first */}
          {currentRoomId && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📹 You're in a call!
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Share this link to invite others:
              </p>
              <div className="flex gap-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/call/${currentRoomId}`}
                  readOnly
                  className="text-xs bg-white dark:bg-gray-900"
                />
                <Button
                  onClick={copyCurrentRoomLink}
                  size="sm"
                  variant="outline"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Create New Call */}
          <div>
            <Button 
              onClick={createNewCall}
              className="w-full"
              size="lg"
            >
              <Video className="w-5 h-5 mr-2" />
              {currentRoomId ? 'Start New Call' : 'Create New Call'}
            </Button>
          </div>

          {!currentRoomId && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or join existing
                  </span>
                </div>
              </div>

              {/* Join Existing Call */}
              <div className="space-y-2">
                <Input
                  placeholder="Enter room ID (e.g., abc123xyz)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinCall()}
                />
                <Button 
                  onClick={joinCall}
                  disabled={!roomId.trim()}
                  className="w-full"
                  variant="secondary"
                >
                  Join Call
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Share your screen during the call to watch YouTube videos together!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
