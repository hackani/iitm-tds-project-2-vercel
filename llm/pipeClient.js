/**
 * AI Pipe Client
 * Works on Vercel Edge.
 *
 * Required env:
 *   PIPE_API_KEY = "your AI Pipe key"
 */

export default async function pipeAI(prompt) {
  const apiKey = process.env.PIPE_API_KEY;
  if (!apiKey) return "error: Missing PIPE_API_KEY";

  try {
    const response = await fetch("https://api.aipipe.org/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a precise data-analysis assistant. Return ONLY the final answer. " +
              "No explanations. If number → return only number. If boolean → return true/false. " +
              "If JSON → return only valid JSON. Do not include markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0
      })
    });

    if (!response.ok) {
      return `error: AI Pipe HTTP ${response.status}`;
    }

    const result = await response.json();
    const output = result?.choices?.[0]?.message?.content;

    if (!output) return "error: AI Pipe returned empty result";

    return clean(output);

  } catch (err) {
    return `error: ${err.message}`;
  }
}

function clean(str) {
  return String(str)
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
}
