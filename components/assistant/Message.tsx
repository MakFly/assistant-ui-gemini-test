
import React, { memo, useState, useMemo } from 'react';
import { Message as MessageType } from '../../types';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { User, Bot, Copy, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  // Format timestamp
  const { timeString, fullDateString } = useMemo(() => {
    const date = new Date(message.timestamp || Date.now());
    return {
      timeString: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(date),
      fullDateString: new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date),
    };
  }, [message.timestamp]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Check if we should show the "Thinking" state
  // It appears when it's the AI, it's streaming, but no text content has arrived yet.
  const isThinking = !isUser && message.isStreaming && !message.content;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 py-4",
      )}
    >
      <div className={cn(
          "mx-auto flex w-full max-w-3xl gap-4 px-4",
          isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm",
              isUser
                ? "bg-zinc-100 border-zinc-200 text-zinc-600"
                : "bg-black border-black text-white"
            )}
          >
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
        </div>

        {/* Content Container */}
        <div className={cn(
            "flex flex-col max-w-[80%] min-w-0", 
            isUser ? "items-end" : "items-start"
        )}>
          
          {/* Name & Actions Row */}
          <div className={cn(
              "flex items-center gap-2 mb-1",
              isUser ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-xs font-medium text-zinc-400">
              {isUser ? 'You' : 'Assistant'}
            </span>
            
            {/* Timestamp */}
            <span 
              className="text-[10px] text-zinc-300 cursor-default select-none transition-colors hover:text-zinc-400" 
              title={fullDateString}
            >
              {timeString}
            </span>

            {!isUser && !message.isStreaming && !isThinking && (
               <button
                onClick={handleCopy}
                className="text-zinc-300 hover:text-zinc-500 transition-colors"
                title="Copy"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            )}
          </div>

          {/* Attachments (User side primarily) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={cn(
              "mb-2 flex flex-wrap gap-2",
              isUser ? "justify-end" : "justify-start"
            )}>
              {message.attachments.map((att, i) => {
                if (att.contentType.startsWith('image/')) {
                  return (
                    <div key={i} className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                      <img 
                        src={att.content} 
                        alt={att.name} 
                        className="h-48 max-w-[200px] object-cover"
                      />
                    </div>
                  );
                }
                // For non-image attachments that were sent, show a mini card
                return (
                   <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                      <div className="rounded bg-zinc-100 p-1 text-zinc-500">
                        <FileText size={14} />
                      </div>
                      <span className="text-xs font-medium text-zinc-700 max-w-[120px] truncate">{att.name}</span>
                   </div>
                );
              })}
            </div>
          )}

          {/* Message Bubble/Body */}
          {(message.content || (message.attachments && message.attachments.length > 0) || isThinking) && (
             <div className={cn(
                "relative text-sm w-full overflow-hidden", // Added w-full and overflow-hidden
                isUser 
                   ? "bg-zinc-100 text-zinc-900 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm" 
                   : "px-0 py-0 text-black" // AI messages are transparent to support rich markdown
            )}>
              {isThinking && !message.content ? (
                  // Thinking Indicator State
                  <div className="flex items-center gap-2 py-2 pl-1 text-zinc-400 animate-in fade-in duration-300">
                    <span className="italic">Thinking</span>
                    <div className="flex gap-0.5 pt-1">
                      <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                      <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                      <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400" />
                    </div>
                  </div>
              ) : (
                  <MarkdownRenderer 
                    content={message.content} 
                    isStreaming={message.isStreaming} 
                    variant={isUser ? 'user' : 'default'} 
                  />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(Message);
