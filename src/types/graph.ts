export type ChartType = "bar" | "line" | "pie";

export type AggregateFunction = "sum" | "count" | "avg" | "min" | "max";

export type ParameterType = "text" | "number" | "date" | "datetime";

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  defaultValue: string;
}

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
  parameters?: ParameterDefinition[];
}

export interface QueryResult {
  success: boolean;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

