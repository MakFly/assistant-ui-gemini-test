
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../utils';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  variant?: 'default' | 'user';
}

const CodeBlock = ({ language, children }: { language: string; children: React.ReactNode }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  return (
    <div className="group my-4 w-full max-w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-3 py-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 transition-colors"
        >
          {isCopied ? (
            <>
              <Check size={12} className="text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="w-full overflow-x-auto bg-white">
        <SyntaxHighlighter
          style={vs}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: '1rem 1.25rem',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            minWidth: '100%', // Ensure it fills the container
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
            }
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming, variant = 'default' }) => {
  const isUser = variant === 'user';

  return (
    <div className={cn(
      "prose prose-zinc prose-sm max-w-none w-full leading-relaxed break-words",
      // Text colors
      "text-zinc-900 prose-p:text-zinc-900 prose-headings:text-zinc-900 prose-strong:text-zinc-900 prose-li:text-zinc-900",
      
      // User variant overrides for spacing
      isUser && "prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 first:prose-p:mt-0 last:prose-p:mb-0"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-4 transition-colors hover:decoration-indigo-600"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-4 list-disc pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 list-decimal pl-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1 pl-1" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mb-3 mt-5 text-xl font-bold tracking-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-2 mt-4 text-lg font-semibold" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),
          del: ({ node, ...props }) => (
            <del className="line-through text-zinc-400" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full border-collapse text-sm text-left" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-zinc-50 text-zinc-700 border-b border-zinc-200" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-zinc-100 bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="transition-colors hover:bg-zinc-50/50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold text-zinc-900" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 align-top text-zinc-700" {...props} />
          ),
          // Override pre to be a transparent wrapper since CodeBlock handles the container
          pre: ({ node, ...props }) => (
             <div className="not-prose w-full max-w-full" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            
            if (match) {
              return (
                <CodeBlock language={match[1]} {...props}>
                  {children}
                </CodeBlock>
              );
            }
            
            return (
              <code 
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[0.9em] font-medium break-words whitespace-pre-wrap",
                  isUser 
                    ? "bg-black/5 text-zinc-800" // Subtle mix for user bubble
                    : "bg-zinc-100 text-zinc-800" // Standard for white background
                )} 
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-zinc-200 pl-4 italic text-zinc-500" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-zinc-900 animate-pulse rounded-[1px]" />
      )}
    </div>
  );
};

export default MarkdownRenderer;
