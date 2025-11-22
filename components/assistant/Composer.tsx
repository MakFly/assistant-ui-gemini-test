
import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Bold, Italic, Code, Paperclip, X, FileText, FileCode, FileJson, FileType, Image as ImageIcon, List, ListOrdered, Strikethrough } from 'lucide-react';
import { cn } from '../../utils';
import { Attachment } from '../../types';

interface ComposerProps {
  input: string;
  setInput: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  attachments: Attachment[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
}

const Composer: React.FC<ComposerProps> = ({
  input,
  setInput,
  handleInputChange,
  handleSubmit,
  isLoading,
  attachments,
  onFileSelect,
  onRemoveAttachment,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, [input]);

  const insertFormat = (startTag: string, endTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newText = `${beforeText}${startTag}${selectedText}${endTag}${afterText}`;
    
    setInput(newText);

    // Restore focus and selection after render
    setTimeout(() => {
        textarea.focus();
        if (start === end) {
            // No selection: place cursor inside tags
            const newCursorPos = start + startTag.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        } else {
            // Selection: maintain selection including tags (or just wrap content)
            // Here we place cursor at the end of the formatted block for continuity
            const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Keyboard Shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertFormat('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertFormat('_', '_');
      } else if (e.shiftKey && (e.key === 'x' || e.key === 'X')) {
         // Strikethrough shortcut (Ctrl+Shift+X)
         e.preventDefault();
         insertFormat('~~', '~~');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (att: Attachment) => {
    if (att.contentType.startsWith('image/')) return <ImageIcon size={20} />;
    
    const ext = att.name.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'c', 'cpp'].includes(ext || '')) return <FileCode size={20} />;
    if (['json', 'yaml', 'xml'].includes(ext || '')) return <FileJson size={20} />;
    if (['md', 'txt'].includes(ext || '')) return <FileText size={20} />;
    return <FileType size={20} />;
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm ring-offset-2 focus-within:ring-2 focus-within:ring-indigo-500/20">
          
          {/* Detailed Attachment List - Compact Card Layout */}
          {attachments.length > 0 && (
            <div className="flex gap-3 overflow-x-auto p-3 border-b border-zinc-100 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
              {attachments.map((att, i) => (
                <div 
                  key={i} 
                  onClick={() => setPreviewAttachment(att)}
                  className="group relative flex w-48 flex-none cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 pr-3 transition-all hover:border-indigo-300/50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
                >
                  {/* Icon / Thumbnail */}
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-zinc-100",
                    att.contentType.startsWith('image/') ? "bg-zinc-100" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {att.contentType.startsWith('image/') ? (
                      <img 
                        src={att.content} 
                        alt={att.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getFileIcon(att)
                    )}
                  </div>
                  
                  {/* Text Details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs font-medium text-zinc-700 group-hover:text-indigo-900 transition-colors" title={att.name}>
                      {att.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-500">
                      {formatFileSize(att.size)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAttachment(i);
                    }} 
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 opacity-0 shadow-sm transition-all hover:bg-red-50 hover:border-red-100 hover:text-red-500 group-hover:opacity-100 z-10"
                    title="Remove file"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Send a message..."
            className="flex max-h-[400px] min-h-[128px] w-full resize-none bg-transparent px-3 pt-3 pb-2 text-[15px] leading-relaxed outline-none placeholder:text-zinc-400"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between pl-2 pr-1 pb-1">
            <div className="flex items-center gap-1">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Attach files or images"
                type="button"
              >
                <Paperclip size={16} strokeWidth={2.5} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={onFileSelect}
                accept=".txt,.md,.js,.ts,.tsx,.jsx,.py,.json,.css,.html,.c,.cpp,.java,.rb,.php,.sh,.png,.jpg,.jpeg,.webp,.gif" 
              />

              {/* Separator */}
              <div className="mx-1 h-4 w-px bg-zinc-200" />

              <button
                onClick={() => insertFormat('**', '**')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Bold (Cmd+B)"
                type="button"
              >
                <Bold size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => insertFormat('_', '_')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Italic (Cmd+I)"
                type="button"
              >
                <Italic size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => insertFormat('~~', '~~')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Strikethrough (Cmd+Shift+X)"
                type="button"
              >
                <Strikethrough size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => insertFormat('\n- ', '')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Bullet List"
                type="button"
              >
                <List size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => insertFormat('\n1. ', '')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Numbered List"
                type="button"
              >
                <ListOrdered size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => insertFormat('```\n', '\n```')}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Code Block"
                type="button"
              >
                <Code size={16} strokeWidth={2.5} />
              </button>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                (input.trim() || attachments.length > 0) && !isLoading
                  ? "bg-zinc-900 text-white hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-zinc-400">
          Gemini can make mistakes.
        </div>
      </div>

      {/* File Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "rounded-lg p-2 text-indigo-600",
                  !previewAttachment.contentType.startsWith('image/') && "bg-indigo-100/50"
                )}>
                   {getFileIcon(previewAttachment)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{previewAttachment.name}</h3>
                  <p className="text-xs text-zinc-500">{formatFileSize(previewAttachment.size)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 flex justify-center">
              {previewAttachment.contentType.startsWith('image/') ? (
                 <img 
                   src={previewAttachment.content} 
                   alt={previewAttachment.name}
                   className="max-w-full h-auto rounded-lg shadow-sm border border-zinc-200"
                 />
              ) : (
                <div className="prose prose-sm prose-zinc max-w-none w-full">
                  <pre className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs font-mono text-zinc-800 overflow-auto whitespace-pre shadow-sm">
                    {previewAttachment.content}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-zinc-100 px-6 py-4 bg-white flex justify-end">
               <button 
                 onClick={() => setPreviewAttachment(null)}
                 className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Composer;
