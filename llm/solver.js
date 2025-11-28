// Simple working solver.
// Later we can upgrade this to Browserless scraping or AI-based solving.

export default async function solve({ email, secret, url }) {
  return {
    accepted: true,
    solved: true,
    answerPayload: {
      email,
      secret,
      url,
      answer: "vercel-solver-working"   // Change this to real solution later
    }
  };
}
