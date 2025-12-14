"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, Move, RotateCcw, X } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

interface SandboxProps {
  code: string;
  language: string;
  className?: string;
  onClose?: () => void;
}

export const Sandbox = ({
  code,
  language,
  className,
  onClose,
}: SandboxProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSrcDoc = () => {
    // Base styles for the iframe to look decent
    const baseStyle = `
      <style>
        body { font-family: sans-serif; padding: 1rem; color: #333; }
        * { box-sizing: border-box; }
      </style>
    `;

    // Intercept console.log and errors to communicate back to parent
    const scriptInterceptor = `
      <script>
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
           window.parent.postMessage({ type: 'log', message: args.map(a => String(a)).join(' ') }, '*');
           originalLog.apply(console, args);
        };
        
        console.error = (...args) => {
           window.parent.postMessage({ type: 'error', message: args.map(a => String(a)).join(' ') }, '*');
           originalError.apply(console, args);
        };

        window.onerror = (message, source, lineno, colno, error) => {
           window.parent.postMessage({ type: 'error', message: message }, '*');
        };
      </script>
    `;

    if (language === "html" || language === "xml" || language === "markup") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            ${baseStyle}
            ${scriptInterceptor}
          </head>
          <body>
            ${code}
          </body>
        </html>
      `;
    }

    if (
      language === "javascript" ||
      language === "js" ||
      language === "typescript" ||
      language === "ts"
    ) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            ${baseStyle}
            ${scriptInterceptor}
          </head>
          <body>
            <script>
              try {
                ${code}
              } catch (e) {
                console.error(e);
              }
            </script>
          </body>
        </html>
      `;
    }

    return `<html><body><p>Language not supported for execution: ${language}</p></body></html>`;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "log") {
        setOutput((prev) => [...prev, `LOG: ${event.data.message}`]);
      } else if (event.data?.type === "error") {
        setError(event.data.message);
        setOutput((prev) => [...prev, `ERROR: ${event.data.message}`]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleReset = () => {
    setOutput([]);
    setError(null);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = getSrcDoc();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95, y: 0, x: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        height: isMinimized ? "auto" : "auto",
        width: isMinimized ? 300 : "auto",
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: "fixed",
        top: 100,
        right: 20, // Initial position top-right
        zIndex: 50,
      }}
      className={cn(
        "flex flex-col rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900",
        !isMinimized && "resize overflow-auto min-w-[400px] min-h-[300px]",
        className,
      )}
    >
      {/* Header / Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex cursor-move items-center justify-between border-b border-gray-200 bg-gray-100/80 p-2 backdrop-blur dark:border-gray-800 dark:bg-gray-800/80"
      >
        <div className="flex items-center gap-2">
          <Move className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Sandbox
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Reload"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div className="flex flex-col flex-1 p-2 gap-2 h-full">
          <div className="relative flex-1 min-h-[200px] bg-white dark:bg-black rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={getSrcDoc()}
              className="absolute inset-0 w-full h-full border-0"
              title="sandbox"
              sandbox="allow-scripts"
            />
          </div>

          {/* Console output */}
          {(output.length > 0 || error) && (
            <div className="max-h-32 shrink-0 overflow-y-auto rounded bg-gray-900 p-2 text-xs font-mono text-gray-100">
              {output.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-b border-gray-800 pb-1 mb-1 last:border-0 last:mb-0 last:pb-0",
                    line.startsWith("ERROR:")
                      ? "text-red-400"
                      : "text-gray-300",
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>,
    document.body,
  );
};
