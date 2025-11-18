import fs from "fs";
import path from "path";
import { GraphConfig } from "@/types/graph";

const GRAPHS_DIR = path.join(process.cwd(), "data", "graphs");

// Ensure the graphs directory exists
export function ensureGraphsDir() {
  if (!fs.existsSync(GRAPHS_DIR)) {
    fs.mkdirSync(GRAPHS_DIR, { recursive: true });
  }
}

// Get all graph configurations
export function getAllGraphs(): GraphConfig[] {
  ensureGraphsDir();
  const files = fs.readdirSync(GRAPHS_DIR);
  const graphs: GraphConfig[] = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const filePath = path.join(GRAPHS_DIR, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const graph = JSON.parse(content) as GraphConfig;
        graphs.push(graph);
      } catch (error) {
        console.error(`Error reading graph file ${file}:`, error);
      }
    }
  }

  return graphs;
}

// Get a single graph by ID
export function getGraph(id: string): GraphConfig | null {
  ensureGraphsDir();
  const filePath = path.join(GRAPHS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as GraphConfig;
  } catch (error) {
    console.error(`Error reading graph ${id}:`, error);
    return null;
  }
}

// Save a graph configuration
export function saveGraph(graph: GraphConfig): void {
  ensureGraphsDir();
  const filePath = path.join(GRAPHS_DIR, `${graph.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), "utf-8");
}

// Delete a graph configuration
export function deleteGraph(id: string): boolean {
  ensureGraphsDir();
  const filePath = path.join(GRAPHS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting graph ${id}:`, error);
    return false;
  }
}

// Generate a unique ID for a new graph
export function generateGraphId(): string {
  return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

