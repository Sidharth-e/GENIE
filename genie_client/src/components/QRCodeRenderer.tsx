"use client";

import React from "react";
import QRCode from "react-qr-code";

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
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {data.description && (
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          {data.description}
        </h3>
      )}
      <div className="bg-white p-2">
        <QRCode
          value={data.content}
          size={data.size || 256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        <span className="font-medium uppercase">{data.qr_type}</span>:{" "}
        <span className="break-all">{data.raw_content}</span>
      </div>
    </div>
  );
};
