/**
 * PiPe AI client for reasoning + instruction solving
 *
 * Requires environment variable:
 *     PIPE_API_KEY = "your_api_key_here"
 *
 * The PiPe AI API endpoint typically looks like:
 *     https://api.pipezero.ai/v1/chat/completions
 *
 * If your PiPe endpoint is different, tell me and I will update it.
 */

export default async function pipeAI(prompt) {
  const apiKey = process.env.PIPE_API_KEY;

  if (!apiKey) {
    return "error: Missing PIPE_API_KEY environment variable";
  }

  try {
    const response = await fetch("https://api.pipezero.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "pipi-1.0",          // <-- Change this if your PiPe model name differs
        messages: [
          {
            role: "system",
            content:
              "You are a precise data-analysis assistant. " +
              "You must ALWAYS return answers ONLY, without explanation. " +
              "If the question asks for a number, return just the number. " +
              "If a boolean, return true/false. " +
              "If JSON, return valid JSON. No commentary."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.0
      })
    });

    if (!response.ok) {
      return `error: PiPe AI HTTP ${response.status}`;
    }

    const result = await response.json();

    const output =
      result?.choices?.[0]?.message?.content ||
      result?.choices?.[0]?.text ||
      null;

    if (!output) {
      return "error: No response content from PiPe AI";
    }

    return cleanOutput(output);
  } catch (e) {
    return `error: ${e.message}`;
  }
}

/**
 * Remove markdown, quotes, etc.
 * Ensures clean final answer.
 */
function cleanOutput(str) {
  return String(str)
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}
