export default async function extractCSV(url) {
  const resp = await fetch(url);
  const text = await resp.text();

  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = lines.map((line) => line.split(",").map((c) => c.trim()));

  return rows;
}
