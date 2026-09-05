'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import type { ComponentPropsWithoutRef } from 'react';
import { ExternalLink, Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function ArticleMarkdownPreview({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm italic">Chưa có nội dung xem trước. Hãy nhập nội dung Markdown ở khung soạn thảo.</p>
      </div>
    );
  }

  return (
    <div className={`article-content-preview text-slate-800 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 mb-4 border-b border-slate-200/80 pb-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-7 mb-3 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2.5 text-lg sm:text-xl font-bold text-slate-900">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-5 mb-2 text-base font-bold text-slate-900">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-3 text-[15px] sm:text-base leading-7 text-slate-700 font-normal">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3.5 ml-6 list-disc space-y-1.5 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3.5 ml-6 list-decimal space-y-1.5 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[15px] leading-7">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-r-2xl border-l-4 border-[#00873E] bg-[#E8F7EC]/40 py-3.5 px-5 text-[15px] italic text-slate-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-7 border-slate-200" />,
          img: ({ src, alt }) => {
            if (!src) return null;
            return (
              <figure className="my-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm">
                  <img
                    src={src}
                    alt={alt || ''}
                    className="w-full max-h-[520px] object-contain mx-auto"
                    loading="lazy"
                  />
                </div>
                {alt ? (
                  <figcaption className="mt-2 text-center text-xs text-slate-500 italic">
                    {alt}
                  </figcaption>
                ) : null}
              </figure>
            );
          },
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-sm divide-y divide-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-slate-900">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-slate-700">{children}</td>
          ),
          code: CodeBlock,
          a: SafeLink,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({
  inline,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-[#00873E] font-medium"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400 font-mono">
        <span>{className?.replace('language-', '') || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" /> Đã chép
            </>
          ) : (
            <>
              <Copy className="size-3" /> Sao chép
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function SafeLink({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const safe = href && /^https?:\/\//iu.test(href) ? href : undefined;
  if (!safe) {
    return (
      <span className="text-[#00873E] underline underline-offset-2 font-medium">
        {children}
      </span>
    );
  }

  return (
    <a
      href={safe}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-[#00873E] hover:text-[#006830] underline underline-offset-2 font-medium"
      {...props}
    >
      <span>{children}</span>
      <ExternalLink className="size-3 shrink-0 opacity-70" />
    </a>
  );
}
