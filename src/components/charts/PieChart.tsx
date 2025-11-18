"use client";

import { ResponsivePie } from "@nivo/pie";

interface PieChartProps {
  data: Array<{
    id: string | number;
    label: string;
    value: number;
  }>;
}

export function PieChart({ data }: PieChartProps) {
  return (
    <ResponsivePie
      data={data}
      margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#000000"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}
      theme={{
        background: "#ffffff",
        text: {
          fill: "#000000",
        },
      }}
    />
  );
}

