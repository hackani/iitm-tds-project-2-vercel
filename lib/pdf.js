export default async function extractPDF(url) {
  const token = process.env.BROWSERLESS_KEY;

  if (!token) {
    throw new Error("Missing BROWSERLESS_KEY");
  }

  const apiUrl = `https://chrome.browserless.io/pdf/text?token=${token}&pdf=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("Browserless PDF extraction failed: HTTP " + response.status);
  }

  const result = await response.json();

  return result.text || "";
}
