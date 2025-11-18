"use client";

import { ResponsiveBar } from "@nivo/bar";

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  keys: string[];
  indexBy: string;
  yAxisLabel?: string;
  layout?: "grouped" | "stacked";
}

export function BarChart({
  data,
  keys,
  indexBy,
  yAxisLabel,
  layout = "grouped",
}: BarChartProps) {
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      margin={{ top: 20, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      groupMode={layout}
      colors={{ scheme: "nivo" }}
      borderColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: indexBy,
        legendPosition: "middle",
        legendOffset: 40,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: yAxisLabel || keys[0],
        legendPosition: "middle",
        legendOffset: -50,
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      legends={
        keys.length > 1
          ? [
              {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]
          : []
      }
      theme={{
        background: "#ffffff",
        text: {
          fill: "#000000",
        },
        axis: {
          ticks: {
            line: {
              stroke: "#000000",
            },
            text: {
              fill: "#000000",
            },
          },
          legend: {
            text: {
              fill: "#000000",
              fontWeight: 600,
            },
          },
        },
        grid: {
          line: {
            stroke: "#e5e5e5",
            strokeWidth: 1,
          },
        },
        legends: {
          text: {
            fill: "#000000",
          },
        },
      }}
    />
  );
}

