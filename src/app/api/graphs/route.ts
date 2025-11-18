import { NextRequest, NextResponse } from "next/server";
import { getAllGraphs, saveGraph, generateGraphId } from "@/lib/storage";
import { GraphConfig } from "@/types/graph";

// GET /api/graphs - List all graphs
export async function GET() {
  try {
    const graphs = getAllGraphs();
    return NextResponse.json({ success: true, graphs });
  } catch (error) {
    console.error("Error fetching graphs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch graphs",
      },
      { status: 500 }
    );
  }
}

// POST /api/graphs - Create a new graph
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, query, location, chartType, chartConfig, parameters } = body;

    // Validate required fields
    if (!name || !query || !chartType || !chartConfig) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, query, chartType, chartConfig",
        },
        { status: 400 }
      );
    }

    // Create new graph with generated ID
    const newGraph: GraphConfig = {
      id: generateGraphId(),
      name,
      query,
      location: location || "EU",
      chartType,
      chartConfig,
      parameters,
    };

    saveGraph(newGraph);

    return NextResponse.json({ success: true, graph: newGraph });
  } catch (error) {
    console.error("Error creating graph:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create graph",
      },
      { status: 500 }
    );
  }
}

