export const config = {
  runtime: "edge"
};

import solveQuiz from "../llm/hybridSolver.js";

export default async function handler(req) {
  // Only POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Safe JSON parse
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, secret, url } = body || {};

  // Required fields
  if (!email || !secret || !url) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Verify secret
  if (secret !== process.env.QUIZ_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid secret" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Run hybrid solver for multi-step quiz
  const result = await solveQuiz({ email, secret, startUrl: url });

  // Return result
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
