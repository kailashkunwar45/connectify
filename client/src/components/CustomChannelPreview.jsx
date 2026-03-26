import React from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';

const CustomChannelPreview = (props) => {
  const { channel, focused, setActiveChannel, authUser } = props;
  const { channel: activeChannel } = useChatContext();

  const selected = channel.id === activeChannel?.id;

  const members = channel.state?.members 
    ? Object.values(channel.state.members).filter(
        (m) => m.user?.id !== authUser?._id?.toString() && m.user?.id !== authUser?.id?.toString()
      )
    : [];

  const displayUser = members[0]?.user || {};
  const displayName = displayUser.name || displayUser.id || 'Chat';
  const displayImage = displayUser.image || "https://api.dicebear.com/9.x/avataaars/svg?seed=default";

  return (
    <div
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-base-300/40 rounded-2xl mx-2 mb-1 ${
        selected ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'
      }`}
      onClick={() => setActiveChannel(channel)}
    >
      <div className="relative">
        <Avatar 
          image={displayImage} 
          name={displayName} 
          size={48} 
        />
        {displayUser.online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-base-100 rounded-full"></div>
        )}
      </div>
      <div className="flex-1 ml-3 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h4 className={`font-bold truncate text-sm ${selected ? 'text-primary' : 'text-base-content'}`}>
            {displayName}
          </h4>
          <span className="text-[10px] opacity-40 whitespace-nowrap ml-1 font-medium">
            {channel.state.last_message_at ? new Date(channel.state.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="text-xs opacity-50 truncate font-medium mt-0.5">
          {channel.state.messages && channel.state.messages.length > 0 
            ? channel.state.messages[channel.state.messages.length - 1]?.text 
            : 'No messages yet'
          }
        </p>
      </div>
    </div>
  );
};

export default CustomChannelPreview;
