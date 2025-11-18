export type ChartType = "bar" | "line" | "pie";

export type AggregateFunction = "sum" | "count" | "avg" | "min" | "max";

export interface ChartConfig {
  xAxis: string;
  yAxis: string;
  aggregate: AggregateFunction;
  groupBy?: string;
  barLayout?: "grouped" | "stacked";
}

export interface GraphConfig {
  id: string;
  name: string;
  query: string;
  location: string;
  chartType: ChartType;
  chartConfig: ChartConfig;
}

export interface QueryResult {
  success: boolean;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

