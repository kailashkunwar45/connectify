import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, PhoneOffIcon, VideoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import useAuthUser from '../hooks/useAuthUser';

const CallNotification = () => {
    const { authUser } = useAuthUser();
    const { socket } = useSocket(authUser?._id);
    const [incomingCall, setIncomingCall] = useState(null);
    const navigate = useNavigate();
    const ringToneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"));

    useEffect(() => {
        if (!socket) return;

        ringToneRef.current.loop = true;

        const handleIncomingCall = ({ from, offer, name, profilePic }) => {
            // Only show notification if not already in a call or on the call page
            if (window.location.pathname !== '/call') {
                setIncomingCall({ from, offer, name, profilePic });
                ringToneRef.current.play().catch(e => console.log("Audio play failed:", e));
            }
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-ended', () => {
            setIncomingCall(null);
            ringToneRef.current.pause();
            ringToneRef.current.currentTime = 0;
        });

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-ended');
        };
    }, [socket]);

    const handleAccept = () => {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
        navigate(`/call?userId=${incomingCall.from}&accept=true`);
        setIncomingCall(null);
    };

    const handleDecline = () => {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
        socket.emit('end-call', { to: incomingCall.from });
        setIncomingCall(null);
    };

    return (
        <AnimatePresence>
            {incomingCall && (
                <motion.div 
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-md"
                >
                    <div className="glass rounded-[2rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-white/20 flex items-center justify-between gap-4 backdrop-blur-2xl">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                <div className="w-14 h-14 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 overflow-hidden relative z-10">
                                    <img src={incomingCall.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt="Caller" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight">{incomingCall.name}</h3>
                                <p className="text-xs opacity-60 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <VideoIcon size={12} className="text-primary" /> Incoming Video...
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleDecline}
                                className="btn btn-circle btn-error btn-sm shadow-lg shadow-error/20 hover:scale-110 active:scale-95 transition-all"
                            >
                                <PhoneOffIcon size={16} />
                            </button>
                            <button 
                                onClick={handleAccept}
                                className="btn btn-circle btn-success btn-sm shadow-lg shadow-success/20 hover:scale-110 active:scale-95 transition-all animate-bounce"
                            >
                                <PhoneIcon size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CallNotification;
