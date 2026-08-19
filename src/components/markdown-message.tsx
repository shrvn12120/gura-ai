// "use client";

// import React from "react";
// import Image from "next/image";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// interface Props {
//   content: string;
// }

// const MarkdownImage = React.memo(
//   ({ src, alt }: { src?: string; alt?: string }) => {
//     if (!src) return null;

//     return (
//       <span className="block my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
//         <Image
//           src={src}
//           alt={alt || "Image"}
//           width={1200}
//           height={800}
//           className="h-auto w-full object-cover"
//           sizes="(max-width: 768px) 100vw, 700px"
//         />

//         {alt && (
//           <span className="capitalize border-t px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
//             {alt}
//           </span>
//         )}
//       </span>
//     );
//   }
// );

// MarkdownImage.displayName = "MarkdownImage";


// const MarkdownMessage = React.memo(({ content }: Props) => {
//   return (
//     <ReactMarkdown
//       remarkPlugins={[remarkGfm]}
//       urlTransform={(url) => {
//         if (
//           url.startsWith("tel:") ||
//           url.startsWith("mailto:")
//         ) {
//           return url;
//         }

//         return url;
//       }}
//       components={{
//         a: ({ href = "", children, ...props }) => {
//           const isTelOrMail =
//             href.startsWith("tel:") ||
//             href.startsWith("mailto:");

//           return (
//             <a
//               {...props}
//               href={href}
//               className="text-cyan-600 dark:text-cyan-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
//               target={isTelOrMail ? undefined : "_blank"}
//               rel={
//                 isTelOrMail
//                   ? undefined
//                   : "noopener noreferrer"
//               }
//             >
//               {children}
//             </a>
//           );
//         },


//         img: ({ src, alt }) => (
//           <MarkdownImage
//             src={src?.toString()}
//             alt={alt}
//           />
//         ),


//         p: ({ children }) => (
//           <p className="mb-3 last:mb-0 leading-relaxed">
//             {children}
//           </p>
//         ),


//         strong: ({ children }) => (
//           <strong className="font-semibold text-zinc-950 dark:text-white">
//             {children}
//           </strong>
//         ),


//         ul: ({ children }) => (
//           <ul className="list-disc pl-5 mb-4 space-y-1">
//             {children}
//           </ul>
//         ),


//         ol: ({ children }) => (
//           <ol className="list-decimal pl-5 mb-4 space-y-1">
//             {children}
//           </ol>
//         ),


//         li: ({ children }) => (
//           <li className="leading-relaxed">
//             {children}
//           </li>
//         ),


//         h1: ({ children }) => (
//           <h1 className="text-lg font-bold tracking-tight mb-2 mt-4 text-zinc-950 dark:text-white">
//             {children}
//           </h1>
//         ),


//         h2: ({ children }) => (
//           <h2 className="text-md font-semibold tracking-tight mb-2 mt-3 text-zinc-950 dark:text-white">
//             {children}
//           </h2>
//         ),


//         h3: ({ children }) => (
//           <h3 className="text-sm font-semibold mb-1 mt-2 text-zinc-950 dark:text-white">
//             {children}
//           </h3>
//         ),


//         blockquote: ({ children }) => (
//           <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">
//             {children}
//           </blockquote>
//         ),


//         table: ({ children }) => (
//           <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
//             <table className="w-full text-left text-xs border-collapse">
//               {children}
//             </table>
//           </div>
//         ),


//         thead: ({ children }) => (
//           <thead className="bg-zinc-100 dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
//             {children}
//           </thead>
//         ),


//         tbody: ({ children }) => (
//           <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
//             {children}
//           </tbody>
//         ),


//         tr: ({ children }) => (
//           <tr>{children}</tr>
//         ),


//         th: ({ children }) => (
//           <th className="px-3 py-2 font-medium">
//             {children}
//           </th>
//         ),


//         td: ({ children }) => (
//           <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
//             {children}
//           </td>
//         ),
//       }}
//     >
//       {content}
//     </ReactMarkdown>
//   );
// });


// MarkdownMessage.displayName = "MarkdownMessage";


// export default MarkdownMessage;

"use client";

import React from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatStreamedMarkdown } from "./chat-ui";

interface Props {
  content: string;
}

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

const MarkdownMessage = ({ content }: Props) => {
  const markdown = formatStreamedMarkdown(content)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href = "", children, ...props }) => {
          const isTelOrMail =
            href.startsWith("tel:") ||
            href.startsWith("mailto:");

          return (
            <a
              {...props}
              href={href}
              className="text-cyan-600 dark:text-cyan-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
              target={isTelOrMail ? undefined : "_blank"}
              rel={isTelOrMail ? undefined : "noopener noreferrer"}
            >
              {children}
            </a>
          );
        },

        img: ({ src, alt }) => (
          <MarkdownImage
            src={src?.toString()}
            alt={alt}
          />
        ),

        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">
            {children}
          </p>
        ),

        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-950 dark:text-white">
            {children}
          </strong>
        ),

        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),

        del: ({ children }) => (
          <del className="opacity-70">
            {children}
          </del>
        ),

        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-4 space-y-1">
            {children}
          </ul>
        ),

        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-4 space-y-1">
            {children}
          </ol>
        ),

        li: ({ children }) => (
          <li className="leading-relaxed">
            {children}
          </li>
        ),

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
          <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">
            {children}
          </blockquote>
        ),

        hr: () => (
          <hr className="my-4 border-zinc-200 dark:border-zinc-800" />
        ),

        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-200">
            {children}
          </pre>
        ),

        code: ({ className, children, ...props }) => {
          const isBlock = Boolean(className);

          if (isBlock) {
            return (
              <code
                {...props}
                className="font-mono"
              >
                {children}
              </code>
            );
          }

          return (
            <code
              {...props}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {children}
            </code>
          );
        },

        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
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

        tr: ({ children }) => (
          <tr>{children}</tr>
        ),

        th: ({ children }) => (
          <th className="px-3 py-2 font-medium whitespace-nowrap">
            {children}
          </th>
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
            className="mr-2 accent-cyan-500"
          />
        ),

        br: () => <br />,
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;