import { AggregateFunction } from "@/types/graph";
import { extractChartValue } from "./formatValue";

export interface TransformOptions {
  xAxis: string;
  yAxis: string;
  aggregate: AggregateFunction;
  groupBy?: string;
}

// Apply aggregation to values
function applyAggregation(
  values: number[],
  aggregateFunc: AggregateFunction
): number {
  if (values.length === 0) return 0;

  switch (aggregateFunc) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "count":
      return values.length;
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return 0;
  }
}

// Transform query results into chart data
export function transformDataForChart(
  rows: Record<string, unknown>[],
  options: TransformOptions
): Array<Record<string, string | number>> {
  const { xAxis, yAxis, aggregate, groupBy } = options;

  if (rows.length === 0) {
    return [];
  }

  // If no grouping, aggregate all values per x-axis value
  if (!groupBy) {
    const grouped = new Map<string, number[]>();

    for (const row of rows) {
      const xValue = String(extractChartValue(row[xAxis]) ?? "");
      const yRawValue = extractChartValue(row[yAxis]);
      const yValue = typeof yRawValue === "number" ? yRawValue : Number(yRawValue) || 0;

      if (!grouped.has(xValue)) {
        grouped.set(xValue, []);
      }
      grouped.get(xValue)!.push(yValue);
    }

    return Array.from(grouped.entries()).map(([xValue, yValues]) => ({
      [xAxis]: xValue,
      [yAxis]: applyAggregation(yValues, aggregate),
    }));
  }

  // If grouping, create separate series for each group
  const grouped = new Map<string, Map<string, number[]>>();

  for (const row of rows) {
    const xValue = String(extractChartValue(row[xAxis]) ?? "");
    const yRawValue = extractChartValue(row[yAxis]);
    const yValue = typeof yRawValue === "number" ? yRawValue : Number(yRawValue) || 0;
    const groupValue = String(extractChartValue(row[groupBy]) ?? "");

    if (!grouped.has(xValue)) {
      grouped.set(xValue, new Map());
    }

    const xGroup = grouped.get(xValue)!;
    if (!xGroup.has(groupValue)) {
      xGroup.set(groupValue, []);
    }
    xGroup.get(groupValue)!.push(yValue);
  }

  // Transform to array format
  const result: Array<Record<string, string | number>> = [];

  for (const [xValue, groups] of grouped.entries()) {
    const dataPoint: Record<string, string | number> = {
      [xAxis]: xValue,
    };

    for (const [groupValue, yValues] of groups.entries()) {
      dataPoint[groupValue] = applyAggregation(yValues, aggregate);
    }

    result.push(dataPoint);
  }

  return result;
}

// Get available columns from query results
export function getAvailableColumns(
  rows: Record<string, unknown>[]
): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

// Validate chart configuration
export function validateChartConfig(
  columns: string[],
  xAxis: string,
  yAxis: string,
  groupBy?: string
): { valid: boolean; error?: string } {
  if (!columns.includes(xAxis)) {
    return { valid: false, error: `X-axis column "${xAxis}" not found in data` };
  }

  if (!columns.includes(yAxis)) {
    return { valid: false, error: `Y-axis column "${yAxis}" not found in data` };
  }

  if (groupBy && !columns.includes(groupBy)) {
    return {
      valid: false,
      error: `Group by column "${groupBy}" not found in data`,
    };
  }

  return { valid: true };
}

