import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import socket from '@/lib/socket';

export const useWebRTC = (roomId, userId) => {
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peersRef = useRef([]);
  const userStreamRef = useRef();
  const screenStreamRef = useRef();
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const hasJoinedRef = useRef(false); // Global ref to prevent duplicate joins across re-renders

  // Initialize local media stream
  useEffect(() => {
    if (!roomId || !userId) return;
    if (hasJoinedRef.current) {
      return;
    }
    
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        userStreamRef.current = stream;
        setLocalStream(stream);
        
        // Connect to socket after getting stream
        if (!socket.connected) {
          socket.connect();
        }
        
        // Only join room once
        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socket.emit('join-room', { roomId, userId });
        }
      } catch (error) {
        alert('Unable to access camera/microphone. Please grant permissions and reload the page.');
      }
    };

    getLocalStream();

    return () => {
      
      // Reset join flag
      hasJoinedRef.current = false;
      
      // Cleanup streams
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        userStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Disconnect peers
      peersRef.current.forEach(({ peer }) => {
        if (peer && !peer.destroyed) {
          peer.destroy();
        }
      });
      peersRef.current = [];
      
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [roomId, userId]);

  // Handle incoming peers
  useEffect(() => {
    if (!localStream) return;


    // When other users are already in the room
    const handleAllUsers = (users) => {
      
      // Check if same userId exists (multiple tabs/browsers with same account)
      const sameUser = users.find(u => u.userId === userId);
      if (sameUser) {
      }
      
      const newPeers = [];
      
      users.forEach(user => {
        // Check if peer already exists
        const existingPeer = peersRef.current.find(p => p.peerID === user.socketId);
        if (existingPeer) {
          return;
        }
        
        const peer = createPeer(user.socketId, socket.id, userStreamRef.current);
        
        const peerData = {
          peerID: user.socketId,
          peer,
          userId: user.userId
        };
        
        peersRef.current.push(peerData);
        newPeers.push(peerData);
      });
      
      if (newPeers.length > 0) {
        setPeers(prevPeers => {
          // Filter out any existing peers with same IDs to prevent duplicates
          const filtered = prevPeers.filter(p => 
            !newPeers.some(np => np.peerID === p.peerID)
          );
          return [...filtered, ...newPeers];
        });
      }
    };

    // When a new user joins
    const handleUserJoined = ({ signal, callerId, userId }) => {
      
      // Check if peer already exists
      const existingPeer = peersRef.current.find(p => p.peerID === callerId);
      if (existingPeer) {
        return;
      }
      
      const peer = addPeer(signal, callerId, userStreamRef.current);
      
      const peerData = {
        peerID: callerId,
        peer,
        userId: userId || callerId
      };
      
      peersRef.current.push(peerData);
      
      setPeers(prevPeers => {
        // Check if already in state
        if (prevPeers.some(p => p.peerID === callerId)) {
          return prevPeers;
        }
        return [...prevPeers, peerData];
      });
    };

    socket.on('all-users', handleAllUsers);
    socket.on('user-joined', handleUserJoined);

    // Receiving returned signal
    const handleReturnedSignal = ({ signal, id }) => {
      const item = peersRef.current.find(p => p.peerID === id);
      if (item && item.peer) {
        try {
          // Check if peer is in correct state before signaling
          if (!item.peer.destroyed) {
            item.peer.signal(signal);
          } else {
          }
        } catch (error) {
        }
      }
    };

    // User left
    const handleUserLeft = ({ userId }) => {
      const peerObj = peersRef.current.find(p => p.peerID === userId);
      if (peerObj && peerObj.peer && !peerObj.peer.destroyed) {
        peerObj.peer.destroy();
      }
      
      peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
      setPeers(prevPeers => prevPeers.filter(p => p.peerID !== userId));
    };

    socket.on('receiving-returned-signal', handleReturnedSignal);
    socket.on('user-left', handleUserLeft);

    // Handle screen sharing notifications
    socket.on('user-started-screen-share', ({ userId }) => {
      // The track update will come through the peer connection automatically
    });

    socket.on('user-stopped-screen-share', ({ userId }) => {
      // The track update will come through the peer connection automatically
    });

    return () => {
      socket.off('all-users', handleAllUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('receiving-returned-signal', handleReturnedSignal);
      socket.off('user-left', handleUserLeft);
      socket.off('user-started-screen-share');
      socket.off('user-stopped-screen-share');
    };
  }, [localStream]);

  // Create peer (initiator)
  const createPeer = (userToSignal, callerID, stream) => {
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // Add TURN servers for better NAT traversal
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10
      }
    });

    peer.on('signal', signal => {
      socket.emit('sending-signal', { userToSignal, callerId: callerID, signal });
    });

    peer.on('stream', remoteStream => {
      if (remoteStream.getVideoTracks().length > 0) {
        const track = remoteStream.getVideoTracks()[0];
      }
    });

    peer.on('connect', () => {
    });

    peer.on('error', (err) => {
    });

    peer.on('close', () => {
    });

    // Monitor ICE connection state
    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        if (peer._pc.iceConnectionState === 'disconnected') {
        }
        if (peer._pc.iceConnectionState === 'failed') {
        }
      };
      
      peer._pc.onconnectionstatechange = () => {
      };
    }

    return peer;
  };

  // Add peer (non-initiator)
  const addPeer = (incomingSignal, callerID, stream) => {
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // Add TURN servers for better NAT traversal
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10
      }
    });

    peer.on('signal', signal => {
      socket.emit('returning-signal', { signal, callerSocketId: callerID });
    });

    peer.on('stream', remoteStream => {
      if (remoteStream.getVideoTracks().length > 0) {
        const track = remoteStream.getVideoTracks()[0];
      }
    });

    peer.on('connect', () => {
    });

    peer.on('error', (err) => {
    });

    peer.on('close', () => {
    });

    // Monitor ICE connection state
    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        if (peer._pc.iceConnectionState === 'disconnected') {
        }
        if (peer._pc.iceConnectionState === 'failed') {
        }
      };
      
      peer._pc.onconnectionstatechange = () => {
      };
    }

    try {
      peer.signal(incomingSignal);
    } catch (error) {
    }

    return peer;
  };

  // Toggle mute
  const toggleMute = () => {
    if (userStreamRef.current) {
      const audioTrack = userStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (userStreamRef.current) {
      const videoTrack = userStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      setIsScreenSharing(true);

      // Get screen tracks
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      
      
      // Replace tracks for all peers
      for (const { peer, peerID } of peersRef.current) {
        if (!peer || !peer._pc) {
          continue;
        }

        
        try {
          // Get the video sender
          const senders = peer._pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          
          if (videoSender && videoSender.track) {
            const oldLabel = videoSender.track.label;
            
            // Replace the track
            await videoSender.replaceTrack(screenVideoTrack);
            
            // Update the stream in peer.streams array
            if (peer.streams && peer.streams[0]) {
              const stream = peer.streams[0];
              // Remove old video track
              const oldVideoTrack = stream.getVideoTracks()[0];
              if (oldVideoTrack) {
                stream.removeTrack(oldVideoTrack);
              }
              // Add new screen track
              stream.addTrack(screenVideoTrack);
            }
          } else {
          }
        } catch (err) {
        }
      }

      // Notify other users
      socket.emit('start-screen-share', { roomId, userId });

      // Handle stop
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission denied.');
      } else {
        alert('Unable to share screen. Please try again.');
      }
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      
      // Restore camera video track for all peers
      if (userStreamRef.current) {
        const videoTrack = userStreamRef.current.getVideoTracks()[0];
        
        peersRef.current.forEach(({ peer, peerID }) => {
          if (peer && peer._pc) {
            const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack).then(() => {
              }).catch(err => {
              });
            }
          }
        });
      }

      socket.emit('stop-screen-share', { roomId });
      
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  };

  // Start recording
  const startRecording = () => {
    try {
      recordedChunksRef.current = [];
      
      const stream = screenStream || localStream;
      
      if (!stream) {
        alert('No stream available to record');
        return;
      }

      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Download the recorded video
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `call-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert('Unable to start recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
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
  };
};
