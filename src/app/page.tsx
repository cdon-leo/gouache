"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraphConfig, ParameterDefinition } from "@/types/graph";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { transformDataForChart } from "@/lib/chartData";

interface QueryResult {
  success: boolean;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

export default function Home() {
  const router = useRouter();
  const [graphs, setGraphs] = useState<GraphConfig[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<GraphConfig | null>(null);
  const [chartData, setChartData] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParameters, setCurrentParameters] = useState<
    Record<string, string>
  >({});

  // Load all graphs on mount
  useEffect(() => {
    loadGraphs();
  }, []);

  const loadGraphs = async () => {
    try {
      const response = await fetch("/api/graphs");
      const data = await response.json();

      if (data.success) {
        setGraphs(data.graphs);
        // Auto-select first graph if available
        if (data.graphs.length > 0 && !selectedGraph) {
          handleSelectGraph(data.graphs[0]);
        }
      }
    } catch (error) {
      console.error("Error loading graphs:", error);
    }
  };

  const handleSelectGraph = async (graph: GraphConfig) => {
    setSelectedGraph(graph);
    setChartData(null);
    setError(null);

    // Initialize parameters with default values
    const defaultParams: Record<string, string> = {};
    if (graph.parameters) {
      for (const param of graph.parameters) {
        defaultParams[param.name] = param.defaultValue;
      }
    }
    setCurrentParameters(defaultParams);

    // Load data with default parameters
    await loadGraphData(graph, defaultParams);
  };

  const loadGraphData = async (
    graph: GraphConfig,
    paramValues: Record<string, string>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Create parameter types map
      const paramTypes: Record<string, string> = {};
      if (graph.parameters) {
        for (const param of graph.parameters) {
          paramTypes[param.name] = param.type;
        }
      }

      // Execute the query
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: graph.query,
          location: graph.location,
          parameters: paramValues,
          parameterTypes: paramTypes,
        }),
      });

      const result: QueryResult = await response.json();

      if (result.success && result.rows) {
        setChartData(result.rows);
      } else {
        setError(result.error || "Failed to execute query");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to execute query"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGraph = () => {
    if (selectedGraph) {
      loadGraphData(selectedGraph, currentParameters);
    }
  };

  const handleEditGraph = () => {
    if (selectedGraph) {
      router.push(`/configure?id=${selectedGraph.id}`);
    }
  };

  const handleCreateGraph = () => {
    router.push("/configure");
  };

  const handleDeleteGraph = async () => {
    if (!selectedGraph) return;

    if (!confirm(`Are you sure you want to delete "${selectedGraph.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/graphs/${selectedGraph.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setSelectedGraph(null);
        setChartData(null);
        await loadGraphs();
      } else {
        alert(`Failed to delete graph: ${data.error}`);
      }
    } catch (error) {
      alert(
        `Failed to delete graph: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const renderChart = () => {
    if (!selectedGraph) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Select a graph to view
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading data...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="rounded border border-red-300 bg-white p-4 text-red-600">
            <h3 className="mb-2 font-semibold">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          No data available
        </div>
      );
    }

    const transformedData = transformDataForChart(chartData, {
      xAxis: selectedGraph.chartConfig.xAxis,
      yAxis: selectedGraph.chartConfig.yAxis,
      aggregate: selectedGraph.chartConfig.aggregate,
      groupBy: selectedGraph.chartConfig.groupBy,
    });

    return (
      <ChartRenderer
        chartType={selectedGraph.chartType}
        data={transformedData}
        xAxis={selectedGraph.chartConfig.xAxis}
        yAxis={selectedGraph.chartConfig.yAxis}
        groupBy={selectedGraph.chartConfig.groupBy}
        barLayout={selectedGraph.chartConfig.barLayout}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 p-6">
          <div className="relative h-full space-y-6">
            <div>
              <h1 className="text-xl text-black">Graphs</h1>
            </div>

            <div className="space-y-1">
              {graphs.length === 0 ? (
                <p className="text-sm text-gray-500">No graphs yet</p>
              ) : (
                graphs.map((graph) => (
                  <button
                    key={graph.id}
                    onClick={() => handleSelectGraph(graph)}
                    className={`w-full border-l px-2 py-1 text-left text-sm transition-colors ${
                      selectedGraph?.id === graph.id
                        ? "border-black font-medium text-black"
                        : "border-transparent text-gray-600 hover:border-gray-600 hover:text-black"
                    }`}
                  >
                    {graph.name}
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateGraph}
              className="absolute bottom-0 w-full rounded-full border border-transparent px-4 py-2 text-sm font-medium text-gray-600 hover:border-black hover:text-black"
            >
              Create New Graph
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedGraph ? (
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {selectedGraph.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedGraph.chartType.charAt(0).toUpperCase() +
                      selectedGraph.chartType.slice(1)}{" "}
                    Chart
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteGraph}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleEditGraph}
                    className="rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Parameters Section */}
              {selectedGraph.parameters &&
                selectedGraph.parameters.length > 0 && (
                  <div className="mb-6 space-y-4 rounded border border-gray-300 p-4">
                    <h3 className="text-sm font-semibold text-black">
                      Parameters
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedGraph.parameters.map((param) => (
                        <div key={param.name} className="space-y-1">
                          <label className="block text-xs font-medium text-gray-700">
                            {param.name}
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
                            value={currentParameters[param.name] || ""}
                            onChange={(e) => {
                              setCurrentParameters({
                                ...currentParameters,
                                [param.name]: e.target.value,
                              });
                            }}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleUpdateGraph}
                      disabled={loading}
                      className="w-full rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Graph"}
                    </button>
                  </div>
                )}

              {/* Chart */}
              <div className="flex-1 bg-white p-6">{renderChart()}</div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-4 text-lg text-gray-600">
                  {graphs.length === 0
                    ? "No graphs yet. Create your first graph!"
                    : "Select a graph from the sidebar"}
                </p>
                {graphs.length === 0 && (
                  <button
                    type="button"
                    onClick={handleCreateGraph}
                    className="rounded border border-black bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Create New Graph
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
