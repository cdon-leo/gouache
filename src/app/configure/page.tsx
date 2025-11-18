"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ChartType, AggregateFunction, GraphConfig, ParameterDefinition, ParameterType } from "@/types/graph";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import {
  transformDataForChart,
  getAvailableColumns,
  validateChartConfig,
} from "@/lib/chartData";
import { formatBigQueryValue } from "@/lib/formatValue";
import { extractQueryParameters } from "@/lib/queryParams";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-900 text-white">
      Loading editor...
    </div>
  ),
});

interface QueryResult {
  success: boolean;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

function ConfigurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  // Form state
  const [graphName, setGraphName] = useState("");
  const [query, setQuery] = useState("SELECT 1 as test");
  const [location, setLocation] = useState("EU");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [aggregate, setAggregate] = useState<AggregateFunction>("sum");
  const [groupBy, setGroupBy] = useState("");
  const [barLayout, setBarLayout] = useState<"grouped" | "stacked">("grouped");
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);

  // UI state
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [detectedParams, setDetectedParams] = useState<string[]>([]);

  // Load existing graph if editing
  useEffect(() => {
    if (editId) {
      fetch(`/api/graphs/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.graph) {
            const graph: GraphConfig = data.graph;
            setGraphName(graph.name);
            setQuery(graph.query);
            setLocation(graph.location);
            setChartType(graph.chartType);
            setXAxis(graph.chartConfig.xAxis);
            setYAxis(graph.chartConfig.yAxis);
            setAggregate(graph.chartConfig.aggregate);
            setGroupBy(graph.chartConfig.groupBy || "");
            setBarLayout(graph.chartConfig.barLayout || "grouped");
            setParameters(graph.parameters || []);
          }
        })
        .catch((error) => console.error("Error loading graph:", error));
    }
  }, [editId]);

  // Detect parameters in query
  useEffect(() => {
    const params = extractQueryParameters(query);
    setDetectedParams(params);
    
    // Update parameters state - add new params, remove deleted ones, keep existing definitions
    setParameters((prevParams) => {
      const paramMap = new Map(prevParams.map(p => [p.name, p]));
      
      return params.map(paramName => {
        // Keep existing definition if available, otherwise create new one
        return paramMap.get(paramName) || {
          name: paramName,
          type: "text" as ParameterType,
          defaultValue: "",
        };
      });
    });
  }, [query]);

  // Update available columns when results change
  useEffect(() => {
    if (results?.success && results.rows && results.rows.length > 0) {
      const columns = getAvailableColumns(results.rows);
      setAvailableColumns(columns);

      // Auto-select first two columns if not set
      if (!xAxis && columns.length > 0) {
        setXAxis(columns[0]);
      }
      if (!yAxis && columns.length > 1) {
        setYAxis(columns[1]);
      }
    }
  }, [results, xAxis, yAxis]);

  const handleRunQuery = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Create parameters object from parameter definitions
      const paramValues: Record<string, string> = {};
      const paramTypes: Record<string, string> = {};
      
      for (const param of parameters) {
        paramValues[param.name] = param.defaultValue;
        paramTypes[param.name] = param.type;
      }

      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query, 
          location,
          parameters: paramValues,
          parameterTypes: paramTypes,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute query",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!graphName.trim()) {
      alert("Please enter a graph name");
      return;
    }

    if (!xAxis || !yAxis) {
      alert("Please configure the chart axes");
      return;
    }

    setSaving(true);

    try {
      const graphConfig: Omit<GraphConfig, "id"> = {
        name: graphName,
        query,
        location,
        chartType,
        chartConfig: {
          xAxis,
          yAxis,
          aggregate,
          groupBy: groupBy || undefined,
          barLayout: chartType === "bar" ? barLayout : undefined,
        },
        parameters: parameters.length > 0 ? parameters : undefined,
      };

      const url = editId ? `/api/graphs/${editId}` : "/api/graphs";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(graphConfig),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
      } else {
        alert(`Failed to save graph: ${data.error}`);
      }
    } catch (error) {
      alert(
        `Failed to save graph: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    if (!results.success) {
      return (
        <div className="rounded border border-gray-300 bg-white p-4 text-red-600">
          <h3 className="mb-2 font-semibold">Error</h3>
          <p className="text-sm">{results.error}</p>
        </div>
      );
    }

    if (!results.rows || results.rows.length === 0) {
      return (
        <div className="rounded border border-gray-300 bg-white p-4 text-gray-600">
          No results returned
        </div>
      );
    }

    const columns = Object.keys(results.rows[0]);

    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {results.rowCount} row{results.rowCount !== 1 ? "s" : ""} returned
        </p>
        <div className="max-h-[300px] overflow-auto rounded border border-gray-300">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.rows.slice(0, 100).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
                    >
                      {formatBigQueryValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChartPreview = () => {
    if (!results?.success || !results.rows || !xAxis || !yAxis) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Configure chart and run query to see preview
        </div>
      );
    }

    const validation = validateChartConfig(
      availableColumns,
      xAxis,
      yAxis,
      groupBy
    );

    if (!validation.valid) {
      return (
        <div className="flex h-full items-center justify-center text-red-600">
          {validation.error}
        </div>
      );
    }

    const transformedData = transformDataForChart(results.rows, {
      xAxis,
      yAxis,
      aggregate,
      groupBy,
    });

    return (
      <ChartRenderer
        chartType={chartType}
        data={transformedData}
        xAxis={xAxis}
        yAxis={yAxis}
        groupBy={groupBy}
        barLayout={barLayout}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">
            {editId ? "Edit Graph" : "Create Graph"}
          </h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Graph Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black">
                Graph Name
              </label>
              <input
                type="text"
                value={graphName}
                onChange={(e) => setGraphName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                placeholder="Enter graph name"
              />
            </div>

            {/* Query Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">
                  SQL Query
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                >
                  <option value="EU">EU (Belgium)</option>
                  <option value="US">US (Multi-region)</option>
                  <option value="us-central1">US Central 1 (Iowa)</option>
                  <option value="us-east1">US East 1 (South Carolina)</option>
                  <option value="us-east4">US East 4 (Virginia)</option>
                  <option value="us-west1">US West 1 (Oregon)</option>
                  <option value="us-west2">US West 2 (Los Angeles)</option>
                  <option value="us-west4">US West 4 (Las Vegas)</option>
                  <option value="europe-north1">
                    Europe North 1 (Finland)
                  </option>
                  <option value="europe-west1">Europe West 1 (Belgium)</option>
                  <option value="europe-west2">Europe West 2 (London)</option>
                  <option value="europe-west4">
                    Europe West 4 (Netherlands)
                  </option>
                  <option value="asia-east1">Asia East 1 (Taiwan)</option>
                  <option value="asia-northeast1">
                    Asia Northeast 1 (Tokyo)
                  </option>
                  <option value="asia-south1">Asia South 1 (Mumbai)</option>
                  <option value="asia-southeast1">
                    Asia Southeast 1 (Singapore)
                  </option>
                  <option value="australia-southeast1">
                    Australia Southeast 1 (Sydney)
                  </option>
                </select>
              </div>
              <div className="h-[300px] overflow-hidden rounded border border-gray-300">
                <MonacoEditor
                  height="300px"
                  defaultLanguage="sql"
                  theme="vs-dark"
                  value={query}
                  onChange={(value) => setQuery(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Parameters Section */}
            {detectedParams.length > 0 && (
              <div className="space-y-4 rounded border border-gray-300 p-4">
                <h2 className="text-sm font-semibold text-black">
                  Query Parameters
                </h2>
                <div className="space-y-3">
                  {parameters.map((param, index) => (
                    <div key={param.name} className="grid grid-cols-3 gap-3">
                      {/* Parameter Name */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          value={param.name}
                          disabled
                          className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>

                      {/* Parameter Type */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={param.type}
                          onChange={(e) => {
                            const newParams = [...parameters];
                            newParams[index] = {
                              ...param,
                              type: e.target.value as ParameterType,
                            };
                            setParameters(newParams);
                          }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="datetime">DateTime</option>
                        </select>
                      </div>

                      {/* Default Value */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Default Value
                        </label>
                        <input
                          type={
                            param.type === "number"
                              ? "number"
                              : param.type === "date"
                                ? "date"
                                : param.type === "datetime"
                                  ? "datetime-local"
                                  : "text"
                          }
                          value={param.defaultValue}
                          onChange={(e) => {
                            const newParams = [...parameters];
                            newParams[index] = {
                              ...param,
                              defaultValue: e.target.value,
                            };
                            setParameters(newParams);
                          }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="Enter default value"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run Query Button */}
            <button
              type="button"
              onClick={handleRunQuery}
              disabled={loading || !query.trim()}
              className="w-full rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Running Query..." : "Run Query"}
            </button>

            {/* Results */}
            {results && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-black">Results</h2>
                {renderResults()}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Chart Configuration */}
            <div className="space-y-4 rounded border border-gray-300 p-4">
              <h2 className="text-sm font-semibold text-black">
                Configure Graph
              </h2>

              {/* Chart Type */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="pie">Pie</option>
                </select>
              </div>

              {/* X-Axis */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  X-Axis Column
                </label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                  disabled={availableColumns.length === 0}
                >
                  <option value="">Select column</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Y-Axis */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Y-Axis Column
                </label>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                  disabled={availableColumns.length === 0}
                >
                  <option value="">Select column</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aggregate */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Aggregate
                </label>
                <select
                  value={aggregate}
                  onChange={(e) =>
                    setAggregate(e.target.value as AggregateFunction)
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                >
                  <option value="sum">Sum</option>
                  <option value="count">Count</option>
                  <option value="avg">Average</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                </select>
              </div>

              {/* Group By */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Group By Column (optional)
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                  disabled={availableColumns.length === 0}
                >
                  <option value="">None</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bar Layout (only for bar charts with groupBy) */}
              {chartType === "bar" && groupBy && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Bar Layout
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="grouped"
                        checked={barLayout === "grouped"}
                        onChange={(e) =>
                          setBarLayout(e.target.value as "grouped" | "stacked")
                        }
                        className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                      />
                      <span>Side by side</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="stacked"
                        checked={barLayout === "stacked"}
                        onChange={(e) =>
                          setBarLayout(e.target.value as "grouped" | "stacked")
                        }
                        className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                      />
                      <span>Stacked</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Chart Preview */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-black">Preview</h2>
              <div className="h-[400px] rounded border border-gray-300 bg-white p-4">
                {renderChartPreview()}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !graphName.trim()}
              className="w-full rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Graph"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ConfigurePageContent />
    </Suspense>
  );
}
