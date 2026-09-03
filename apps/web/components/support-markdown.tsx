'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

export function SupportMarkdown({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`support-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          h1: ({ children: content }) => <p className="font-bold">{content}</p>,
          h2: ({ children: content }) => <p className="font-bold">{content}</p>,
          h3: ({ children: content }) => <p className="font-bold">{content}</p>,
          img: () => null,
          table: ({ children: content }) => <div>{content}</div>,
          a: SafeLink,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function SafeLink({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const safe = href && /^https?:\/\//iu.test(href) ? href : undefined;
  if (!safe) return <span>{children}</span>;
  return (
    <a href={safe} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
}

export function SupportMessageText({ children }: { children: ReactNode }) {
  return <p className="whitespace-pre-wrap break-words">{children}</p>;
}
