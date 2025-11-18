"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraphConfig } from "@/types/graph";
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
    setLoading(true);

    try {
      // Execute the query
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: graph.query,
          location: graph.location,
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
        <div className="w-80 border-r border-gray-300 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-black">Graphs</h1>
            </div>

            <button
              type="button"
              onClick={handleCreateGraph}
              className="w-full rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create New Graph
            </button>

            <div className="space-y-1">
              {graphs.length === 0 ? (
                <p className="text-sm text-gray-500">No graphs yet</p>
              ) : (
                graphs.map((graph) => (
                  <button
                    key={graph.id}
                    onClick={() => handleSelectGraph(graph)}
                    className={`w-full rounded px-4 py-3 text-left text-sm transition-colors ${
                      selectedGraph?.id === graph.id
                        ? "bg-gray-100 font-medium text-black"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {graph.name}
                  </button>
                ))
              )}
            </div>
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

              {/* Chart */}
              <div className="flex-1 rounded border border-gray-300 bg-white p-6">
                {renderChart()}
              </div>
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
