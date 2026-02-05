import { useEffect, useRef, useState } from 'react';
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
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!peer || !peer.peer) return;

    const handleStream = (stream: MediaStream) => {
      
      if (ref.current && stream) {
        // Ensure we're not accidentally using local stream
        ref.current.srcObject = stream;
        
        // Set stream as active immediately when received
        setIsStreamActive(true);
        setHasError(false);
        
        // Force play to overcome autoplay restrictions
        ref.current.play().catch(err => {
        });
        
        // Check if video track is enabled
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          
          // Monitor track state changes
          videoTrack.onended = () => {
            setIsStreamActive(false);
          };
          
          videoTrack.onmute = () => {
          };
          
          videoTrack.onunmute = () => {
          };
        } else {
        }
      }
    };

    const handleError = (err: Error) => {
      setHasError(true);
    };

    const handleTrack = (event: RTCTrackEvent) => {
      
      // When a track is added/replaced, update the video element
      if (event.streams && event.streams[0]) {
        
        if (ref.current) {
          // Important: Always update srcObject when track changes
          ref.current.srcObject = event.streams[0];
          
          // Set stream as active immediately
          setIsStreamActive(true);
          setHasError(false);
          
          // Force play to ensure video displays
          ref.current.play().catch(err => {
          });
        }
      }
    };

    // Check if peer already has a stream
    if (peer.peer.streams && peer.peer.streams.length > 0) {
      handleStream(peer.peer.streams[0]);
    }

    // Listen for stream events (initial connection)
    peer.peer.on('stream', handleStream);
    peer.peer.on('error', handleError);

    // Listen for track events (screen share, track replacement)
    if (peer.peer._pc) {
      peer.peer._pc.addEventListener('track', handleTrack);
    }

    return () => {
      if (peer.peer) {
        peer.peer.off('stream', handleStream);
        peer.peer.off('error', handleError);
        if (peer.peer._pc) {
          peer.peer._pc.removeEventListener('track', handleTrack);
        }
      }
    };
  }, [peer]);

  return (
    <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 hover:border-purple-500/60 transition-all">
      <video 
        ref={ref} 
        autoPlay 
        playsInline
        muted={false}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-3 left-3 bg-purple-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium shadow-lg">
        {peer.userId ? (peer.userId.split('@')[0].split(/[0-9]/)[0] || `Participant ${peerIndex + 1}`) : `Participant ${peerIndex + 1}`}
      </div>
      {!isStreamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center text-white">
            {hasError ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3 border-2 border-red-500/50">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-red-400 text-sm">Connection Failed</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3 border-2 border-purple-500/50 animate-pulse">
                  <Video className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-sm opacity-70">Connecting...</p>
              </>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
          {peer.userId || `User ${peerIndex + 1}`}
        </div>
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

  const totalParticipants = peers.length + 1; // +1 for local user
  const isConnected = localStream !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Video Call</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-gray-400">Room: <span className="text-blue-400 font-mono">{roomId}</span></p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">
                  {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500 px-4 py-2 rounded-full">
              <Circle className="w-3 h-3 fill-current text-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-500">Recording</span>
            </div>
          )}
        </div>

        {/* Video Grid */}
        <div className={`grid gap-4 mb-6 ${
          totalParticipants === 1 ? 'grid-cols-1' :
          totalParticipants === 2 ? 'grid-cols-1 md:grid-cols-2' :
          totalParticipants <= 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {/* Local Video */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500/30 hover:border-blue-500/60 transition-all">
            <video 
              ref={localVideoRef}
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium shadow-lg">
              You {isScreenSharing && '📺'}
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {isMuted && (
                <div className="bg-red-500/90 backdrop-blur-sm p-1.5 rounded-full">
                  <MicOff className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {user && (
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
                  {user.name || user.email || 'Guest'}
                </div>
              )}
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3 border-2 border-blue-500/50">
                    <VideoOff className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium">Camera Off</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {peers.map((peer, index) => (
            <VideoGrid 
              key={`peer-${peer.peerID}-${index}`} 
              peer={peer} 
              peerIndex={index} 
            />
          ))}
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-4">
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

        {/* Instructions & Share Link */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-700/50 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              How to use:
            </h3>
            <ul className="text-blue-200 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Share this room link with friends to join the call</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Click screen share to share YouTube or any other content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Start recording to save the call locally (downloads as .webm)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Use mute/video controls to manage your audio and video</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border border-purple-700/50 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
              </svg>
              Share Room Link:
            </h3>
            <div className="bg-black/40 rounded-lg p-3 mb-3 border border-purple-700/30">
              <p className="text-purple-200 text-sm font-mono break-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </p>
            </div>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Room link copied to clipboard!');
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              📋 Copy Room Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
