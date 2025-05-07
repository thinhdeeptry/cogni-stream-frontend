"use client";

import React from "react";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override default element styling
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold my-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-bold my-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-md font-bold my-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="font-bold my-1" {...props} />
          ),
          p: ({ node, ...props }) => <p className="my-1" {...props} />,
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-4 my-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-4 my-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-3 italic my-2"
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-primary/10 px-1 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-primary/10 p-2 rounded-md overflow-x-auto my-2 text-sm">
                <code className="font-mono" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table
                className="min-w-full divide-y divide-gray-300 border"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-primary/10" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-200" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="even:bg-primary/5" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 text-sm" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-t border-gray-300" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto rounded my-2"
              {...props}
              alt={props.alt || ""}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
