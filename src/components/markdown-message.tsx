"use client";

import React, { useMemo } from "react";
import Image from "next/image";
// 1. ADD defaultUrlTransform TO YOUR IMPORTS BELOW
import ReactMarkdown, { type Components, defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

/* =========================================================
   RTL / THAANA DETECTION UTILITY
========================================================= */
function getTextDirection(text: string): "rtl" | "ltr" {
  if (!text) return "ltr";

  const rtlRegex = /[\u0780-\u07BF\u0600-\u06FF\u0590-\u05FF]/;

  const cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .trim();

  for (const char of cleanText) {
    if (rtlRegex.test(char)) return "rtl";
    if (/[a-zA-Z]/.test(char)) return "ltr";
  }

  return "ltr";
}

/* =========================================================
   MARKDOWN IMAGE COMPONENT
========================================================= */
const MarkdownImage = React.memo(
  ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;

    return (
      <span className="block my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Image
          src={src}
          alt={alt || "Image"}
          width={1200}
          height={800}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
        />

        {alt && (
          <span className="block border-t px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            {alt}
          </span>
        )}
      </span>
    );
  }
);

MarkdownImage.displayName = "MarkdownImage";

/* =========================================================
   MARKDOWN MESSAGE COMPONENT
========================================================= */
const MarkdownMessage = ({ content }: Props) => {
  const markdown = useMemo(() => content, [content]);

  const dir = useMemo(() => getTextDirection(content), [content]);
  const isRtl = dir === "rtl";

  const markdownComponents = useMemo<Components>(
    () => ({
      a: ({ href = "", children, ...props }) => {
        const isTelOrMail =
          href.startsWith("tel:") || href.startsWith("mailto:");

        return (
          <a
            {...props}
            href={href}
            dir="ltr"
            className="text-cyan-600 dark:text-cyan-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
            target={isTelOrMail ? undefined : "_blank"}
            rel={isTelOrMail ? undefined : "noopener noreferrer"}
          >
            {children}
          </a>
        );
      },

      img: ({ src, alt }) => <MarkdownImage src={src?.toString()} alt={alt} />,

      p: ({ children }) => (
        <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
      ),

      strong: ({ children }) => (
        <strong dir="ltr" className={`font-semibold text-zinc-950 dark:text-white `}>
          {children}
        </strong>
      ),

      em: ({ children }) => <em className="italic">{children}</em>,

      del: ({ children }) => <del className="opacity-70">{children}</del>,

      ul: ({ children }) => (
        <ul
          className={`list-disc mb-4 space-y-1 ${
            isRtl ? "pr-5 pl-0" : "pl-5 pr-0"
          }`}
        >
          {children}
        </ul>
      ),

      ol: ({ children }) => (
        <ol
          className={`list-decimal mb-4 space-y-1 ${
            isRtl ? "pr-5 pl-0" : "pl-5 pr-0"
          }`}
        >
          {children}
        </ol>
      ),

      li: ({ children }) => <li className="leading-relaxed">{children}</li>,

      h1: ({ children }) => (
        <h1 className="text-lg font-bold tracking-tight mb-2 mt-4 text-zinc-950 dark:text-white">
          {children}
        </h1>
      ),

      h2: ({ children }) => (
        <h2 className="text-base font-semibold tracking-tight mb-2 mt-4 text-zinc-950 dark:text-white">
          {children}
        </h2>
      ),

      h3: ({ children }) => (
        <h3 className="text-sm font-semibold mb-1 mt-3 text-zinc-950 dark:text-white">
          {children}
        </h3>
      ),

      blockquote: ({ children }) => (
        <blockquote
          className={`my-3 italic text-zinc-600 dark:text-zinc-400 ${
            isRtl
              ? "border-r-2 pr-4 border-zinc-300 dark:border-zinc-700"
              : "border-l-2 pl-4 border-zinc-300 dark:border-zinc-700"
          }`}
        >
          {children}
        </blockquote>
      ),

      hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-800" />,

      pre: ({ children }) => (
        <pre
          dir="ltr"
          className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-200 text-left [direction:ltr]"
        >
          {children}
        </pre>
      ),

      code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className);

        if (isBlock) {
          return (
            <code {...props} className="font-mono">
              {children}
            </code>
          );
        }

        return (
          <code
            {...props}
            dir="ltr"
            className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 inline-block [direction:ltr]"
          >
            {children}
          </code>
        );
      },

      table: ({ children }) => (
        <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table
            className={`w-full text-xs border-collapse ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            {children}
          </table>
        </div>
      ),

      thead: ({ children }) => (
        <thead className="bg-zinc-100 dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
          {children}
        </thead>
      ),

      tbody: ({ children }) => (
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {children}
        </tbody>
      ),

      tr: ({ children }) => <tr>{children}</tr>,

      th: ({ children }) => (
        <th className="px-3 py-2 font-medium whitespace-nowrap">{children}</th>
      ),

      td: ({ children }) => (
        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
          {children}
        </td>
      ),

      input: ({ type, checked, disabled, ...props }) => (
        <input
          {...props}
          type={type}
          checked={checked}
          disabled={disabled}
          readOnly
          className={`accent-cyan-500 ${isRtl ? "ml-2" : "mr-2"}`}
        />
      ),

      br: () => <br />,
    }),
    [isRtl]
  );

  return (
    <div
      dir={dir}
      className={`w-full ${
        isRtl
          ? "text-right font-sans [direction:rtl]"
          : "text-left [direction:ltr]"
      }`}
    >
      {/* 2. PLUG IN THE urlTransform PROP HERE */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        urlTransform={(url) =>
          url.startsWith("tel:") || url.startsWith("mailto:")
            ? url
            : defaultUrlTransform(url)
        }
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;