export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // SAFELY PARSE JSON BODY -- REQUIRED ON VERCEL
  let body;
  try {
    body = await req.json();   // <-- This MUST work
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { email, secret, url } = body || {};

  if (!email || !secret || !url) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (secret !== process.env.QUIZ_SECRET) {
    return res.status(403).json({ error: "Invalid secret" });
  }

  return res.status(200).json({
    ok: true,
    email,
    url
  });
}
