// Handle BigQuery's complex data types
export function formatBigQueryValue(value: unknown): string | number {
  if (value === null || value === undefined) {
    return "NULL";
  }

  // Handle BigQuery DATE/DATETIME/TIMESTAMP objects
  if (typeof value === "object" && value !== null && "value" in value) {
    return String((value as { value: unknown }).value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

// Extract the actual value for chart data (returns number or string)
export function extractChartValue(value: unknown): string | number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Handle BigQuery DATE/DATETIME/TIMESTAMP objects
  if (typeof value === "object" && value !== null && "value" in value) {
    const extracted = (value as { value: unknown }).value;
    // Try to convert to number if possible
    const asNumber = Number(extracted);
    return isNaN(asNumber) ? String(extracted) : asNumber;
  }

  // Try to convert to number
  const asNumber = Number(value);
  if (!isNaN(asNumber)) {
    return asNumber;
  }

  return String(value);
}

