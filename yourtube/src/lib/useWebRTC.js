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

  // Initialize local media stream
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        userStreamRef.current = stream;
        setLocalStream(stream);
        
        // Connect to socket after getting stream
        if (!socket.connected) {
          socket.connect();
        }
        
        socket.emit('join-room', { roomId, userId });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Unable to access camera/microphone. Please grant permissions.');
      }
    };

    getLocalStream();

    return () => {
      // Cleanup streams
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Disconnect peers
      peersRef.current.forEach(({ peer }) => {
        peer.destroy();
      });
      
      socket.disconnect();
    };
  }, [roomId, userId]);

  // Handle incoming peers
  useEffect(() => {
    if (!localStream) return;

    // When other users are already in the room
    socket.on('all-users', (users) => {
      const newPeers = [];
      
      users.forEach(user => {
        const peer = createPeer(user.socketId, socket.id, userStreamRef.current);
        
        peersRef.current.push({
          peerID: user.socketId,
          peer
        });
        
        newPeers.push({
          peerID: user.socketId,
          peer,
          userId: user.userId
        });
      });
      
      setPeers(newPeers);
    });

    // When a new user joins
    socket.on('user-joined', ({ signal, callerId }) => {
      const peer = addPeer(signal, callerId, userStreamRef.current);
      
      peersRef.current.push({
        peerID: callerId,
        peer
      });
      
      setPeers(prevPeers => [...prevPeers, {
        peerID: callerId,
        peer
      }]);
    });

    // Receiving returned signal
    socket.on('receiving-returned-signal', ({ signal, id }) => {
      const item = peersRef.current.find(p => p.peerID === id);
      if (item) {
        item.peer.signal(signal);
      }
    });

    // User left
    socket.on('user-left', ({ userId }) => {
      const peerObj = peersRef.current.find(p => p.peerID === userId);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      
      peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
      setPeers(prevPeers => prevPeers.filter(p => p.peerID !== userId));
    });

    return () => {
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('receiving-returned-signal');
      socket.off('user-left');
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
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      socket.emit('sending-signal', { userToSignal, callerId: callerID, signal });
    });

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
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      socket.emit('returning-signal', { signal, callerSocketId: callerID });
    });

    peer.signal(incomingSignal);

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
          cursor: 'always'
        },
        audio: false
      });

      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      setIsScreenSharing(true);

      // Replace video track for all peers
      const screenTrack = screenStream.getVideoTracks()[0];
      
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      socket.emit('start-screen-share', { roomId });

      // Handle when user stops sharing via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      alert('Unable to share screen. Please grant permissions.');
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      
      // Restore camera video track for all peers
      const videoTrack = userStreamRef.current.getVideoTracks()[0];
      
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

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
      console.error('Error starting recording:', error);
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
