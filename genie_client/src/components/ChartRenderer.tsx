"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Chart data format returned by MCP visualization tools
 */
export interface ChartData {
  _type: "chart";
  chartType: "pie" | "bar" | "line" | "doughnut" | "radar";
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }>;
  };
  options?: {
    responsive?: boolean;
    indexAxis?: "x" | "y";
    cutout?: string;
    plugins?: {
      legend?: { position?: string; display?: boolean };
      tooltip?: { enabled?: boolean; mode?: string; intersect?: boolean };
    };
    scales?: {
      y?: { beginAtZero?: boolean };
    };
  };
}

/**
 * Check if content is chart data
 */
export const isChartData = (content: unknown): content is ChartData => {
  if (typeof content !== "object" || content === null) return false;
  const obj = content as Record<string, unknown>;
  return obj._type === "chart" && typeof obj.chartType === "string";
};

/**
 * Parse JSON string to check for chart data
 */
export const parseChartData = (content: string): ChartData | null => {
  try {
    const parsed = JSON.parse(content);
    if (isChartData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

interface ChartRendererProps {
  data: ChartData;
}

// Transform Chart.js format to Recharts format
const transformToRechartsData = (chartData: ChartData) => {
  const { labels, datasets } = chartData.data;

  if (chartData.chartType === "pie" || chartData.chartType === "doughnut") {
    // For pie/doughnut, create array of {name, value, color}
    return labels.map((label, index) => ({
      name: label,
      value: datasets[0]?.data[index] ?? 0,
      color: Array.isArray(datasets[0]?.backgroundColor)
        ? datasets[0]?.backgroundColor[index]
        : datasets[0]?.backgroundColor || `hsl(${index * 45}, 70%, 50%)`,
    }));
  }

  // For bar/line, create array with label + each dataset value
  return labels.map((label, index) => {
    const point: Record<string, string | number> = { name: label };
    datasets.forEach((dataset, dsIndex) => {
      const key = dataset.label || `Series ${dsIndex + 1}`;
      point[key] = dataset.data[index] ?? 0;
    });
    return point;
  });
};

// Get colors from dataset
const getDatasetColor = (
  dataset: ChartData["data"]["datasets"][0],
  index: number,
): string => {
  if (dataset.borderColor && typeof dataset.borderColor === "string") {
    return dataset.borderColor;
  }
  if (dataset.backgroundColor && typeof dataset.backgroundColor === "string") {
    return dataset.backgroundColor;
  }
  const defaultColors = ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF"];
  return defaultColors[index % defaultColors.length];
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  const rechartsData = transformToRechartsData(data);
  const isHorizontal = data.options?.indexAxis === "y";
  const innerRadius = data.chartType === "doughnut" ? "60%" : 0;

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={rechartsData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          outerRadius={100}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {rechartsData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                (entry as { color?: string }).color ||
                `hsl(${index * 45}, 70%, 50%)`
              }
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => {
    const datasets = data.data.datasets;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={rechartsData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isHorizontal ? (
            <>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" />
              <YAxis />
            </>
          )}
          <Tooltip />
          <Legend />
          {datasets.map((dataset, index) => (
            <Bar
              key={index}
              dataKey={dataset.label || `Series ${index + 1}`}
              fill={getDatasetColor(dataset, index)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    const datasets = data.data.datasets;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={rechartsData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {datasets.map((dataset, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={dataset.label || `Series ${index + 1}`}
              stroke={getDatasetColor(dataset, index)}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (data.chartType) {
      case "pie":
      case "doughnut":
        return renderPieChart();
      case "bar":
        return renderBarChart();
      case "line":
        return renderLineChart();
      default:
        return (
          <div className="text-gray-500">
            Unsupported chart type: {data.chartType}
          </div>
        );
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {data.title && (
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          {data.title}
        </h3>
      )}
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;
