"use client";

import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  copySvgAsPngToClipboard,
  copyTextToClipboard,
  downloadSvgAsPng,
} from "@/lib/download-utils";

/**
 * QR Code data format returned by MCP tools
 */
export interface QRCodeData {
  _type: "qr_code";
  content: string;
  raw_content: string;
  qr_type: string;
  size?: number;
  description?: string;
}

/**
 * Check if content is QR code data
 */
export const isQRCodeData = (content: unknown): content is QRCodeData => {
  if (typeof content !== "object" || content === null) return false;
  const obj = content as Record<string, unknown>;
  return obj._type === "qr_code" && typeof obj.content === "string";
};

/**
 * Parse JSON string to check for QR code data
 */
export const parseQRCodeData = (content: string): QRCodeData | null => {
  try {
    const parsed = JSON.parse(content);
    if (isQRCodeData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

interface QRCodeRendererProps {
  data: QRCodeData;
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);

  const handleCopyValue = async () => {
    try {
      await copyTextToClipboard(data.content);
      setIsCopiedText(true);
      setTimeout(() => setIsCopiedText(false), 2000);
    } catch {
      // Ignore errors
    }
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      const fileName = `qrcode-${Date.now()}`;
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

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {data.description && (
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          {data.description}
        </h3>
      )}
      <div ref={containerRef} className="bg-white p-2">
        <QRCode
          value={data.content}
          size={data.size || 256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyValue}
          className="gap-2"
        >
          {isCopiedText ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCopiedText ? "Copied Data" : "Copy Data"}
        </Button>
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

      <div className="mt-4 text-center text-sm text-gray-500">
        <span className="font-medium uppercase">{data.qr_type}</span>:{" "}
        <span className="break-all">{data.raw_content}</span>
      </div>
    </div>
  );
};
