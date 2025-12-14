"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Check, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  copySvgAsPngToClipboard,
  downloadSvgAsPng,
} from "@/lib/download-utils";

/**
 * Mermaid data format returned by MCP tools
 */
export interface MermaidData {
  _type: "mermaid";
  content: string;
  description?: string;
}

/**
 * Check if content is Mermaid data
 */
export const isMermaidData = (content: unknown): content is MermaidData => {
  if (typeof content !== "object" || content === null) return false;
  const obj = content as Record<string, unknown>;
  return obj._type === "mermaid" && typeof obj.content === "string";
};

/**
 * Parse JSON string to check for Mermaid data
 */
export const parseMermaidData = (content: string): MermaidData | null => {
  try {
    const parsed = JSON.parse(content);
    if (isMermaidData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    // If regular text content looks like mermaid code, we could theoretically support that too
    // but for now let's stick to the structured format
    return null;
  }
};

interface MermaidRendererProps {
  data: MermaidData;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isCopiedImage, setIsCopiedImage] = useState(false);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      const fileName = `mermaid-diagram-${Date.now()}`;
      await downloadSvgAsPng(svg, fileName);
    }
  };

  const handleCopyImage = async () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      try {
        await copySvgAsPngToClipboard(svg);
        setIsCopiedImage(true);
        setTimeout(() => setIsCopiedImage(false), 2000);
      } catch {
        // Ignore errors
      }
    }
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!data.content) return;

      try {
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          suppressErrorRendering: true,
          // Disable htmlLabels to allow exporting as PNG (foreignObject taints canvas)
          flowchart: { htmlLabels: false },
          htmlLabels: false,
        });

        // Generate a unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, data.content);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError(
          err instanceof Error
            ? `Failed to render diagram: ${err.message}`
            : "Failed to render diagram. Please check the syntax.",
        );
      }
    };

    renderDiagram();
  }, [data.content]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {data.description && (
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          {data.description}
        </h3>
      )}

      <div
        ref={containerRef}
        className={cn("w-full overflow-x-auto", error ? "text-red-500" : "")}
      >
        {error ? (
          <div className="p-4 bg-red-50 rounded text-sm text-red-600">
            {error}
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
              {data.content}
            </pre>
          </div>
        ) : (
          <div
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {!error && svgContent && (
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyImage}
            className="gap-2"
          >
            {isCopiedImage ? (
              <Check className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            {isCopiedImage ? "Copied Image" : "Copy Image"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      )}

      <div className="mt-4 w-full flex justify-end">
        <span className="text-xs text-gray-400 font-mono">Mermaid Diagram</span>
      </div>
    </div>
  );
};
