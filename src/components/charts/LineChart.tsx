"use client";

import { ResponsiveLine } from "@nivo/line";

interface LineChartProps {
  data: Array<{
    id: string | number;
    data: Array<{ x: string | number; y: number }>;
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function LineChart({ data, xAxisLabel, yAxisLabel }: LineChartProps) {
  return (
    <ResponsiveLine
      data={data}
      margin={{ top: 20, right: 130, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: false,
        reverse: false,
      }}
      yFormat=" >-.2f"
      colors={{ scheme: "nivo" }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: xAxisLabel || "X",
        legendOffset: 40,
        legendPosition: "middle",
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: yAxisLabel || "Y",
        legendOffset: -50,
        legendPosition: "middle",
      }}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={
        data.length > 1
          ? [
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 100,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
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

