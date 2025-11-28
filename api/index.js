export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json(); // works in EDGE runtime
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, secret, url } = body || {};

  if (!email || !secret || !url) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (secret !== process.env.QUIZ_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid secret" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      email,
      url,
      message: "Edge Function JSON OK!"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
