function extractQueryParameters(query) {
  // Match :paramName pattern (word characters after colon)
  const paramRegex = /:(\w+)/g;
  const matches = query.matchAll(paramRegex);
  
  // Extract unique parameter names
  const paramSet = new Set();
  for (const match of matches) {
    paramSet.add(match[1]);
  }
  
  return Array.from(paramSet);
}

const query = "select\n\torder_date,\n\tcount(*) num\n\nfrom `fyndiq.DW_integration.joint_fact_orderrows`\nwhere\n\tbranch = :branch\n\tand order_date between :start_date and current_date() - 1\n\ngroup by 1\norder by 1";

console.log(extractQueryParameters(query));
