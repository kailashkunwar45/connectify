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
import { VideoIcon, MessageCircleIcon, PhoneIcon, SearchIcon, MoreVerticalIcon, CheckIcon, CheckCheckIcon } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import CustomChannelPreview from '../components/CustomChannelPreview';

const CustomEmptyState = () => (
   <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 bg-base-200/30">
      <div className="p-6 bg-gradient-to-tr from-primary/20 to-secondary/20 text-primary rounded-full shadow-inner border border-primary/10 transition-transform hover:scale-105">
         <MessageCircleIcon size={56} className="opacity-80" />
      </div>
      <div className="space-y-2">
         <h3 className="text-2xl font-black tracking-tight">Your Inbox is Empty</h3>
         <p className="opacity-60 text-sm max-w-[250px] mx-auto font-medium">Connect with global learners to start your journey.</p>
      </div>
      <Link to="/search" className="btn btn-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform px-8">
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
    const isRead = message.readBy && message.readBy.length > 0;
    
    // Find the other member
    const otherMember = Object.values(channel.state.members).find(m => m.user.id !== message.user.id);
    const isOtherUserOnline = otherMember?.user?.online;

    // We consider a message 'delivered' (two ticks) if the other user is online or has read the message.
    const isDelivered = isRead || (message.status === 'received' && isOtherUserOnline);
    
    // It's 'sent' (one tick) once it reaches the Stream server ('received' status) or locally sent
    const isSent = message.status === 'sending' || message.status === 'sent' || message.status === 'received';

    if (isRead) return <div className="message-status-ticks text-success opacity-100"><CheckCheckIcon size={14} /></div>;
    if (isDelivered) return <div className="message-status-ticks"><CheckCheckIcon size={14} /></div>;
    if (isSent) return <div className="message-status-ticks"><CheckIcon size={14} /></div>;
    
    return null;
  };

  return (
    <div className={`flex flex-col mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
            isMyMessage 
                ? 'bg-primary text-primary-content rounded-tr-none' 
                : 'bg-base-200 text-base-content rounded-tl-none'
        }`}>
            <p className="text-sm">{message.text}</p>
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
  const { authUser } = props;
  
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
    <div className="flex items-center justify-between w-full px-4 py-3 border-b border-base-300 bg-base-100/50 backdrop-blur-sm sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar image={displayUser.image} name={displayUser.name || displayUser.id} size={40} />
          {displayUser.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-100 rounded-full"></div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-sm">{displayUser.name || displayUser.id}</h3>
          <p className="text-[10px] opacity-50 font-medium">
            {displayUser.online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      {otherMember && (
         <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCall('audio')} 
              className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 text-primary transition-all duration-300"
              title="Voice Call"
            >
               <PhoneIcon size={18} />
            </button>
            <button 
              onClick={() => handleCall('video')} 
              className="btn btn-ghost btn-circle btn-sm hover:bg-secondary/10 text-secondary transition-all duration-300"
              title="Video Call"
            >
               <VideoIcon size={18} />
            </button>
            <button className="btn btn-ghost btn-circle btn-sm opacity-40 hover:opacity-100 transition-opacity">
               <MoreVerticalIcon size={18} />
            </button>
         </div>
      )}
    </div>
  );
};


export default function ChatPage({ authUser }) {
  const [chatClient, setChatClient] = useState(null);
  const { theme } = useThemeStore();
  const { id: channelOrUserId } = useParams();

  useEffect(() => {
    let isMounted = true;
    let client;
    const initChat = async () => {
      try {
        const userId = authUser._id?.toString() || authUser.id?.toString();
        if(!userId || !authUser.streamToken || !authUser.streamApiKey) return;

        console.log("Connecting user to Stream:", userId);
        client = StreamChat.getInstance(authUser.streamApiKey);
        
        // Connect user if not already connected
        if (client.userID !== userId || client.tokenManager.token !== authUser.streamToken) {
            if (client.userID) await client.disconnectUser();
            await client.connectUser({
              id: userId,
              name: authUser.name || 'User',
              image: authUser.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default",
            }, authUser.streamToken);
        }

        // Handle direct navigation to a user/channel
        if (channelOrUserId && isMounted) {
            try {
              const channel = client.channel('messaging', {
                  members: [userId, channelOrUserId],
              });
              await channel.watch();
            } catch (err) {
              console.error("Error watching channel:", err);
            }
        }
        
        if (isMounted) {
            setChatClient(client);
        }
      } catch (error) {
        console.error("Error connecting to Stream:", error);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      setChatClient(null);
    };
  }, [authUser, channelOrUserId]);

  if (!chatClient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="opacity-60">Connecting to chat...</p>
      </div>
    );
  }

  const userId = authUser._id?.toString() || authUser.id?.toString();
  const filters = { type: 'messaging', members: { $in: [userId] } };
  const sort = { last_message_at: -1 };
  const options = { limit: 10 };

  return (
    <div className="h-[calc(100vh-64px)] bg-base-200/50 p-4 lg:p-6" data-theme={theme}>
      <div className="max-w-7xl mx-auto h-full glass rounded-3xl overflow-hidden shadow-2xl flex border border-base-300">
        <Chat client={chatClient} theme={`str-chat__theme-${theme === 'dark' ? 'dark' : 'light'}`}>
          <div className="w-1/3 lg:w-1/4 border-r border-base-300 h-full bg-base-100/50 backdrop-blur-md flex flex-col">
            <div className="p-4 border-b border-base-300">
               <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
                     <SearchIcon size={16} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search friends..." 
                    className="input input-sm w-full pl-10 bg-base-200/50 border-none rounded-xl focus:ring-1 focus:ring-primary/30"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
              <ChannelList 
                 filters={filters} 
                 sort={sort} 
                 options={options}
                 EmptyStateIndicator={CustomEmptyState}
                 Preview={(props) => <CustomChannelPreview {...props} authUser={authUser} />}
              />
            </div>
          </div>
          <div className="flex-1 h-full bg-base-100/30 backdrop-blur-sm">
            <Channel Message={CustomMessage}>
              <Window>
                <CustomChannelHeader authUser={authUser} />
                <MessageList />
                <MessageInput grow />
              </Window>
              <Thread />
            </Channel>
          </div>
        </Chat>
      </div>
    </div>
  );
}
