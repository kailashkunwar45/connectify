import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VideoIcon, VideoOffIcon, PhoneIcon, MicIcon, MicOffIcon, PhoneOffIcon, UserIcon, Loader2Icon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import useAuthUser from "../hooks/useAuthUser";
import { useSocket } from "../hooks/useSocket";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function CallPage() {
  const { theme } = useThemeStore();
  const { authUser } = useAuthUser();
  const { socket } = useSocket(authUser?._id);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, active
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null); // Extra ref to always have access to current stream
  const [targetUserId, setTargetUserId] = useState("");
  const location = useLocation();

  const dialToneRef = useRef(null);
  const ringToneRef = useRef(null);

  // Initialize audio refs safely
  useEffect(() => {
    dialToneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    ringToneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    dialToneRef.current.loop = true;
    ringToneRef.current.loop = true;

    return () => {
      // Cleanup audio on unmount
      if (dialToneRef.current) {
        dialToneRef.current.pause();
        dialToneRef.current = null;
      }
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current = null;
      }
    };
  }, []);

  // Guarantee camera/mic release on unmount or page navigation
  useEffect(() => {
    return () => {
      releaseAllMedia();
    };
  }, []);

  const releaseAllMedia = useCallback(() => {
    // Stop all tracks from the ref (always up to date)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }
    // Also stop from state
    setLocalStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      return null;
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, []);

  const endCall = useCallback((emit = true) => {
    if (emit && (targetUserId || incomingCall?.from)) {
      socket?.emit("end-call", { to: targetUserId || incomingCall?.from });
    }
    
    // Release ALL media tracks immediately
    releaseAllMedia();

    setRemoteStream(null);
    setCallStatus("idle");
    setIncomingCall(null);
    setIsCalling(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsSpeakerOff(false);
    
    if (dialToneRef.current) {
      dialToneRef.current.pause();
      dialToneRef.current.currentTime = 0;
    }
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }

    toast("Call ended");
  }, [targetUserId, incomingCall, socket, releaseAllMedia]);

  const initPeerConnection = (otherUserId, stream) => {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: otherUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current = pc;
    return pc;
  };

  const adoptAnswer = async (answer) => {
    if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("active");
        if (dialToneRef.current) {
          dialToneRef.current.pause();
          dialToneRef.current.currentTime = 0;
        }
    }
  };

  const addIce = async (candidate) => {
    if (peerConnection.current && candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const requestMedia = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
    } catch (err) {
        toast.error("Could not access camera/microphone");
        console.error(err);
        return null;
    }
  };

  const acceptIncomingCall = async (callData) => {
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
    
    // Request camera/mic ONLY when accepting the call
    const stream = await requestMedia();
    if (!stream) return;

    const pc = initPeerConnection(callData.from, stream);
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer-call", { to: callData.from, answer });
    setCallStatus("active");
  };

  useEffect(() => {
    if (!socket || !authUser) return;

    const handleIncomingCall = ({ from, offer, name, profilePic }) => {
      const callData = { from, offer, name, profilePic };
      setIncomingCall(callData);
      if (ringToneRef.current) {
        ringToneRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
      
      const params = new URLSearchParams(location.search);
      if (params.get('accept') === 'true' && params.get('userId') === from) {
         setTimeout(() => acceptIncomingCall(callData), 1000);
      }
    };

    const handleCallEnded = () => {
      endCall(false);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", ({ answer }) => adoptAnswer(answer));
    socket.on("ice-candidate", ({ candidate }) => addIce(candidate));
    socket.on("call-ended", handleCallEnded);

    // Handle initial target from URL
    const params = new URLSearchParams(location.search);
    const userIdFromUrl = params.get('userId');
    if (userIdFromUrl) setTargetUserId(userIdFromUrl);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended", handleCallEnded);
      // Release media when leaving the call page
      releaseAllMedia();
    };
  }, [socket, authUser, location.search]);

  const startCall = async () => {
    if (!targetUserId) return toast.error("Please enter a User ID to call");
    
    // Request camera/mic ONLY when making a call
    const stream = await requestMedia();
    if (!stream) return;

    setIsCalling(true);
    setCallStatus("calling");
    if (dialToneRef.current) {
      dialToneRef.current.play().catch(e => console.log("Dial tone failed:", e));
    }
    
    const pc = initPeerConnection(targetUserId, stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user", {
      to: targetUserId,
      from: authUser._id,
      offer,
      name: authUser.name,
      profilePic: authUser.profilePic
    });
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => { track.enabled = !track.enabled; });
      setIsMuted(!isMuted);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => { track.enabled = !track.enabled; });
      setIsCameraOff(!isCameraOff);
    }
  };

  // Toggle speaker (remote audio)
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOff(!isSpeakerOff);
    }
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-8 bg-base-100/50" data-theme={theme}>
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-3 sm:gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gradient">LinkIt Video</h1>
            <p className="opacity-60 text-xs sm:text-sm">Neural network signaling for learners</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs opacity-50 bg-base-200 p-1.5 sm:p-2 rounded-xl">
              My ID: <span className="font-mono text-primary font-bold truncate max-w-[100px] sm:max-w-none">{authUser?._id}</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                 type="text" 
                 placeholder="Enter Friend ID..." 
                 className="input input-sm input-bordered rounded-xl w-32 sm:w-48 shadow-inner text-xs sm:text-sm"
                 value={targetUserId}
                 onChange={(e) => setTargetUserId(e.target.value)}
                 disabled={callStatus !== "idle"}
              />
              {callStatus === "idle" && (
                  <button onClick={startCall} className="btn btn-primary btn-sm rounded-xl px-4 sm:px-6 shadow-lg shadow-primary/20">
                      <PhoneIcon size={16} /> <span className="hidden sm:inline">Link Up</span>
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 min-h-[250px] sm:min-h-[400px]">
          
          {/* Local Video */}
          <div className="relative glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral/10 aspect-video lg:aspect-auto border border-white/5">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-white text-[10px] sm:text-xs font-bold border border-white/10">
              <UserIcon size={14} className="text-primary" /> You
              {isMuted && <MicOffIcon size={12} className="text-error ml-1" />}
              {isCameraOff && <VideoOffIcon size={12} className="text-error ml-1" />}
            </div>
            {!localStream && callStatus === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-300/50 text-center p-4">
                    <VideoIcon className="text-primary opacity-30 mb-2" size={48} />
                    <p className="text-xs sm:text-sm opacity-40 font-bold">Camera activates when call starts</p>
                </div>
            )}
            {!localStream && callStatus !== "idle" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2Icon className="animate-spin text-primary" size={48} />
                </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral/20 aspect-video lg:aspect-auto border border-white/5">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="avatar placeholder animate-pulse">
                        <div className="bg-primary/20 text-primary border border-primary/20 rounded-full w-20 sm:w-24">
                            <span className="text-2xl sm:text-3xl">?</span>
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-50 font-black tracking-widest uppercase">
                        {callStatus === "calling" ? "Ringing..." : "Waiting..."}
                    </p>
                </div>
            )}
            {remoteStream && (
                <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 flex items-center gap-2 bg-primary/40 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-white text-[10px] sm:text-xs font-bold border border-white/10">
                    <UserIcon size={14} /> Connected
                </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center py-3 sm:py-6">
            <div className="bg-base-200/80 backdrop-blur-3xl p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-4 sm:gap-8 px-6 sm:px-12 transition-all">
                {/* Mic Toggle */}
                <button 
                  onClick={toggleMic} 
                  className={`btn btn-circle btn-sm sm:btn-md transition-all duration-300 ${
                    isMuted 
                      ? 'btn-error shadow-lg shadow-error/30' 
                      : 'btn-ghost hover:bg-primary/10 hover:text-primary'
                  }`}
                  disabled={callStatus === "idle"}
                >
                    {isMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
                </button>
                
                {/* Camera Toggle */}
                <button 
                  onClick={toggleCamera} 
                  className={`btn btn-circle btn-sm sm:btn-md transition-all duration-300 ${
                    isCameraOff 
                      ? 'btn-error shadow-lg shadow-error/30' 
                      : 'btn-ghost hover:bg-secondary/10 hover:text-secondary'
                  }`}
                  disabled={callStatus === "idle"}
                >
                    {isCameraOff ? <VideoOffIcon size={20} /> : <VideoIcon size={20} />}
                </button>
                
                {/* Speaker Toggle */}
                <button 
                  onClick={toggleSpeaker} 
                  className={`btn btn-circle btn-sm sm:btn-md transition-all duration-300 ${
                    isSpeakerOff 
                      ? 'btn-warning shadow-lg shadow-warning/30' 
                      : 'btn-ghost hover:bg-info/10 hover:text-info'
                  }`}
                  disabled={callStatus === "idle"}
                >
                    {isSpeakerOff ? <VolumeXIcon size={20} /> : <Volume2Icon size={20} />}
                </button>
                
                {/* Call / End Call */}
                {callStatus !== "idle" ? (
                    <button onClick={() => endCall(true)} className="btn btn-circle btn-error btn-sm sm:btn-lg shadow-xl shadow-error/40 scale-110 active:scale-95 transition-transform">
                        <PhoneOffIcon size={24} />
                    </button>
                ) : (
                    <button onClick={startCall} className="btn btn-circle btn-primary btn-sm sm:btn-lg shadow-xl shadow-primary/40 scale-110 active:scale-95 transition-transform">
                        <PhoneIcon size={24} />
                    </button>
                )}
            </div>
        </div>

        {/* Incoming Call Modal */}
        <AnimatePresence>
            {incomingCall && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
                >
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-sm w-full text-center space-y-6 sm:space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20"
                    >
                        <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <div className="absolute inset-[-8px] bg-primary/10 rounded-full animate-pulse" />
                            <div className="relative avatar z-10">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 mx-auto overflow-hidden">
                                    <img src={incomingCall.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt="Avatar" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{incomingCall.name}</h2>
                            <p className="opacity-60 text-xs sm:text-sm font-medium mt-2 animate-pulse">📞 Incoming Call...</p>
                        </div>
                        <div className="flex justify-center gap-4 sm:gap-6">
                             <button onClick={() => { endCall(true); setIncomingCall(null); }} className="btn btn-circle btn-error btn-md sm:btn-lg shadow-2xl shadow-error/30 hover:scale-110 transition-transform">
                                <PhoneOffIcon size={24} />
                             </button>
                             <button onClick={() => acceptIncomingCall(incomingCall)} className="btn btn-circle btn-success btn-md sm:btn-lg shadow-2xl shadow-success/30 hover:scale-110 transition-transform animate-bounce">
                                <PhoneIcon size={24} />
                             </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
