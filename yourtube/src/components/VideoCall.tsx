import { useEffect, useRef } from 'react';
import { useWebRTC } from '@/lib/useWebRTC';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/AuthContext';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  Circle, 
  Phone,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Peer {
  peerID: string;
  peer: any;
  userId?: string;
}

interface VideoGridProps {
  peer: Peer;
  peerIndex: number;
}

const VideoGrid = ({ peer, peerIndex }: VideoGridProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (peer && peer.peer) {
      peer.peer.on('stream', (stream: MediaStream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      });
    }
  }, [peer]);

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <video 
        ref={ref} 
        autoPlay 
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
        User {peerIndex + 1}
      </div>
    </div>
  );
};

export default function VideoCall() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user } = useUser();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    peers,
    localStream,
    screenStream,
    isScreenSharing,
    isRecording,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording
  } = useWebRTC(roomId, user?.email || 'guest');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (localVideoRef.current && screenStream) {
      localVideoRef.current.srcObject = screenStream;
    } else if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [screenStream, localStream]);

  const endCall = () => {
    if (confirm('Are you sure you want to end the call?')) {
      router.push('/');
    }
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Invalid Room ID</h1>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h1 className="text-xl font-semibold">Video Call</h1>
            <p className="text-sm text-gray-400">Room: {roomId}</p>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 text-red-500">
              <Circle className="w-3 h-3 fill-current animate-pulse" />
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video 
              ref={localVideoRef}
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              You {isScreenSharing && '(Screen Sharing)'}
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera Off</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {peers.map((peer, index) => (
            <VideoGrid key={peer.peerID} peer={peer} peerIndex={index} />
          ))}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Mute/Unmute */}
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="w-14 h-14 rounded-full"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {/* Video On/Off */}
            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="w-14 h-14 rounded-full"
              title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>

            {/* Screen Share */}
            <Button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="w-14 h-14 rounded-full"
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>

            {/* Recording */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "secondary"}
              size="lg"
              className="w-14 h-14 rounded-full"
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <Circle className="w-6 h-6 fill-current" />
              ) : (
                <Download className="w-6 h-6" />
              )}
            </Button>

            {/* End Call */}
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
              title="End Call"
            >
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </Button>
          </div>

          {/* Controls Labels (Mobile) */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400 sm:hidden">
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            <span>{isVideoOff ? 'Camera On' : 'Camera Off'}</span>
            <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
            <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
            <span>End Call</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-blue-300 font-semibold mb-2">How to use:</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Share this room link with friends to join the call</li>
            <li>• Click screen share to share YouTube or any other content</li>
            <li>• Start recording to save the call locally (downloads as .webm)</li>
            <li>• Use mute/video controls to manage your audio and video</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
