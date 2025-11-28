export default function extractTables(html) {
  const tables = [];
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  const foundTables = html.match(tableRegex) || [];

  for (const table of foundTables) {
    const rows = table.match(rowRegex) || [];
    const parsed = rows.map((row) => {
      const cells = [];
      let match;
      while ((match = cellRegex.exec(row)) !== null) {
        cells.push(strip(match[1]));
      }
      return cells;
    });
    tables.push(parsed);
  }
  return tables;
}

function strip(str) {
  return str.replace(/<[^>]+>/g, "").trim();
}
