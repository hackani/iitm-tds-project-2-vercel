export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Parse JSON safely (required on Vercel)
  let body;
  try {
    body = await req.json();
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { email, secret, url } = body || {};

  if (!email || !secret || !url) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Validate secret from Vercel environment
  if (secret !== process.env.QUIZ_SECRET) {
    return res.status(403).json({ error: "Invalid secret" });
  }

  // Load solver logic
  const solve = (await import("../llm/solver.js")).default;

  // Solve the quiz
  const result = await solve({ email, secret, url });

  // Return result
  return res.status(200).json(result);
}
