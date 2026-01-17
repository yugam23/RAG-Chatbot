import React from 'react';

/**
 * Custom Markdown components for ReactMarkdown
 * Extracted for reusability and cleaner code
 */
export const markdownComponents = {
  h1: (props) => <h1 className="text-xl font-bold mb-2 text-white" {...props} />,
  h2: (props) => <h2 className="text-lg font-semibold mb-2 text-white" {...props} />,
  h3: (props) => <h3 className="text-md font-semibold mb-1 text-white" {...props} />,
  p: (props) => <p className="mb-2 last:mb-0 leading-relaxed text-gray-300" {...props} />,
  ul: (props) => <ul className="list-disc pl-4 mb-2 space-y-1 text-gray-300" {...props} />,
  ol: (props) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-gray-300" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline) {
      return (
        <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117] shadow-lg">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-xs text-gray-400 font-mono">
            <span>{match ? match[1] : 'code'}</span>
          </div>
          <div className="p-3 overflow-x-auto">
            <code className="text-sm font-mono text-gray-200" {...props}>
              {children}
            </code>
          </div>
        </div>
      );
    }

    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-white/10 text-blue-200 font-mono text-xs border border-white/5"
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-blue-500/50 pl-4 py-1 my-2 bg-blue-500/5 rounded-r italic text-gray-400"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
      {...props}
    />
  ),
};

export default markdownComponents;
