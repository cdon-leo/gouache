# Gouache - Adhoc Dashboard Tool

A minimal tool for creating single-graph dashboards with BigQuery data visualization.

## Features

- **Create Custom Graphs**: Build bar, line, and pie charts from BigQuery data
- **SQL Query Editor**: Monaco-powered SQL editor with syntax highlighting
- **Flexible Configuration**: Configure X/Y axes, aggregation functions, and grouping
- **Persistent Storage**: Graphs saved as JSON files on the file system
- **Live Preview**: See your chart update as you configure it
- **Minimal Design**: Clean black and white interface with no unnecessary elements

## Getting Started

### Prerequisites

- Node.js 20+
- BigQuery access with Application Default Credentials configured

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the application.

## Usage

### Creating a Graph

1. Click **"Create New Graph"** on the start page
2. Enter a name for your graph
3. Write your SQL query in the editor
4. Click **"Run Query"** to execute and see results
5. Configure your chart:
   - Select chart type (Bar, Line, or Pie)
   - Choose X-axis column
   - Choose Y-axis column
   - Select aggregation function (Sum, Count, Avg, Min, Max)
   - Optionally add grouping
6. Preview your chart in real-time
7. Click **"Save Graph"** to save

### Viewing Graphs

- Select a graph from the sidebar on the start page
- The graph will automatically re-run the query and display the chart
- Click **"Edit"** to modify the graph configuration
- Click **"Delete"** to remove the graph

### Editing Graphs

1. Click **"Edit"** on a graph
2. Modify the query or chart configuration
3. Click **"Save Graph"** to update

## Architecture

### File Structure

```
/data/graphs/           # JSON storage for graph configurations
/src/
  /app/
    page.tsx            # Start page (graph list & viewer)
    /configure/
      page.tsx          # Configure/edit page
    /api/
      /query/
        route.ts        # BigQuery execution endpoint
      /graphs/
        route.ts        # List/create graphs
        /[id]/
          route.ts      # Get/update/delete specific graph
  /components/
    /charts/
      BarChart.tsx      # Nivo bar chart wrapper
      LineChart.tsx     # Nivo line chart wrapper
      PieChart.tsx      # Nivo pie chart wrapper
      ChartRenderer.tsx # Chart type router
  /lib/
    chartData.ts        # Data transformation utilities
    storage.ts          # File system storage operations
  /types/
    graph.ts            # TypeScript type definitions
```

### Graph Configuration Format

Graphs are stored as JSON files in `/data/graphs/`:

```json
{
  "id": "graph_1234567890_abc123",
  "name": "Sales by Region",
  "query": "SELECT region, SUM(sales) as total FROM ...",
  "location": "EU",
  "chartType": "bar",
  "chartConfig": {
    "xAxis": "region",
    "yAxis": "total",
    "aggregate": "sum",
    "groupBy": "product_category"
  }
}
```

### Data Flow

1. User creates/edits graph configuration
2. Configuration saved to `/data/graphs/{id}.json`
3. When viewing, query is re-executed against BigQuery
4. Results are transformed based on chart configuration
5. Nivo renders the appropriate chart type

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Nivo** - Chart library
- **Monaco Editor** - SQL editor
- **BigQuery** - Data source

## Design Philosophy

Gouache follows a minimal design approach:

- Black and white color scheme
- No shadows or gradients
- Thin borders only where necessary
- Ample whitespace
- Clean typography with Titillium Web font

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## License

Private project.
