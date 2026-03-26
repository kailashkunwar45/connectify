import React, { useEffect, useRef, useState } from 'react';
import { VideoIcon, PhoneIcon, MicIcon, PhoneOffIcon, UserIcon, Loader2Icon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import useAuthUser from "../hooks/useAuthUser";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const SOCKET_URL = import.meta.env.MODE === "production" ? "" : (import.meta.env.VITE_SOCKET_URL || "http://localhost:5001");

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function CallPage() {
  const { theme } = useThemeStore();
  const { authUser } = useAuthUser();
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, active
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [targetUserId, setTargetUserId] = useState("");
  const location = useLocation();

  const dialToneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"));
  const ringToneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"));

  useEffect(() => {
    dialToneRef.current.loop = true;
    ringToneRef.current.loop = true;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) setTargetUserId(userId);
  }, [location]);

  useEffect(() => {
    if (!authUser) return;

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("connect", () => {
      s.emit("register", authUser._id);
    });

    s.on("incoming-call", ({ from, offer, name, profilePic }) => {
      setIncomingCall({ from, offer, name, profilePic });
      ringToneRef.current.play().catch(e => console.log("Audio play failed:", e));
    });

    s.on("call-answered", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("active");
      }
    });

    s.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    s.on("call-ended", () => {
      endCall(false);
    });

    // Get user media on mount
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(err => {
        toast.error("Could not access camera/microphone", { id: "camera-error" });
        console.error(err);
      });

    return () => {
      s.disconnect();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, [authUser]);

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);
    
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: targetUserId || incomingCall?.from, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async () => {
    if (!targetUserId) return toast.error("Please enter a User ID to call");
    
    setIsCalling(true);
    setCallStatus("calling");
    dialToneRef.current.play().catch(e => console.log("Dial tone failed:", e));
    
    const pc = initPeerConnection();
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

  const acceptCall = async () => {
    ringToneRef.current.pause();
    ringToneRef.current.currentTime = 0;
    
    const pc = initPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer-call", { to: incomingCall.from, answer });
    setCallStatus("active");
    setIncomingCall(null);
  };

  const endCall = (emit = true) => {
    if (emit && (targetUserId || incomingCall?.from)) {
      socket.emit("end-call", { to: targetUserId || incomingCall?.from });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    setRemoteStream(null);
    setCallStatus("idle");
    setIncomingCall(null);
    setIsCalling(false);
    
    dialToneRef.current.pause();
    dialToneRef.current.currentTime = 0;
    ringToneRef.current.pause();
    ringToneRef.current.currentTime = 0;

    toast("Call ended");
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-8 bg-base-100/50" data-theme={theme}>
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gradient">Video Connect</h1>
            <p className="opacity-60 text-sm">Signaled peer-to-peer communication</p>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-50 bg-base-200 p-2 rounded-xl">
            My ID: <span className="font-mono text-primary font-bold">{authUser?._id}</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
               type="text" 
               placeholder="Enter Friend ID..." 
               className="input input-sm input-bordered rounded-xl w-48 shadow-inner"
               value={targetUserId}
               onChange={(e) => setTargetUserId(e.target.value)}
               disabled={callStatus !== "idle"}
            />
            {callStatus === "idle" && (
                <button onClick={startCall} className="btn btn-primary btn-sm rounded-xl px-6 shadow-lg shadow-primary/20">
                    <PhoneIcon size={16} /> Call
                </button>
            )}
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          
          {/* Local Video */}
          <div className="relative glass rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral/10 aspect-video lg:aspect-auto border border-white/5">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl text-white text-xs font-bold border border-white/10">
              <UserIcon size={14} className="text-primary" /> You
            </div>
            {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2Icon className="animate-spin text-primary" size={48} />
                </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative glass rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral/20 aspect-video lg:aspect-auto border border-white/5">
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
                        <div className="bg-primary/20 text-primary border border-primary/20 rounded-full w-24">
                            <span className="text-3xl">?</span>
                        </div>
                    </div>
                    <p className="text-sm opacity-50 font-black tracking-widest uppercase">
                        {callStatus === "calling" ? "Ringing..." : "Waiting..."}
                    </p>
                </div>
            )}
            {remoteStream && (
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-primary/40 backdrop-blur-xl px-4 py-2 rounded-2xl text-white text-xs font-bold border border-white/10">
                    <UserIcon size={14} /> Connected
                </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center py-6">
            <div className="bg-base-200/80 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-8 px-12 transition-all">
                <button className="btn btn-circle btn-ghost hover:bg-primary/10 hover:text-primary transition-all duration-300">
                    <MicIcon size={24} />
                </button>
                <button className="btn btn-circle btn-ghost hover:bg-secondary/10 hover:text-secondary transition-all duration-300">
                    <VideoIcon size={24} />
                </button>
                {callStatus !== "idle" ? (
                    <button onClick={() => endCall(true)} className="btn btn-circle btn-error btn-lg shadow-xl shadow-error/40 scale-110 active:scale-95 transition-transform">
                        <PhoneOffIcon size={28} />
                    </button>
                ) : (
                    <button onClick={startCall} className="btn btn-circle btn-primary btn-lg shadow-xl shadow-primary/40 scale-110 active:scale-95 transition-transform">
                        <PhoneIcon size={28} />
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
                        className="glass rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20"
                    >
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <div className="relative avatar z-10">
                                <div className="w-32 h-32 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 mx-auto overflow-hidden">
                                    <img src={incomingCall.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt="Avatar" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">{incomingCall.name}</h2>
                            <p className="opacity-60 text-sm font-medium mt-2">Incoming Video Call</p>
                        </div>
                        <div className="flex justify-center gap-6">
                             <button onClick={() => setIncomingCall(null)} className="btn btn-circle btn-error btn-lg shadow-2xl shadow-error/30 hover:scale-110 transition-transform">
                                <PhoneOffIcon size={28} />
                             </button>
                             <button onClick={acceptCall} className="btn btn-circle btn-success btn-lg shadow-2xl shadow-success/30 hover:scale-110 transition-transform">
                                <PhoneIcon size={28} />
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
