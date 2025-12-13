"use client";

import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stats data format returned by MCP tools
 */
export interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export interface StatsData {
  _type: "stats";
  title?: string;
  items: StatItem[];
}

/**
 * Check if content is Stats data
 */
export const isStatsData = (content: unknown): content is StatsData => {
  if (typeof content !== "object" || content === null) return false;
  const obj = content as Record<string, unknown>;
  return obj._type === "stats" && Array.isArray(obj.items);
};

/**
 * Parse JSON string to check for Stats data
 */
export const parseStatsData = (content: string): StatsData | null => {
  try {
    const parsed = JSON.parse(content);
    if (isStatsData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

interface StatsRendererProps {
  data: StatsData;
}

export const StatsRenderer: React.FC<StatsRendererProps> = ({ data }) => {
  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {data.title && (
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          {data.title}
        </h3>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col rounded-md border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-500">
              {item.label}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {item.value}
              </span>
              {item.change && (
                <span
                  className={cn(
                    "flex items-center text-sm font-medium",
                    getTrendColor(item.trend),
                  )}
                >
                  {getTrendIcon(item.trend)}
                  <span className="ml-1">{item.change}</span>
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-2 text-xs text-gray-500">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
