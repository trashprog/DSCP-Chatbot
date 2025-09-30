import React from 'react';
import { WormLoader } from './WormLoader';

// --- text styling ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- Define custom components for styling the markdown ---
const markdownComponents = {
  h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-2" {...props} />,
  h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-4" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-3" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2" {...props} />,
  a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" {...props} />, // Adjusted link color for dark bg
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-gray-700 text-gray-200 rounded px-1 text-sm" {...props}>
        {children}
      </code>
    );
  },
};

export const MessageItem = ({ text, sender, image }) => {
  const isAssistant = sender === 'assistant';
  const isUser = sender === 'user';
  const isTextEmpty = !text || text.trim() === '';
  const hasImage = !!image;

  // --- USER MESSAGE ---
  // (This block is already correct)
  if (isUser) {
    if (isTextEmpty && !hasImage) {
      return null;
    }
    return (
      <div className="flex flex-col items-end my-4">
        <div className="w-fit max-w-md text-outfit rounded-xl shadow overflow-hidden bg-[#ec7c32] text-white">
          {hasImage && (
            <img
              src={image}
              alt="User submission"
              className="bg-white p-1"
              style={{ display: 'block', width: '100%' }}
            />
          )}
          {!isTextEmpty && (
            <div className="px-4 py-3">
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ASSISTANT MESSAGE (MERGED LOGIC) ---
  if (isAssistant) {
    // Show loader ONLY if there is no text AND no image.
    if (isTextEmpty && !hasImage) {
      return (
        <div className="flex flex-col my-6">
            <div className="bg-[#574028] text-white px-4 py-3 rounded-xl shadow w-fit">
                <WormLoader />
            </div>
        </div>
      );
    }

    // Otherwise, show the message bubble with content (image, text, or both).
    return (
      <div className="flex flex-col my-6">
        <div className="w-full max-w-2xl rounded-xl text-white shadow bg-[#574028] overflow-hidden">
          {/* 1. MERGED: Image on Top (if it exists) */}
          {hasImage && (
            <img
              src={image}
              alt="Assistant response"
              className="bg-white p-1"
              style={{ display: 'block', width: '100%' }}
            />
          )}

          {/* 2. MERGED: Text Content Below (if it exists) with Markdown */}
          {!isTextEmpty && (
            <div className="px-4 py-3">
              <div className="prose prose-sm max-w-none prose-invert">
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm]}
                >
                  {text}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};