import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  useChannelStateContext,
  useMessageContext,
  Avatar,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useThemeStore } from '../store/useThemeStore';
import { VideoIcon, MessageCircleIcon, PhoneIcon, SearchIcon, MoreVerticalIcon, CheckIcon, CheckCheckIcon, ArrowLeftIcon, BrainCircuitIcon } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import CustomChannelPreview from '../components/CustomChannelPreview';

const CustomEmptyState = () => (
   <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center space-y-6 bg-base-200/30">
      <div className="p-5 sm:p-6 bg-gradient-to-tr from-primary/20 to-secondary/20 text-primary rounded-full shadow-inner border border-primary/10 transition-transform hover:scale-105">
         <MessageCircleIcon size={40} className="opacity-80 sm:w-14 sm:h-14" />
      </div>
      <div className="space-y-2">
         <h3 className="text-xl sm:text-2xl font-black tracking-tight">Your Inbox is Empty</h3>
         <p className="opacity-60 text-sm max-w-[250px] mx-auto font-medium">Link with global learners to start your journey.</p>
      </div>
      <Link to="/search" className="btn btn-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform px-6 sm:px-8">
         Discover Partners
      </Link>
   </div>
);

const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
  const { channel } = useChannelStateContext();
  
  if (message.custom_type === 'call_event') {
    return (
      <div className="call-event-message">
          <span>{message.text}</span>
          <span className="text-[8px] opacity-40 ml-2">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
      </div>
    );
  }

  const renderStatus = () => {
    if (!isMyMessage) return null;
    
    // Check if the other user has read the message
    const otherMember = Object.values(channel.state.members).find(m => m.user.id !== message.user.id);
    const lastRead = otherMember ? channel.state.read[otherMember.user.id]?.last_read : null;
    const isRead = lastRead && new Date(lastRead) >= new Date(message.created_at);
    
    const isOtherUserOnline = otherMember?.user?.online;

    // We consider a message 'delivered' (two ticks) if the other user is online or has read the message.
    const isDelivered = isRead || (message.status === 'received' && isOtherUserOnline);
    
    // It's 'sent' (one tick) once it reaches the Stream server ('received' status) or locally sent
    const isSent = message.status === 'sending' || message.status === 'sent' || message.status === 'received';

    if (isRead) return <div className="message-status-ticks text-green-500 opacity-100 font-bold ml-1 flex items-center"><CheckCheckIcon size={16} color="currentColor" /></div>;
    if (isDelivered) return <div className="message-status-ticks opacity-60 ml-1 flex items-center"><CheckCheckIcon size={16} /></div>;
    if (isSent) return <div className="message-status-ticks opacity-60 ml-1 flex items-center"><CheckIcon size={16} /></div>;
    
    return null;
  };

  return (
    <div className={`flex flex-col mb-3 sm:mb-4 px-2 sm:px-0 ${isMyMessage ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 shadow-sm ${
            isMyMessage 
                ? 'bg-primary text-primary-content rounded-tr-none' 
                : 'bg-base-200 text-base-content rounded-tl-none'
        }`}>
            <p className="text-sm break-words">{message.text}</p>
            <div className={`flex items-center justify-end mt-1 gap-1`}>
                <span className="text-[9px] opacity-50">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {renderStatus()}
            </div>
        </div>
    </div>
  );
};

const CustomChannelHeader = (props) => {
  const navigate = useNavigate();
  const { channel } = useChannelStateContext();
  const { authUser, onBack } = props;
  
  const otherMember = Object.values(channel.state.members).find(m => m.user.id !== (authUser?._id?.toString() || authUser?.id?.toString()));
  const displayUser = otherMember?.user || {};

  const handleCall = async (type) => {
     if(otherMember) {
        try {
            await channel.sendMessage({
                text: `${type === 'video' ? '📹' : '📞'} Started a ${type} call`,
                custom_type: 'call_event',
                call_type: type
            });
        } catch (err) {
            console.error("Error sending call message:", err);
        }
        navigate(`/call?userId=${otherMember.user.id}&type=${type}`);
     }
  };

  return (
    <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-base-300 bg-base-100/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm lg:hidden mr-1">
             <ArrowLeftIcon size={20} />
          </button>
        )}
        <div className="relative shrink-0">
          <Avatar image={displayUser.image} name={displayUser.name || displayUser.id} size={36} />
          {displayUser.online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-base-100 rounded-full"></div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm leading-tight truncate">{displayUser.name || displayUser.id}</h3>
          <p className="text-[10px] opacity-50 font-medium">
            {displayUser.online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
         <button onClick={() => handleCall('audio')} className="btn btn-ghost btn-circle btn-sm text-primary"><PhoneIcon size={18} /></button>
         <button onClick={() => handleCall('video')} className="btn btn-ghost btn-circle btn-sm text-secondary"><VideoIcon size={18} /></button>
      </div>
    </div>
  );
};


export default function ChatPage({ authUser }) {
  const [chatClient, setChatClient] = useState(null);
  const { theme } = useThemeStore();
  const { id: channelOrUserId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let client;
    const initChat = async () => {
      try {
        const userId = authUser._id?.toString() || authUser.id?.toString();
        if(!userId || !authUser.streamToken || !authUser.streamApiKey) return;

        client = StreamChat.getInstance(authUser.streamApiKey);
        if (client.userID !== userId) {
            await client.connectUser({ 
              id: userId, 
              name: authUser.name || 'User',
              image: authUser.profilePic
            }, authUser.streamToken);
        }

        if (isMounted) setChatClient(client);
      } catch (error) {
        console.error("Error connecting to Stream:", error);
      }
    };
    initChat();
    return () => { isMounted = false; };
  }, [authUser]);

  if (!chatClient) return <div className="flex items-center justify-center min-h-[60vh]"><span className="loading loading-spinner text-primary"></span></div>;

  const userId = authUser._id?.toString() || authUser.id?.toString();
  const filters = { type: 'messaging', members: { $in: [userId] } };

  return (
    <div className="h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] bg-base-200/50 md:p-4 lg:p-6" data-theme={theme}>
      <div className="max-w-7xl mx-auto h-full glass md:rounded-3xl overflow-hidden shadow-2xl flex border border-base-300">
        <Chat client={chatClient} theme={`str-chat__theme-${theme === 'dark' ? 'dark' : 'light'}`}>
          {/* Sidebar - HIDDEN on mobile if channel is selected */}
          <div className={`${channelOrUserId ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/4 border-r border-base-300 h-full bg-base-100/50 backdrop-blur-md flex-col`}>
            <div className="p-3 sm:p-4 border-b border-base-300">
               <input type="text" placeholder="Search friends..." className="input input-sm w-full bg-base-200/50 rounded-xl" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
              <ChannelList 
                  filters={filters} 
                  sort={{ last_message_at: -1 }} 
                  Preview={(props) => <CustomChannelPreview {...props} authUser={authUser} />}
                  onSelect={(channel) => {
                      const other = Object.keys(channel.state.members).find(id => id !== userId);
                      navigate(`/chat/${other}`);
                  }}
              />
            </div>
          </div>

          {/* Chat Window - FULL WIDTH on mobile if channel is selected */}
          <div className={`${channelOrUserId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col h-full bg-base-100/30 backdrop-blur-sm`}>
            {channelOrUserId ? (
               <Channel Message={CustomMessage}>
                <Window>
                  <CustomChannelHeader authUser={authUser} onBack={() => navigate('/chat')} />
                  <MessageList />
                  <MessageInput grow />
                </Window>
                <Thread />
               </Channel>
            ) : (
               <div className="hidden lg:flex flex-col items-center justify-center w-full h-full opacity-30 text-center p-8">
                  <div className="p-6 bg-primary/10 rounded-full mb-4">
                    <BrainCircuitIcon size={64} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-black">Your Neural Links</h3>
                  <p className="font-medium mt-2 max-w-xs">Select a friend to start chatting and stay linked.</p>
               </div>
            )}
          </div>
        </Chat>
      </div>
    </div>
  );
}
