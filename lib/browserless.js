export default async function renderPage(url) {
  const token = process.env.BROWSERLESS_KEY;

  const response = await fetch(
    `https://chrome.browserless.io/content?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    }
  );

  if (!response.ok) {
    throw new Error("Browserless failed to render page: " + response.status);
  }

  const html = await response.text();

  // Extract text from HTML manually (simple + Edge-compatible)
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { html, text };
}
