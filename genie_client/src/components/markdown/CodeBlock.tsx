"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  node?: any;
}

export const CodeBlock = ({
  children,
  className,
  node,
  ...props
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  // Extract language from className (e.g., "language-python")
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // Helper to extract text from React children recursively
  const extractText = (node: any): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && typeof node === "object" && "props" in node) {
      return extractText(node.props.children);
    }
    return "";
  };

  const codeContent = extractText(children).replace(/\n$/, "");

  // Handle inline code - render as simple span/code
  const isInline = !match && !String(children).includes("\n");
  if (isInline) {
    return (
      <code
        className={cn(
          "bg-gray-200/50 text-gray-800 rounded px-1.5 py-0.5 text-sm font-mono",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100/50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            {language || "text"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
            "text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100",
            copied &&
              "text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto p-4">
        <code
          className={cn(
            "block font-mono text-sm leading-relaxed whitespace-pre-wrap !bg-transparent !p-0",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      </div>
    </div>
  );
};
