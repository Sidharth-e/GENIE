"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const renderDiagram = async () => {
      if (!data.content) return;

      try {
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        // Generate a unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, data.content);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError("Failed to render diagram. Please check the syntax.");
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

      <div className="mt-4 w-full flex justify-end">
        <span className="text-xs text-gray-400 font-mono">Mermaid Diagram</span>
      </div>
    </div>
  );
};
