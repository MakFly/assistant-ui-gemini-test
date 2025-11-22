import React, { useState, useCallback } from 'react';
import { Message, Attachment, AgentId } from '../types';
import { AGENTS, orchestrate } from '../services/agents';
import { GoogleGenAI, Content, Part, FunctionCall, FunctionResponse } from "@google/genai";

interface UseChatOptions {
  initialMessages?: Message[];
}

export function useChat({ initialMessages = [] }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('generalist');
  const [manualAgentId, setManualAgentId] = useState<AgentId | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          // Store base64 without prefix for API, with prefix for UI if needed
          setAttachments((prev) => [...prev, {
            name: file.name,
            contentType: file.type,
            content: content, 
            size: file.size
          }]);
        }
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (!manualAgentId) {
        setActiveAgentId('generalist');
    }
  }, [manualAgentId]);

  const setAgent = useCallback((id: AgentId | null) => {
    setManualAgentId(id);
    if (id) {
        setActiveAgentId(id);
    }
  }, []);

  const append = useCallback(async (message: { role: 'user' | 'model'; content: string; attachments?: Attachment[] }) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: message.role,
      content: message.content,
      attachments: message.attachments,
      timestamp: Date.now(),
    };

    // Update UI with user message
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Determine Agent
    let selectedAgentId: AgentId = 'generalist';
    if (manualAgentId) {
        selectedAgentId = manualAgentId;
    } else {
        try {
            selectedAgentId = await orchestrate(message.content, messages);
            setActiveAgentId(selectedAgentId);
        } catch (e) {
            console.warn("Orchestration skipped/failed:", e);
        }
    }
    const agent = AGENTS[selectedAgentId];

    // Create placeholder for AI response
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        agentId: selectedAgentId
      },
    ]);

    try {
      // Initialize client lazily to prevent top-level process.env access issues
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 1. Convert History to Google GenAI Content format
      const history: Content[] = messages.map(m => {
        const parts: Part[] = [];
        
        if (m.attachments) {
            m.attachments.forEach(att => {
                if (att.contentType.startsWith('image/')) {
                    // Extract base64 data from data URI
                    const base64Data = att.content.split(',')[1];
                    parts.push({
                        inlineData: {
                            mimeType: att.contentType,
                            data: base64Data
                        }
                    });
                } else {
                    parts.push({ text: `\nFile: ${att.name}\n\`\`\`\n${att.content}\n\`\`\`` });
                }
            });
        }
        
        if (m.content) {
            parts.push({ text: m.content });
        }
        
        // Handle empty content case
        if (parts.length === 0) parts.push({ text: ' ' });

        return {
            role: m.role,
            parts: parts
        };
      });

      // 2. Prepare Current Message Parts
      const currentParts: Part[] = [];
      if (message.attachments) {
         message.attachments.forEach(att => {
            if (att.contentType.startsWith('image/')) {
                const base64Data = att.content.split(',')[1];
                currentParts.push({
                    inlineData: {
                        mimeType: att.contentType,
                        data: base64Data
                    }
                });
            } else {
                currentParts.push({ text: `\nFile: ${att.name}\n\`\`\`\n${att.content}\n\`\`\`` });
            }
         });
      }
      if (message.content) {
        currentParts.push({ text: message.content });
      }

      // 3. Initialize Chat Session
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: agent.systemInstruction,
            tools: agent.tools,
        }
      });

      // 4. Execution Loop (Handles Function Calls)
      let keepGoing = true;
      let currentInputParts = currentParts;
      let accumulatedText = "";

      while (keepGoing) {
        // chat.sendMessageStream requires a named parameter 'message'
        const result = await chat.sendMessageStream({ message: currentInputParts });
        
        let toolCalls: FunctionCall[] = [];
        let functionResponses: FunctionResponse[] = [];
        
        for await (const chunk of result) {
            // A chunk might contain text OR function calls OR both
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantId
                            ? { ...msg, content: accumulatedText }
                            : msg
                    )
                );
            }
            
            // Check for tool calls in the chunk
            const candidates = chunk.candidates;
            if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.functionCall) {
                        // Avoid duplicates if multiple chunks send same call
                        if (!toolCalls.find(tc => tc.id === part.functionCall?.id)) {
                             toolCalls.push(part.functionCall);
                        }
                    }
                }
            }
        }

        // Check if we need to execute tools
        if (toolCalls.length > 0 && agent.executableFunctions) {
            // Execute all tools
            for (const call of toolCalls) {
                const fn = agent.executableFunctions[call.name];
                if (fn) {
                    try {
                        const result = await fn(call.args);
                        functionResponses.push({
                            name: call.name,
                            id: call.id,
                            response: { result: result }
                        });
                    } catch (err: any) {
                        functionResponses.push({
                            name: call.name,
                            id: call.id,
                            response: { error: err.message }
                        });
                    }
                }
            }

            // Send responses back to model
            if (functionResponses.length > 0) {
                 // Prepare next input as tool responses
                 currentInputParts = functionResponses.map(fr => ({ functionResponse: fr }));
                 // Loop continues to send these responses
            } else {
                keepGoing = false;
            }
        } else {
            // No tool calls, we are done
            keepGoing = false;
        }
      }

      // Finalize
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: msg.content + (msg.content ? "\n\n" : "") + "[Error generating response. Please try again.]", isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, manualAgentId]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input.trim() && attachments.length === 0) return;

      const currentAttachments = [...attachments];
      const currentInput = input;

      setInput('');
      setAttachments([]); 
      
      append({ 
        role: 'user', 
        content: currentInput,
        attachments: currentAttachments
      });
    },
    [input, attachments, append]
  );

  return {
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
  };
}