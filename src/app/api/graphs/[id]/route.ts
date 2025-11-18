import { NextRequest, NextResponse } from "next/server";
import { getGraph, saveGraph, deleteGraph } from "@/lib/storage";
import { GraphConfig } from "@/types/graph";

// GET /api/graphs/[id] - Get a single graph
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graph = getGraph(id);

    if (!graph) {
      return NextResponse.json(
        { success: false, error: "Graph not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, graph });
  } catch (error) {
    console.error("Error fetching graph:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch graph",
      },
      { status: 500 }
    );
  }
}

// PUT /api/graphs/[id] - Update a graph
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingGraph = getGraph(id);

    if (!existingGraph) {
      return NextResponse.json(
        { success: false, error: "Graph not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, query, location, chartType, chartConfig, parameters } = body;

    // Update graph with new data
    const updatedGraph: GraphConfig = {
      id,
      name: name ?? existingGraph.name,
      query: query ?? existingGraph.query,
      location: location ?? existingGraph.location,
      chartType: chartType ?? existingGraph.chartType,
      chartConfig: chartConfig ?? existingGraph.chartConfig,
      parameters: parameters ?? existingGraph.parameters,
    };

    saveGraph(updatedGraph);

    return NextResponse.json({ success: true, graph: updatedGraph });
  } catch (error) {
    console.error("Error updating graph:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update graph",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/graphs/[id] - Delete a graph
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteGraph(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Graph not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting graph:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete graph",
      },
      { status: 500 }
    );
  }
}

