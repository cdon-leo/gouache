"use client";

import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";
import { ChartType } from "@/types/graph";

interface ChartRendererProps {
  chartType: ChartType;
  data: Array<Record<string, string | number>>;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  barLayout?: "grouped" | "stacked";
}

export function ChartRenderer({
  chartType,
  data,
  xAxis,
  yAxis,
  groupBy,
  barLayout = "grouped",
}: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  switch (chartType) {
    case "bar": {
      // If groupBy is used, extract all unique group values as keys
      const keys = groupBy
        ? Array.from(
            new Set(
              data.flatMap((d) =>
                Object.keys(d).filter((k) => k !== xAxis && k !== groupBy)
              )
            )
          )
        : [yAxis];

      return (
        <BarChart
          data={data}
          keys={keys}
          indexBy={xAxis}
          yAxisLabel={yAxis}
          layout={barLayout}
        />
      );
    }

    case "line": {
      // Transform data for line chart
      const lineData = groupBy
        ? // Group by logic - each group becomes a colored line
          Array.from(new Set(data.map((d) => d[groupBy]))).map((group) => ({
            id: String(group),
            data: data
              .filter((d) => d[groupBy] === group)
              .map((d) => ({
                x: String(d[xAxis]),
                y: Number(d[yAxis]) || 0,
              })),
          }))
        : // No grouping - single line
          [
            {
              id: yAxis,
              data: data.map((d) => ({
                x: String(d[xAxis]),
                y: Number(d[yAxis]) || 0,
              })),
            },
          ];

      return (
        <LineChart data={lineData} xAxisLabel={xAxis} yAxisLabel={yAxis} />
      );
    }

    case "pie": {
      // For pie chart, if groupBy is used, group by that column
      // Otherwise group by xAxis
      const pieData = groupBy
        ? Array.from(new Set(data.map((d) => d[groupBy]))).map((group) => {
            const groupData = data.filter((d) => d[groupBy] === group);
            const total = groupData.reduce(
              (sum, d) => sum + (Number(d[yAxis]) || 0),
              0
            );
            return {
              id: String(group),
              label: String(group),
              value: total,
            };
          })
        : data.map((d) => ({
            id: String(d[xAxis]),
            label: String(d[xAxis]),
            value: Number(d[yAxis]) || 0,
          }));

      return <PieChart data={pieData} />;
    }

    default:
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Unsupported chart type
        </div>
      );
  }
}

