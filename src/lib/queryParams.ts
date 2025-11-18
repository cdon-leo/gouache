/**
 * Extract parameter names from a SQL query.
 * Parameters are denoted by :paramName in the query.
 * 
 * @param query - The SQL query string
 * @returns Array of unique parameter names found in the query
 */
export function extractQueryParameters(query: string): string[] {
  // Match :paramName pattern (word characters after colon)
  const paramRegex = /:(\w+)/g;
  const matches = query.matchAll(paramRegex);
  
  // Extract unique parameter names
  const paramSet = new Set<string>();
  for (const match of matches) {
    paramSet.add(match[1]);
  }
  
  return Array.from(paramSet);
}

/**
 * Replace parameters in a SQL query with their values.
 * 
 * @param query - The SQL query with :param placeholders
 * @param parameters - Object mapping parameter names to their values
 * @param parameterTypes - Object mapping parameter names to their types
 * @returns The query with parameters replaced by their values
 */
export function substituteQueryParameters(
  query: string,
  parameters: Record<string, string>,
  parameterTypes: Record<string, string>
): string {
  let result = query;
  
  for (const [name, value] of Object.entries(parameters)) {
    const type = parameterTypes[name];
    const pattern = new RegExp(`:${name}\\b`, 'g');
    
    // Format value based on type
    let formattedValue: string;
    if (type === 'number') {
      // Numbers don't need quotes
      formattedValue = value;
    } else if (type === 'date' || type === 'datetime' || type === 'text') {
      // Strings, dates, and datetimes need single quotes
      // Escape single quotes in the value
      const escapedValue = value.replace(/'/g, "\\'");
      formattedValue = `'${escapedValue}'`;
    } else {
      // Default: treat as string
      const escapedValue = value.replace(/'/g, "\\'");
      formattedValue = `'${escapedValue}'`;
    }
    
    result = result.replace(pattern, formattedValue);
  }
  
  return result;
}

