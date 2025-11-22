
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/use-chat';
import Message from './Message';
import Composer from './Composer';
import { Sparkles, Settings2, Trash2, ArrowDown, Bot, Search, Calculator, Terminal, Car } from 'lucide-react';
import { cn } from '../../utils';
import { AGENTS } from '../../services/agents';
import { AgentId } from '../../types';

const Thread: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { 
    messages, 
    input, 
    setInput, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    activeAgentId,
    manualAgentId,
    setAgent,
    clearMessages,
    attachments,
    handleFileSelect,
    removeAttachment
  } = useChat();

  // Auto-scroll logic
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (bottomRef.current && lastMessage) {
      const isStreaming = lastMessage.isStreaming;
      // Use immediate scroll for streaming to reduce jitter, smooth otherwise
      bottomRef.current.scrollIntoView({ 
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Typing indicator logic
  useEffect(() => {
    if (input.length > 0) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
    } else {
      setIsTyping(false);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [input]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      clearMessages();
      setIsSettingsOpen(false);
      setShowScrollButton(false);
    }
  };

  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'researcher': return <Search size={14} />;
      case 'analyst': return <Calculator size={14} />;
      case 'coder': return <Terminal size={14} />;
      case 'carSpecialist': return <Car size={14} />;
      default: return <Bot size={14} />;
    }
  };

  const activeAgent = AGENTS[activeAgentId];

  return (
    <div className="flex h-full flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-4 z-20 relative">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900">Gemini Assistant</span>
          
          {/* Active Agent Badge */}
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-300 border border-transparent",
            activeAgent.color
          )}>
             {getAgentIcon(activeAgentId)}
             <span className="uppercase tracking-wide">{activeAgent.name}</span>
          </div>

          {isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 animate-in fade-in slide-in-from-left-2">
               <div className="flex gap-0.5">
                  <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
                  <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
                  <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-500" />
               </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={cn(
            "rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100",
            isSettingsOpen && "bg-zinc-100 text-zinc-900"
          )}
          aria-label="Settings"
        >
          <Settings2 size={18} />
        </button>
      </header>

      {/* Active Streaming Progress Line */}
      {isLoading && (
        <div className="absolute top-14 left-0 z-30 h-0.5 w-full overflow-hidden bg-transparent">
           <div className="h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Settings Panel */}
      <div 
        className={cn(
          "flex-shrink-0 overflow-hidden bg-zinc-50/50 border-b transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isSettingsOpen 
            ? "max-h-[500px] opacity-100 border-zinc-100" 
            : "max-h-0 opacity-0 border-transparent"
        )}
      >
        <div className={cn(
            "p-4 space-y-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isSettingsOpen ? "translate-y-0" : "-translate-y-4"
        )}>
           {/* Agent Selection */}
           <div>
             <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Assistant Mode
             </h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Auto Button */}
                <button
                  onClick={() => setAgent(null)}
                  className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left",
                      manualAgentId === null
                        ? "bg-white border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                  )}
                >
                  <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                      manualAgentId === null ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-500"
                  )}>
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <span className="block font-medium leading-tight">Auto</span>
                    <span className="text-[10px] opacity-70">Smart Orchestration</span>
                  </div>
                </button>

                {/* Agent Buttons */}
                {Object.values(AGENTS).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setAgent(agent.id)}
                      className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left",
                          manualAgentId === agent.id
                            ? "bg-white border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                      )}
                    >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                          manualAgentId === agent.id 
                            ? agent.color // Use agent color when selected
                            : "bg-zinc-100 text-zinc-500"
                        )}>
                            {getAgentIcon(agent.id)}
                        </div>
                        <div>
                          <span className="block font-medium leading-tight">{agent.name}</span>
                          <span className="text-[10px] opacity-70 truncate">{agent.description.split(' ')[0]}...</span>
                        </div>
                    </button>
                ))}
             </div>
           </div>

           <div className="h-px bg-zinc-200 w-full" />

           <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">
                  {manualAgentId 
                    ? `Fixed mode: All queries handled by ${AGENTS[manualAgentId].name}.` 
                    : "Auto mode: The agent is dynamically selected based on your request."}
              </p>
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                <span>Clear Chat</span>
              </button>
           </div>
        </div>
      </div>

      {/* Messages Container - Flex-1 to take available space */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50">
              <Sparkles size={20} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900">Welcome to Gemini Assistant</h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              I will orchestrate the best agent for your task.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-left text-sm text-zinc-600 max-w-sm w-full">
                <li className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-600">
                    <Search size={14} />
                  </span>
                  <span><b>Researcher:</b> Ask about current news or facts</span>
                </li>
                <li className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100">
                   <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-600">
                    <Calculator size={14} />
                  </span>
                  <span><b>Analyst:</b> Solve math problems</span>
                </li>
                <li className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100">
                   <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-600">
                    <Terminal size={14} />
                  </span>
                  <span><b>Engineer:</b> Write or debug code</span>
                </li>
                 <li className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100">
                   <span className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-600">
                    <Car size={14} />
                  </span>
                  <span><b>Auto Expert:</b> Search for cars for sale</span>
                </li>
            </ul>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom via flex layout, not sticky */}
      <div className="flex-shrink-0 bg-white p-4 pt-2 z-10 relative">
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white p-2 shadow-lg transition-all hover:bg-zinc-100 animate-in fade-in zoom-in duration-200"
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={20} className="text-zinc-600" />
          </button>
        )}
        <Composer
          input={input}
          setInput={setInput}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          attachments={attachments}
          onFileSelect={handleFileSelect}
          onRemoveAttachment={removeAttachment}
        />
      </div>
    </div>
  );
};

export default Thread;